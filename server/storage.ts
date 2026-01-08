import { 
  campaigns, 
  commitments, 
  escrowLedger, 
  supplierAcceptances, 
  adminActionLogs,
  idempotencyKeys,
  users,
  userProfiles,
  userSessions,
  authCodes,
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
  type IdempotencyKey,
  type InsertIdempotencyKey,
  type User,
  type InsertUser,
  type UserProfile,
  type InsertUserProfile,
  type UpdateUserProfile,
  type UserSession,
  type InsertUserSession,
  type AuthCode,
  type InsertAuthCode,
  type CampaignState,
  type CommitmentStatus,
  VALID_TRANSITIONS
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, lt } from "drizzle-orm";
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
  getCommitmentsByUserId(userId: string): Promise<(Commitment & { campaign: Campaign })[]>;
  getCommitment(id: string): Promise<Commitment | undefined>;
  getCommitmentByReference(referenceNumber: string): Promise<Commitment | undefined>;
  getCommitmentWithCampaign(referenceNumber: string): Promise<(Commitment & { campaign: Campaign }) | undefined>;
  createCommitment(commitment: InsertCommitment): Promise<Commitment>;
  updateCommitmentStatus(id: string, status: CommitmentStatus): Promise<Commitment | undefined>;
  
  // Escrow ledger operations (append-only)
  getEscrowEntries(campaignId: string): Promise<EscrowEntry[]>;
  getEscrowEntriesByCommitment(commitmentId: string): Promise<EscrowEntry[]>;
  getEscrowEntriesByUserId(userId: string): Promise<(EscrowEntry & { commitment: Commitment; campaign: Campaign })[]>;
  getEscrowEntryById(id: string): Promise<(EscrowEntry & { commitment: Commitment; campaign: Campaign }) | undefined>;
  createEscrowEntry(entry: InsertEscrowEntry): Promise<EscrowEntry>;
  getCampaignEscrowBalance(campaignId: string): Promise<number>;
  
  // Supplier acceptance
  createSupplierAcceptance(acceptance: InsertSupplierAcceptance): Promise<SupplierAcceptance>;
  getSupplierAcceptances(campaignId: string): Promise<SupplierAcceptance[]>;
  
  // Admin action logs
  createAdminActionLog(log: InsertAdminActionLog): Promise<AdminActionLog>;
  getAdminActionLogs(limit?: number): Promise<AdminActionLog[]>;
  getAdminActionLogsByCampaign(campaignId: string): Promise<AdminActionLog[]>;
  
  // Idempotency keys
  getIdempotencyKey(key: string, scope: string): Promise<IdempotencyKey | undefined>;
  createIdempotencyKey(data: InsertIdempotencyKey): Promise<IdempotencyKey>;
  updateIdempotencyKeyResponse(id: string, response: string): Promise<void>;
  
  // User operations
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // User profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<UserProfile | undefined>;
  getUserWithProfile(userId: string): Promise<(User & { profile: UserProfile | null }) | undefined>;
  
  // User session operations
  getUserSession(sessionToken: string): Promise<UserSession | undefined>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  deleteUserSession(sessionToken: string): Promise<void>;
  deleteExpiredSessions(): Promise<number>;
  
  // Auth code operations
  createAuthCode(code: InsertAuthCode): Promise<AuthCode>;
  getValidAuthCode(email: string): Promise<AuthCode | undefined>;
  markAuthCodeUsed(id: string): Promise<boolean>; // Returns true if marked, false if already used
  cleanupExpiredAuthCodes(): Promise<number>;
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

  async getCommitmentsByUserId(userId: string): Promise<(Commitment & { campaign: Campaign })[]> {
    const results = await db
      .select({
        commitment: commitments,
        campaign: campaigns,
      })
      .from(commitments)
      .innerJoin(campaigns, eq(commitments.campaignId, campaigns.id))
      .where(eq(commitments.userId, userId))
      .orderBy(desc(commitments.createdAt));
    
    return results.map(r => ({
      ...r.commitment,
      campaign: r.campaign,
    }));
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

  async getEscrowEntriesByUserId(userId: string): Promise<(EscrowEntry & { commitment: Commitment; campaign: Campaign })[]> {
    const results = await db
      .select({
        escrowEntry: escrowLedger,
        commitment: commitments,
        campaign: campaigns,
      })
      .from(escrowLedger)
      .innerJoin(commitments, eq(escrowLedger.commitmentId, commitments.id))
      .innerJoin(campaigns, eq(escrowLedger.campaignId, campaigns.id))
      .where(eq(commitments.userId, userId))
      .orderBy(desc(escrowLedger.createdAt));
    
    return results.map(r => ({
      ...r.escrowEntry,
      commitment: r.commitment,
      campaign: r.campaign,
    }));
  }

  async getEscrowEntryById(id: string): Promise<(EscrowEntry & { commitment: Commitment; campaign: Campaign }) | undefined> {
    const [result] = await db
      .select({
        escrowEntry: escrowLedger,
        commitment: commitments,
        campaign: campaigns,
      })
      .from(escrowLedger)
      .innerJoin(commitments, eq(escrowLedger.commitmentId, commitments.id))
      .innerJoin(campaigns, eq(escrowLedger.campaignId, campaigns.id))
      .where(eq(escrowLedger.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.escrowEntry,
      commitment: result.commitment,
      campaign: result.campaign,
    };
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

  // Idempotency keys
  async getIdempotencyKey(key: string, scope: string): Promise<IdempotencyKey | undefined> {
    const [result] = await db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.key, key), eq(idempotencyKeys.scope, scope)));
    return result || undefined;
  }

  async createIdempotencyKey(data: InsertIdempotencyKey): Promise<IdempotencyKey> {
    const [created] = await db.insert(idempotencyKeys).values(data).returning();
    return created;
  }

  async updateIdempotencyKeyResponse(id: string, response: string): Promise<void> {
    await db
      .update(idempotencyKeys)
      .set({ response })
      .where(eq(idempotencyKeys.id, id));
  }
  
  // User operations
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values({ ...user, email: user.email.toLowerCase() }).returning();
    return created;
  }
  
  // User profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }
  
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [created] = await db.insert(userProfiles).values(profile).returning();
    return created;
  }
  
  async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<UserProfile | undefined> {
    const [updated] = await db
      .update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated || undefined;
  }
  
  async getUserWithProfile(userId: string): Promise<(User & { profile: UserProfile | null }) | undefined> {
    const user = await this.getUserById(userId);
    if (!user) return undefined;
    
    const profile = await this.getUserProfile(userId);
    return { ...user, profile: profile || null };
  }
  
  // User session operations
  async getUserSession(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
    return session || undefined;
  }
  
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [created] = await db.insert(userSessions).values(session).returning();
    return created;
  }
  
  async deleteUserSession(sessionToken: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.sessionToken, sessionToken));
  }
  
  async deleteExpiredSessions(): Promise<number> {
    const result = await db
      .delete(userSessions)
      .where(lt(userSessions.expiresAt, new Date()))
      .returning();
    return result.length;
  }
  
  // Auth code operations
  async createAuthCode(code: InsertAuthCode): Promise<AuthCode> {
    const [created] = await db.insert(authCodes).values(code).returning();
    return created;
  }
  
  async getValidAuthCode(email: string): Promise<AuthCode | undefined> {
    // SECURITY: Filter by email, unused, and not expired - all in SQL
    const now = new Date();
    const [code] = await db
      .select()
      .from(authCodes)
      .where(
        and(
          eq(authCodes.email, email.toLowerCase()),
          eq(authCodes.used, false),
          sql`${authCodes.expiresAt} > ${now}` // Must not be expired
        )
      )
      .orderBy(desc(authCodes.createdAt))
      .limit(1);
    return code || undefined;
  }
  
  // SECURITY: Atomic mark-as-used with optimistic locking
  // Returns true if successfully marked (code was still unused)
  // Returns false if code was already used (race condition prevented)
  async markAuthCodeUsed(id: string): Promise<boolean> {
    const result = await db
      .update(authCodes)
      .set({ used: true })
      .where(
        and(
          eq(authCodes.id, id),
          eq(authCodes.used, false) // Only update if still unused
        )
      )
      .returning();
    return result.length > 0;
  }
  
  async cleanupExpiredAuthCodes(): Promise<number> {
    const result = await db
      .delete(authCodes)
      .where(lt(authCodes.expiresAt, new Date()))
      .returning();
    return result.length;
  }
}

export const storage = new DatabaseStorage();
