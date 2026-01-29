import { db } from "../db";
import { storage } from "../storage";
import { campaigns, commitments, adminActionLogs, refundAlerts, escrowLedger } from "@shared/schema";
import type { CampaignState } from "@shared/schema";
import { eq, and, lte, isNull, sql } from "drizzle-orm";
import { log } from "../log";

/**
 * Campaign Lifecycle Background Job
 *
 * Responsibilities:
 * 1. Find AGGREGATION campaigns past their deadline
 * 2. Evaluate success (threshold-based)
 * 3. Auto-transition to SUCCESS → PROCUREMENT or FAILED
 * 4. Process automatic refunds for FAILED campaigns
 * 5. Prevent duplicate processing via row-level locks
 *
 * Constitutional alignment:
 * - Article III §3.1: No Silent Transitions - all changes logged to adminActionLogs
 * - Article IV §4.2: Escrow integrity maintained via refund processing
 * - Actor: SYSTEM_DEADLINE_AUTOMATION for all automated transitions
 */
export class CampaignLifecycleJob {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  private readonly ACTOR = "SYSTEM_DEADLINE_AUTOMATION";
  private readonly PROCESSING_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Start the background job
   * Runs every 2 minutes
   */
  start(): void {
    if (this.intervalId) {
      log("[LIFECYCLE] Job already running");
      return;
    }

    log("[LIFECYCLE] Starting campaign lifecycle job (interval: 2min)");

    // Run immediately on start, then every interval
    this.processExpiredCampaigns().catch(error => {
      console.error("[LIFECYCLE] Error in initial run:", error);
    });

    this.intervalId = setInterval(() => {
      this.processExpiredCampaigns().catch(error => {
        console.error("[LIFECYCLE] Error in scheduled run:", error);
      });
    }, this.INTERVAL_MS);
  }

  /**
   * Stop the background job
   * Called on graceful shutdown
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      log("[LIFECYCLE] Campaign lifecycle job stopped");
    }
  }

  /**
   * Main processing loop: Find and process expired campaigns
   */
  private async processExpiredCampaigns(): Promise<void> {
    try {
      const now = new Date();

      // Find AGGREGATION campaigns past their deadline
      // Exclude campaigns with processing locks less than 5 minutes old
      const expiredCampaigns = await db
        .select({
          id: campaigns.id,
          title: campaigns.title,
          aggregationDeadline: campaigns.aggregationDeadline,
          targetUnits: campaigns.targetUnits,
          minThresholdUnits: campaigns.minThresholdUnits,
          processingLock: campaigns.processingLock,
        })
        .from(campaigns)
        .where(
          and(
            eq(campaigns.state, "AGGREGATION"),
            lte(campaigns.aggregationDeadline, now),
            // Either no lock, or lock is stale (older than timeout)
            sql`(
              ${campaigns.processingLock} IS NULL
              OR ${campaigns.processingLock} < ${new Date(Date.now() - this.PROCESSING_LOCK_TIMEOUT_MS)}
            )`
          )
        );

      if (expiredCampaigns.length === 0) {
        // No expired campaigns to process (normal case)
        return;
      }

      log(`[LIFECYCLE] Found ${expiredCampaigns.length} expired campaign(s) to process`);

      for (const campaign of expiredCampaigns) {
        try {
          await this.processSingleCampaign(campaign.id);
        } catch (error) {
          console.error(`[LIFECYCLE] Error processing campaign ${campaign.id}:`, error);
          // Continue processing other campaigns
        }
      }
    } catch (error) {
      console.error("[LIFECYCLE] Error in processExpiredCampaigns:", error);
    }
  }

  /**
   * Process a single expired campaign
   *
   * Steps:
   * 1. Acquire processing lock (row-level)
   * 2. Calculate total committed units
   * 3. Compare against threshold (minThresholdUnits || targetUnits)
   * 4. Transition to SUCCESS → PROCUREMENT or FAILED
   * 5. If FAILED, trigger automatic refunds
   * 6. Release processing lock
   */
  private async processSingleCampaign(campaignId: string): Promise<void> {
    // Step 1: Acquire processing lock
    const lockAcquired = await this.acquireProcessingLock(campaignId);
    if (!lockAcquired) {
      log(`[LIFECYCLE] Campaign ${campaignId} already being processed, skipping`);
      return;
    }

    try {
      // Fetch fresh campaign data
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        log(`[LIFECYCLE] Campaign ${campaignId} not found, releasing lock`);
        await this.releaseProcessingLock(campaignId);
        return;
      }

      // Double-check state (could have changed since query)
      if (campaign.state !== "AGGREGATION") {
        log(`[LIFECYCLE] Campaign ${campaignId} no longer in AGGREGATION state (${campaign.state}), releasing lock`);
        await this.releaseProcessingLock(campaignId);
        return;
      }

      // Step 2: Calculate total committed units
      const totalCommittedUnits = await this.getTotalCommittedUnits(campaignId);

      // Step 3: Determine threshold (fallback to targetUnits)
      const threshold = campaign.minThresholdUnits ?? campaign.targetUnits ?? 0;

      log(`[LIFECYCLE] Campaign ${campaignId}: ${totalCommittedUnits} units committed, threshold: ${threshold}`);

      // Step 4: Evaluate success
      const isSuccess = totalCommittedUnits >= threshold;

      if (isSuccess) {
        // Success path: AGGREGATION → SUCCESS → PROCUREMENT
        await this.transitionToSuccess(campaignId, "AGGREGATION", totalCommittedUnits, threshold);
        await this.transitionToProcurement(campaignId);
      } else {
        // Failure path: AGGREGATION → FAILED → Auto-refunds
        await this.transitionToFailed(campaignId, "AGGREGATION", totalCommittedUnits, threshold);
        await this.processAutoRefunds(campaignId);
      }

      // Step 6: Release processing lock
      await this.releaseProcessingLock(campaignId);

      log(`[LIFECYCLE] Campaign ${campaignId} processed successfully`);
    } catch (error) {
      console.error(`[LIFECYCLE] Error processing campaign ${campaignId}:`, error);
      // Release lock on error
      await this.releaseProcessingLock(campaignId);
      throw error;
    }
  }

  /**
   * Acquire processing lock for a campaign
   * Returns true if lock acquired, false if already locked
   */
  private async acquireProcessingLock(campaignId: string): Promise<boolean> {
    try {
      const now = new Date();

      // Atomic update: set processing lock only if null or stale
      const result = await db
        .update(campaigns)
        .set({ processingLock: now })
        .where(
          and(
            eq(campaigns.id, campaignId),
            sql`(
              ${campaigns.processingLock} IS NULL
              OR ${campaigns.processingLock} < ${new Date(Date.now() - this.PROCESSING_LOCK_TIMEOUT_MS)}
            )`
          )
        )
        .returning({ id: campaigns.id });

      return result.length > 0;
    } catch (error) {
      console.error(`[LIFECYCLE] Error acquiring lock for campaign ${campaignId}:`, error);
      return false;
    }
  }

  /**
   * Release processing lock for a campaign
   */
  private async releaseProcessingLock(campaignId: string): Promise<void> {
    try {
      await db
        .update(campaigns)
        .set({ processingLock: null })
        .where(eq(campaigns.id, campaignId));
    } catch (error) {
      console.error(`[LIFECYCLE] Error releasing lock for campaign ${campaignId}:`, error);
    }
  }

  /**
   * Get total committed units for a campaign
   */
  private async getTotalCommittedUnits(campaignId: string): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${commitments.quantity}), 0)` })
      .from(commitments)
      .where(
        and(
          eq(commitments.campaignId, campaignId),
          eq(commitments.status, "LOCKED")
        )
      );

    return result[0]?.total || 0;
  }

  /**
   * Transition campaign to SUCCESS state
   */
  private async transitionToSuccess(
    campaignId: string,
    previousState: CampaignState,
    committedUnits: number,
    threshold: number
  ): Promise<void> {
    await storage.updateCampaignState(campaignId, "SUCCESS");

    await storage.createAdminActionLog({
      campaignId,
      adminUsername: this.ACTOR,
      action: "STATE_TRANSITION",
      previousState,
      newState: "SUCCESS",
      reason: `Deadline reached. ${committedUnits} units committed (threshold: ${threshold}). Auto-transitioning to SUCCESS.`,
    });

    log(`[LIFECYCLE] Campaign ${campaignId} → SUCCESS`);
  }

  /**
   * Transition campaign to PROCUREMENT state
   * (Auto-entry from SUCCESS)
   */
  private async transitionToProcurement(campaignId: string): Promise<void> {
    await storage.updateCampaignState(campaignId, "PROCUREMENT");

    await storage.createAdminActionLog({
      campaignId,
      adminUsername: this.ACTOR,
      action: "STATE_TRANSITION",
      previousState: "SUCCESS",
      newState: "PROCUREMENT",
      reason: "Auto-transition to PROCUREMENT after success evaluation.",
    });

    log(`[LIFECYCLE] Campaign ${campaignId} → PROCUREMENT`);
  }

  /**
   * Transition campaign to FAILED state
   */
  private async transitionToFailed(
    campaignId: string,
    previousState: CampaignState,
    committedUnits: number,
    threshold: number
  ): Promise<void> {
    await storage.updateCampaignState(campaignId, "FAILED");

    await storage.createAdminActionLog({
      campaignId,
      adminUsername: this.ACTOR,
      action: "STATE_TRANSITION",
      previousState,
      newState: "FAILED",
      reason: `Deadline reached. Only ${committedUnits} units committed (threshold: ${threshold}). Auto-transitioning to FAILED.`,
    });

    log(`[LIFECYCLE] Campaign ${campaignId} → FAILED`);
  }

  /**
   * Process automatic refunds for a FAILED campaign
   *
   * For each LOCKED commitment:
   * 1. Create REFUND entry in escrow_ledger
   * 2. Update commitment status to REFUNDED
   * 3. On error, create refund alert for manual intervention
   */
  private async processAutoRefunds(campaignId: string): Promise<void> {
    try {
      // Get all LOCKED commitments for this campaign
      const lockedCommitments = await db
        .select()
        .from(commitments)
        .where(
          and(
            eq(commitments.campaignId, campaignId),
            eq(commitments.status, "LOCKED")
          )
        );

      if (lockedCommitments.length === 0) {
        log(`[LIFECYCLE] Campaign ${campaignId}: No locked commitments to refund`);
        return;
      }

      log(`[LIFECYCLE] Campaign ${campaignId}: Processing ${lockedCommitments.length} refunds`);

      let successCount = 0;
      let errorCount = 0;

      for (const commitment of lockedCommitments) {
        try {
          // Create REFUND entry in escrow ledger
          await db.insert(escrowLedger).values({
            commitmentId: commitment.id,
            campaignId: campaignId,
            entryType: "REFUND",
            amount: commitment.amount,
            actor: this.ACTOR,
            reason: "Automatic refund - campaign failed to meet threshold by deadline",
          });

          // Update commitment status to REFUNDED
          await db
            .update(commitments)
            .set({ status: "REFUNDED" })
            .where(eq(commitments.id, commitment.id));

          successCount++;
        } catch (error) {
          console.error(`[LIFECYCLE] Error processing refund for commitment ${commitment.id}:`, error);
          errorCount++;

          // Create refund alert for manual intervention
          await this.createRefundAlert(
            campaignId,
            commitment.id,
            error instanceof Error ? error.message : "Unknown error during refund processing"
          );
        }
      }

      log(`[LIFECYCLE] Campaign ${campaignId}: Refunds processed - ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      console.error(`[LIFECYCLE] Error in processAutoRefunds for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Create a refund alert for manual intervention
   */
  private async createRefundAlert(
    campaignId: string,
    commitmentId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      await db.insert(refundAlerts).values({
        campaignId,
        commitmentId,
        errorMessage,
        requiresManualIntervention: true,
      });

      log(`[LIFECYCLE] Created refund alert for commitment ${commitmentId}`);
    } catch (error) {
      console.error(`[LIFECYCLE] Error creating refund alert for commitment ${commitmentId}:`, error);
    }
  }
}

// Singleton instance
export const campaignLifecycleJob = new CampaignLifecycleJob();
