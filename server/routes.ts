import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  type CampaignState, 
  type CommitmentStatus,
  VALID_TRANSITIONS,
  insertCommitmentSchema 
} from "@shared/schema";
import { z } from "zod";
import { createHash } from "crypto";

// Helper to compute request hash for idempotency verification
function computeRequestHash(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

// Commitment request schema with server-side validation
const commitmentRequestSchema = z.object({
  participantName: z.string().min(1, "Name is required"),
  participantEmail: z.string().email("Valid email is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

// Admin transition request schema
const transitionRequestSchema = z.object({
  newState: z.enum(["AGGREGATION", "SUCCESS", "FAILED", "FULFILLMENT", "RELEASED"]),
  reason: z.string().min(1, "Reason is required for audit trail"),
  adminUsername: z.string().min(1, "Admin username is required"),
});

// Admin authentication middleware
// SECURITY: Validates admin API key when ADMIN_API_KEY is configured (any environment)
// In development WITHOUT ADMIN_API_KEY: allows dev access for testing
// In production WITHOUT ADMIN_API_KEY: rejects all admin requests
// All admin access attempts are logged for audit trail
const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminHeader = req.headers["x-admin-auth"] as string | undefined;
  const adminUsername = req.body?.adminUsername;
  const isReadOnly = req.method === "GET";
  const adminApiKey = process.env.ADMIN_API_KEY;
  const isDevelopment = process.env.NODE_ENV === "development";
  
  // PRIORITY 1: If ADMIN_API_KEY is configured, ALWAYS enforce it (any environment)
  // This allows testing production-like security in development
  if (adminApiKey) {
    if (adminHeader !== adminApiKey) {
      console.warn(`[SECURITY] Invalid admin API key attempt: ${req.method} ${req.path} from ${req.ip}`);
      return res.status(401).json({ 
        error: "Admin authentication failed",
        message: "Invalid admin credentials. This attempt has been logged."
      });
    }
    console.log(`[ADMIN] Authenticated access via API key: ${req.method} ${req.path}`);
    return next();
  }
  
  // PRIORITY 2: Development mode without ADMIN_API_KEY - allow dev access
  if (isDevelopment) {
    // GET requests allowed (read-only, no state mutation)
    // POST requests require adminUsername or dev header
    if (isReadOnly || adminUsername || adminHeader === "development-admin") {
      return next();
    }
    // POST without adminUsername will be caught by route-level validation
    return next();
  }
  
  // PRIORITY 3: Production without ADMIN_API_KEY configured - reject all
  console.error(`[SECURITY] ADMIN_API_KEY not configured - admin endpoints disabled in production`);
  return res.status(503).json({ 
    error: "Admin endpoints unavailable",
    message: "Admin API is not configured for production. Contact platform administrator."
  });
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all campaigns with stats
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaignsWithStats();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Get single campaign with stats
  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaignWithStats(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  // Get commitments for a campaign
  app.get("/api/campaigns/:id/commitments", async (req, res) => {
    try {
      const commitments = await storage.getCommitments(req.params.id);
      res.json(commitments);
    } catch (error) {
      console.error("Error fetching commitments:", error);
      res.status(500).json({ error: "Failed to fetch commitments" });
    }
  });

  // Create a commitment (escrow lock)
  // CRITICAL: Amount is calculated SERVER-SIDE from quantity * unitPrice
  // Client-provided amount is ignored to prevent tampering
  // IDEMPOTENCY: Requires x-idempotency-key header to prevent duplicate LOCK entries
  app.post("/api/campaigns/:id/commit", async (req, res) => {
    try {
      // IDEMPOTENCY CHECK: Require x-idempotency-key header
      const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;
      if (!idempotencyKey) {
        return res.status(400).json({ 
          error: "x-idempotency-key header is required for commitment operations" 
        });
      }

      const scope = `commitment_lock:${req.params.id}`;
      const requestHash = computeRequestHash(req.body);

      // Check if this key+scope already processed
      const existingKey = await storage.getIdempotencyKey(idempotencyKey, scope);
      if (existingKey) {
        // Already processed - return cached response
        if (existingKey.response) {
          const cachedResponse = JSON.parse(existingKey.response);
          return res.status(200).json({ ...cachedResponse, _idempotent: true });
        }
        // Key exists but no response yet (unlikely race condition) - return safe response
        return res.status(200).json({ 
          message: "Request already being processed",
          _idempotent: true 
        });
      }

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.state !== "AGGREGATION") {
        return res.status(400).json({ error: "Campaign is not accepting commitments" });
      }

      // Validate request using Zod schema
      const parseResult = commitmentRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.flatten() 
        });
      }

      const { participantName, participantEmail, quantity } = parseResult.data;
      
      // SERVER-SIDE CALCULATION: amount = quantity * unitPrice
      // This prevents client-side tampering with commitment amounts
      const unitPrice = parseFloat(campaign.unitPrice);
      const calculatedAmount = quantity * unitPrice;

      const minCommitment = parseFloat(campaign.minCommitment);
      const maxCommitment = campaign.maxCommitment ? parseFloat(campaign.maxCommitment) : null;

      if (calculatedAmount < minCommitment) {
        return res.status(400).json({ 
          error: `Minimum commitment is ${minCommitment.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` 
        });
      }

      if (maxCommitment && calculatedAmount > maxCommitment) {
        return res.status(400).json({ 
          error: `Maximum commitment is ${maxCommitment.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` 
        });
      }

      // Insert idempotency key BEFORE creating commitment (catches duplicates)
      let idempotencyRecord;
      try {
        idempotencyRecord = await storage.createIdempotencyKey({
          key: idempotencyKey,
          scope,
          requestHash,
        });
      } catch (error: any) {
        // Unique constraint violation = duplicate request
        if (error.code === "23505") {
          const existing = await storage.getIdempotencyKey(idempotencyKey, scope);
          if (existing?.response) {
            const cachedResponse = JSON.parse(existing.response);
            return res.status(200).json({ ...cachedResponse, _idempotent: true });
          }
          return res.status(200).json({ message: "Request already processed", _idempotent: true });
        }
        throw error;
      }

      // Create commitment with server-calculated amount
      const commitment = await storage.createCommitment({
        campaignId: req.params.id,
        participantName,
        participantEmail,
        amount: calculatedAmount.toFixed(2),
        quantity,
      });

      // Create escrow ledger entry (LOCK) - append-only
      // Balances are DERIVED from summing entries, not stored
      await storage.createEscrowEntry({
        commitmentId: commitment.id,
        campaignId: req.params.id,
        entryType: "LOCK",
        amount: calculatedAmount.toFixed(2),
        actor: participantEmail,
        reason: "commitment_created",
      });

      // Store response in idempotency record for future retries
      await storage.updateIdempotencyKeyResponse(idempotencyRecord.id, JSON.stringify(commitment));

      res.status(201).json(commitment);
    } catch (error) {
      console.error("Error creating commitment:", error);
      res.status(500).json({ error: "Failed to create commitment" });
    }
  });

  // Get commitment by reference number
  app.get("/api/commitments/:reference", async (req, res) => {
    try {
      const commitment = await storage.getCommitmentWithCampaign(req.params.reference);
      if (!commitment) {
        return res.status(404).json({ error: "Commitment not found" });
      }
      res.json(commitment);
    } catch (error) {
      console.error("Error fetching commitment:", error);
      res.status(500).json({ error: "Failed to fetch commitment" });
    }
  });

  // Expose valid transitions for frontend consumption (prevents drift)
  app.get("/api/state-machine", async (req, res) => {
    res.json({ validTransitions: VALID_TRANSITIONS });
  });

  // Admin: Transition campaign state
  // Protected by requireAdminAuth middleware - all access is logged
  app.post("/api/admin/campaigns/:id/transition", requireAdminAuth, async (req, res) => {
    try {
      // Validate request
      const parseResult = transitionRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.flatten() 
        });
      }

      const { newState, reason, adminUsername } = parseResult.data;

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const currentState = campaign.state as CampaignState;
      const validTransitions = VALID_TRANSITIONS[currentState];

      if (!validTransitions.includes(newState as CampaignState)) {
        return res.status(400).json({ 
          error: `Invalid transition from ${currentState} to ${newState}. Valid transitions: ${validTransitions.join(', ') || 'none'}` 
        });
      }

      // Update campaign state
      const updated = await storage.updateCampaignState(req.params.id, newState as CampaignState);

      // Log admin action to append-only audit log
      await storage.createAdminActionLog({
        campaignId: req.params.id,
        adminUsername,
        action: "STATE_TRANSITION",
        previousState: currentState,
        newState: newState,
        reason,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error transitioning campaign:", error);
      res.status(500).json({ error: "Failed to transition campaign" });
    }
  });

  // Admin: Process refunds for failed campaign
  // CRITICAL: Guards against double-processing by checking commitment status
  // IDEMPOTENCY: Requires x-idempotency-key header to prevent duplicate REFUND entries
  // Protected by requireAdminAuth middleware - all access is logged
  app.post("/api/admin/campaigns/:id/refund", requireAdminAuth, async (req, res) => {
    try {
      // IDEMPOTENCY CHECK: Require x-idempotency-key header
      const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;
      if (!idempotencyKey) {
        return res.status(400).json({ 
          error: "x-idempotency-key header is required for refund operations" 
        });
      }

      const scope = `refund:${req.params.id}`;
      const requestHash = computeRequestHash(req.body);

      // Check if this key+scope already processed
      const existingKey = await storage.getIdempotencyKey(idempotencyKey, scope);
      if (existingKey) {
        if (existingKey.response) {
          const cachedResponse = JSON.parse(existingKey.response);
          return res.status(200).json({ ...cachedResponse, _idempotent: true });
        }
        return res.status(200).json({ message: "Request already processed", _idempotent: true });
      }

      const { adminUsername } = req.body;
      
      if (!adminUsername) {
        return res.status(400).json({ error: "Admin username is required for audit trail" });
      }

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.state !== "FAILED") {
        return res.status(400).json({ error: "Can only process refunds for campaigns in FAILED state" });
      }

      // Insert idempotency key BEFORE processing (catches duplicates)
      let idempotencyRecord;
      try {
        idempotencyRecord = await storage.createIdempotencyKey({
          key: idempotencyKey,
          scope,
          requestHash,
        });
      } catch (error: any) {
        if (error.code === "23505") {
          const existing = await storage.getIdempotencyKey(idempotencyKey, scope);
          if (existing?.response) {
            const cachedResponse = JSON.parse(existing.response);
            return res.status(200).json({ ...cachedResponse, _idempotent: true });
          }
          return res.status(200).json({ message: "Request already processed", _idempotent: true });
        }
        throw error;
      }

      const commitmentsList = await storage.getCommitments(req.params.id);
      let currentBalance = await storage.getCampaignEscrowBalance(req.params.id);
      let processedCount = 0;
      let skippedCount = 0;

      for (const commitment of commitmentsList) {
        // DOUBLE-PROCESSING GUARD: Only process LOCKED commitments
        if (commitment.status === "LOCKED") {
          const amountNum = parseFloat(commitment.amount);
          
          // Validate escrow balance invariant
          if (currentBalance < amountNum) {
            console.error(`Escrow balance invariant violation: balance ${currentBalance} < refund amount ${amountNum}`);
            await storage.createAdminActionLog({
              campaignId: req.params.id,
              commitmentId: commitment.id,
              adminUsername,
              action: "REFUND_INVARIANT_ERROR",
              reason: `Balance invariant violation: balance ${currentBalance} < refund ${amountNum}`,
            });
            continue;
          }
          
          // Update commitment status
          await storage.updateCommitmentStatus(commitment.id, "REFUNDED");
          
          // Create escrow ledger entry (REFUND) - append-only
          await storage.createEscrowEntry({
            commitmentId: commitment.id,
            campaignId: req.params.id,
            entryType: "REFUND",
            amount: commitment.amount,
            actor: adminUsername,
            reason: "campaign_failed_refund",
          });

          currentBalance -= amountNum;
          processedCount++;
        } else {
          skippedCount++;
        }
      }

      // Log admin action
      await storage.createAdminActionLog({
        campaignId: req.params.id,
        adminUsername,
        action: "PROCESS_REFUNDS",
        reason: `Processed ${processedCount} refunds, skipped ${skippedCount} (already processed)`,
      });

      const responseData = { 
        message: "Refunds processed successfully",
        processed: processedCount,
        skipped: skippedCount,
        finalBalance: currentBalance
      };

      // Store response for future retries
      await storage.updateIdempotencyKeyResponse(idempotencyRecord.id, JSON.stringify(responseData));

      res.json(responseData);
    } catch (error) {
      console.error("Error processing refunds:", error);
      res.status(500).json({ error: "Failed to process refunds" });
    }
  });

  // Admin: Release funds for completed campaign
  // CRITICAL: Guards against double-processing by checking commitment status
  // IDEMPOTENCY: Requires x-idempotency-key header to prevent duplicate RELEASE entries
  // Protected by requireAdminAuth middleware - all access is logged
  app.post("/api/admin/campaigns/:id/release", requireAdminAuth, async (req, res) => {
    try {
      // IDEMPOTENCY CHECK: Require x-idempotency-key header
      const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;
      if (!idempotencyKey) {
        return res.status(400).json({ 
          error: "x-idempotency-key header is required for release operations" 
        });
      }

      const scope = `release:${req.params.id}`;
      const requestHash = computeRequestHash(req.body);

      // Check if this key+scope already processed
      const existingKey = await storage.getIdempotencyKey(idempotencyKey, scope);
      if (existingKey) {
        if (existingKey.response) {
          const cachedResponse = JSON.parse(existingKey.response);
          return res.status(200).json({ ...cachedResponse, _idempotent: true });
        }
        return res.status(200).json({ message: "Request already processed", _idempotent: true });
      }

      const { adminUsername } = req.body;
      
      if (!adminUsername) {
        return res.status(400).json({ error: "Admin username is required for audit trail" });
      }

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.state !== "RELEASED") {
        return res.status(400).json({ error: "Can only release funds for campaigns in RELEASED state" });
      }

      // Insert idempotency key BEFORE processing (catches duplicates)
      let idempotencyRecord;
      try {
        idempotencyRecord = await storage.createIdempotencyKey({
          key: idempotencyKey,
          scope,
          requestHash,
        });
      } catch (error: any) {
        if (error.code === "23505") {
          const existing = await storage.getIdempotencyKey(idempotencyKey, scope);
          if (existing?.response) {
            const cachedResponse = JSON.parse(existing.response);
            return res.status(200).json({ ...cachedResponse, _idempotent: true });
          }
          return res.status(200).json({ message: "Request already processed", _idempotent: true });
        }
        throw error;
      }

      const commitmentsList = await storage.getCommitments(req.params.id);
      let currentBalance = await storage.getCampaignEscrowBalance(req.params.id);
      let processedCount = 0;
      let skippedCount = 0;

      for (const commitment of commitmentsList) {
        // DOUBLE-PROCESSING GUARD: Only process LOCKED commitments
        if (commitment.status === "LOCKED") {
          const amountNum = parseFloat(commitment.amount);
          
          // Validate escrow balance invariant
          if (currentBalance < amountNum) {
            console.error(`Escrow balance invariant violation: balance ${currentBalance} < release amount ${amountNum}`);
            await storage.createAdminActionLog({
              campaignId: req.params.id,
              commitmentId: commitment.id,
              adminUsername,
              action: "RELEASE_INVARIANT_ERROR",
              reason: `Balance invariant violation: balance ${currentBalance} < release ${amountNum}`,
            });
            continue;
          }
          
          // Update commitment status
          await storage.updateCommitmentStatus(commitment.id, "RELEASED");
          
          // Create escrow ledger entry (RELEASE) - append-only
          await storage.createEscrowEntry({
            commitmentId: commitment.id,
            campaignId: req.params.id,
            entryType: "RELEASE",
            amount: commitment.amount,
            actor: adminUsername,
            reason: "admin_release",
          });

          currentBalance -= amountNum;
          processedCount++;
        } else {
          skippedCount++;
        }
      }

      // Log admin action
      await storage.createAdminActionLog({
        campaignId: req.params.id,
        adminUsername,
        action: "RELEASE_FUNDS",
        reason: `Released ${processedCount} commitments to supplier, skipped ${skippedCount} (already processed)`,
      });

      const responseData = { 
        message: "Funds released successfully",
        processed: processedCount,
        skipped: skippedCount,
        finalBalance: currentBalance
      };

      // Store response for future retries
      await storage.updateIdempotencyKeyResponse(idempotencyRecord.id, JSON.stringify(responseData));

      res.json(responseData);
    } catch (error) {
      console.error("Error releasing funds:", error);
      res.status(500).json({ error: "Failed to release funds" });
    }
  });

  // Admin: Create new campaign
  // Protected by requireAdminAuth middleware
  // ALWAYS creates campaigns in AGGREGATION state only
  app.post("/api/admin/campaigns", requireAdminAuth, async (req, res) => {
    try {
      const { adminUsername, title, description, rules, imageUrl, targetAmount, minCommitment, maxCommitment, unitPrice, aggregationDeadline } = req.body;

      if (!adminUsername) {
        return res.status(400).json({ error: "Admin username is required for audit trail" });
      }

      // Validate required fields
      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }
      if (!rules || !rules.trim()) {
        return res.status(400).json({ error: "Rules text is required" });
      }
      if (!targetAmount || parseFloat(targetAmount) <= 0) {
        return res.status(400).json({ error: "Target amount must be positive" });
      }
      if (!unitPrice || parseFloat(unitPrice) <= 0) {
        return res.status(400).json({ error: "Unit price must be positive" });
      }
      if (!aggregationDeadline) {
        return res.status(400).json({ error: "Aggregation deadline is required" });
      }

      const deadlineDate = new Date(aggregationDeadline);
      if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
        return res.status(400).json({ error: "Aggregation deadline must be a valid future date" });
      }

      // Create campaign - ALWAYS starts in AGGREGATION state
      const campaign = await storage.createCampaign({
        title: title.trim(),
        description: description?.trim() || "",
        rules: rules.trim(),
        imageUrl: imageUrl?.trim() || null,
        targetAmount: targetAmount.toString(),
        minCommitment: minCommitment?.toString() || unitPrice.toString(),
        maxCommitment: maxCommitment?.toString() || null,
        unitPrice: unitPrice.toString(),
        state: "AGGREGATION", // ALWAYS AGGREGATION
        aggregationDeadline: deadlineDate,
        supplierAccepted: false,
      });

      // Log admin action - CAMPAIGN_CREATE
      await storage.createAdminActionLog({
        campaignId: campaign.id,
        adminUsername,
        action: "CAMPAIGN_CREATE",
        previousState: null,
        newState: "AGGREGATION",
        reason: "admin_create_campaign",
      });

      console.log(`[ADMIN] Campaign created: ${campaign.id} by ${adminUsername}`);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Admin: Get action logs (append-only audit trail)
  // Protected by requireAdminAuth middleware
  app.get("/api/admin/logs", requireAdminAuth, async (req, res) => {
    try {
      const logs = await storage.getAdminActionLogs(100);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ error: "Failed to fetch admin logs" });
    }
  });

  // Admin: Get escrow ledger for campaign (append-only transparency)
  // Protected by requireAdminAuth middleware
  app.get("/api/admin/campaigns/:id/escrow", requireAdminAuth, async (req, res) => {
    try {
      const entries = await storage.getEscrowEntries(req.params.id);
      const balance = await storage.getCampaignEscrowBalance(req.params.id);
      res.json({ entries, currentBalance: balance });
    } catch (error) {
      console.error("Error fetching escrow entries:", error);
      res.status(500).json({ error: "Failed to fetch escrow entries" });
    }
  });

  return httpServer;
}
