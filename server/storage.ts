import { 
  campaigns, 
  commitments, 
  escrowLedger, 
  supplierAcceptances, 
  adminActionLogs,
  type Campaign, 
  type InsertCampaign,
  type Commitment,
  type InsertCommitment,
  type EscrowEntry,
  type InsertEscrowEntry,
  type SupplierAcceptance,
  type InsertSupplierAcceptance,
  type AdminActionLog,
  type InsertAdminActionLog,
  type CampaignState,
  type CommitmentStatus,
  VALID_TRANSITIONS
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // Campaign operations
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignWithStats(id: string): Promise<(Campaign & { participantCount: number; totalCommitted: number }) | undefined>;
  getCampaignsWithStats(): Promise<(Campaign & { participantCount: number; totalCommitted: number })[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignState(id: string, state: CampaignState): Promise<Campaign | undefined>;
  
  // Commitment operations
  getCommitments(campaignId: string): Promise<Commitment[]>;
  getCommitment(id: string): Promise<Commitment | undefined>;
  getCommitmentByReference(referenceNumber: string): Promise<Commitment | undefined>;
  getCommitmentWithCampaign(referenceNumber: string): Promise<(Commitment & { campaign: Campaign }) | undefined>;
  createCommitment(commitment: InsertCommitment): Promise<Commitment>;
  updateCommitmentStatus(id: string, status: CommitmentStatus): Promise<Commitment | undefined>;
  
  // Escrow ledger operations (append-only)
  getEscrowEntries(campaignId: string): Promise<EscrowEntry[]>;
  getEscrowEntriesByCommitment(commitmentId: string): Promise<EscrowEntry[]>;
  createEscrowEntry(entry: InsertEscrowEntry): Promise<EscrowEntry>;
  getCampaignEscrowBalance(campaignId: string): Promise<number>;
  
  // Supplier acceptance
  createSupplierAcceptance(acceptance: InsertSupplierAcceptance): Promise<SupplierAcceptance>;
  getSupplierAcceptances(campaignId: string): Promise<SupplierAcceptance[]>;
  
  // Admin action logs
  createAdminActionLog(log: InsertAdminActionLog): Promise<AdminActionLog>;
  getAdminActionLogs(limit?: number): Promise<AdminActionLog[]>;
  getAdminActionLogsByCampaign(campaignId: string): Promise<AdminActionLog[]>;
}

// Generate unique reference number for commitments
function generateReferenceNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ALM-${part1}-${part2}`;
}

export class DatabaseStorage implements IStorage {
  // Campaign operations
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getCampaignWithStats(id: string): Promise<(Campaign & { participantCount: number; totalCommitted: number }) | undefined> {
    const campaign = await this.getCampaign(id);
    if (!campaign) return undefined;

    const stats = await db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${commitments.amount}::numeric), 0)::float`,
      })
      .from(commitments)
      .where(eq(commitments.campaignId, id));

    return {
      ...campaign,
      participantCount: stats[0]?.count || 0,
      totalCommitted: stats[0]?.total || 0,
    };
  }

  async getCampaignsWithStats(): Promise<(Campaign & { participantCount: number; totalCommitted: number })[]> {
    const allCampaigns = await this.getCampaigns();
    
    const campaignsWithStats = await Promise.all(
      allCampaigns.map(async (campaign) => {
        const stats = await db
          .select({
            count: sql<number>`count(*)::int`,
            total: sql<number>`coalesce(sum(${commitments.amount}::numeric), 0)::float`,
          })
          .from(commitments)
          .where(eq(commitments.campaignId, campaign.id));

        return {
          ...campaign,
          participantCount: stats[0]?.count || 0,
          totalCommitted: stats[0]?.total || 0,
        };
      })
    );

    return campaignsWithStats;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [created] = await db.insert(campaigns).values(campaign).returning();
    return created;
  }

  async updateCampaignState(id: string, state: CampaignState): Promise<Campaign | undefined> {
    const [updated] = await db
      .update(campaigns)
      .set({ state })
      .where(eq(campaigns.id, id))
      .returning();
    return updated || undefined;
  }

  // Commitment operations
  async getCommitments(campaignId: string): Promise<Commitment[]> {
    return await db
      .select()
      .from(commitments)
      .where(eq(commitments.campaignId, campaignId))
      .orderBy(desc(commitments.createdAt));
  }

  async getCommitment(id: string): Promise<Commitment | undefined> {
    const [commitment] = await db.select().from(commitments).where(eq(commitments.id, id));
    return commitment || undefined;
  }

  async getCommitmentByReference(referenceNumber: string): Promise<Commitment | undefined> {
    const [commitment] = await db
      .select()
      .from(commitments)
      .where(eq(commitments.referenceNumber, referenceNumber));
    return commitment || undefined;
  }

  async getCommitmentWithCampaign(referenceNumber: string): Promise<(Commitment & { campaign: Campaign }) | undefined> {
    const commitment = await this.getCommitmentByReference(referenceNumber);
    if (!commitment) return undefined;

    const campaign = await this.getCampaign(commitment.campaignId);
    if (!campaign) return undefined;

    return { ...commitment, campaign };
  }

  async createCommitment(insertCommitment: InsertCommitment): Promise<Commitment> {
    const referenceNumber = generateReferenceNumber();
    const [created] = await db
      .insert(commitments)
      .values({ ...insertCommitment, referenceNumber, status: "LOCKED" })
      .returning();
    return created;
  }

  async updateCommitmentStatus(id: string, status: CommitmentStatus): Promise<Commitment | undefined> {
    const [updated] = await db
      .update(commitments)
      .set({ status })
      .where(eq(commitments.id, id))
      .returning();
    return updated || undefined;
  }

  // Escrow ledger operations (append-only - no updates or deletes)
  async getEscrowEntries(campaignId: string): Promise<EscrowEntry[]> {
    return await db
      .select()
      .from(escrowLedger)
      .where(eq(escrowLedger.campaignId, campaignId))
      .orderBy(desc(escrowLedger.createdAt));
  }

  async getEscrowEntriesByCommitment(commitmentId: string): Promise<EscrowEntry[]> {
    return await db
      .select()
      .from(escrowLedger)
      .where(eq(escrowLedger.commitmentId, commitmentId))
      .orderBy(desc(escrowLedger.createdAt));
  }

  async createEscrowEntry(entry: InsertEscrowEntry): Promise<EscrowEntry> {
    const [created] = await db.insert(escrowLedger).values(entry).returning();
    return created;
  }

  async getCampaignEscrowBalance(campaignId: string): Promise<number> {
    // DERIVED BALANCE: Sum LOCKs and subtract REFUNDs/RELEASEs
    // This is the append-only ledger pattern - balances are computed, not stored
    const result = await db
      .select({
        balance: sql<number>`
          COALESCE(
            SUM(
              CASE 
                WHEN ${escrowLedger.entryType} = 'LOCK' THEN ${escrowLedger.amount}::numeric
                ELSE -${escrowLedger.amount}::numeric
              END
            ),
            0
          )::float
        `,
      })
      .from(escrowLedger)
      .where(eq(escrowLedger.campaignId, campaignId));
    
    return result[0]?.balance || 0;
  }

  // Supplier acceptance
  async createSupplierAcceptance(acceptance: InsertSupplierAcceptance): Promise<SupplierAcceptance> {
    const [created] = await db.insert(supplierAcceptances).values(acceptance).returning();
    return created;
  }

  async getSupplierAcceptances(campaignId: string): Promise<SupplierAcceptance[]> {
    return await db
      .select()
      .from(supplierAcceptances)
      .where(eq(supplierAcceptances.campaignId, campaignId))
      .orderBy(desc(supplierAcceptances.acceptedAt));
  }

  // Admin action logs
  async createAdminActionLog(log: InsertAdminActionLog): Promise<AdminActionLog> {
    const [created] = await db.insert(adminActionLogs).values(log).returning();
    return created;
  }

  async getAdminActionLogs(limit: number = 100): Promise<AdminActionLog[]> {
    return await db
      .select()
      .from(adminActionLogs)
      .orderBy(desc(adminActionLogs.createdAt))
      .limit(limit);
  }

  async getAdminActionLogsByCampaign(campaignId: string): Promise<AdminActionLog[]> {
    return await db
      .select()
      .from(adminActionLogs)
      .where(eq(adminActionLogs.campaignId, campaignId))
      .orderBy(desc(adminActionLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();
