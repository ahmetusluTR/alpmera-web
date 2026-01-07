import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Campaign State Machine: AGGREGATION → SUCCESS/FAILED → FULFILLMENT → RELEASED
export const campaignStateEnum = pgEnum("campaign_state", [
  "AGGREGATION",
  "SUCCESS", 
  "FAILED",
  "FULFILLMENT",
  "RELEASED"
]);

// Commitment Status
export const commitmentStatusEnum = pgEnum("commitment_status", [
  "LOCKED",
  "REFUNDED",
  "RELEASED"
]);

// Escrow Entry Types (append-only ledger)
export const escrowEntryTypeEnum = pgEnum("escrow_entry_type", [
  "LOCK",
  "REFUND",
  "RELEASE"
]);

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rules: text("rules").notNull(),
  imageUrl: text("image_url"),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  minCommitment: decimal("min_commitment", { precision: 12, scale: 2 }).notNull(),
  maxCommitment: decimal("max_commitment", { precision: 12, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  state: campaignStateEnum("state").notNull().default("AGGREGATION"),
  aggregationDeadline: timestamp("aggregation_deadline").notNull(),
  supplierAccepted: boolean("supplier_accepted").default(false),
  supplierAcceptedAt: timestamp("supplier_accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Commitments table - user commitments to campaigns
export const commitments = pgTable("commitments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  participantName: text("participant_name").notNull(),
  participantEmail: text("participant_email").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  status: commitmentStatusEnum("status").notNull().default("LOCKED"),
  referenceNumber: varchar("reference_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Escrow Ledger - append-only record of all fund movements
export const escrowLedger = pgTable("escrow_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commitmentId: varchar("commitment_id").notNull().references(() => commitments.id),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  entryType: escrowEntryTypeEnum("entry_type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Supplier Acceptances - records when supplier accepts a successful campaign
export const supplierAcceptances = pgTable("supplier_acceptances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  supplierName: text("supplier_name").notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
  notes: text("notes"),
});

// Admin Action Log - audit trail for all admin actions
export const adminActionLogs = pgTable("admin_action_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  commitmentId: varchar("commitment_id").references(() => commitments.id),
  adminUsername: text("admin_username").notNull(),
  action: text("action").notNull(),
  previousState: text("previous_state"),
  newState: text("new_state"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const campaignsRelations = relations(campaigns, ({ many }) => ({
  commitments: many(commitments),
  escrowEntries: many(escrowLedger),
  supplierAcceptances: many(supplierAcceptances),
  adminLogs: many(adminActionLogs),
}));

export const commitmentsRelations = relations(commitments, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [commitments.campaignId],
    references: [campaigns.id],
  }),
  escrowEntries: many(escrowLedger),
}));

export const escrowLedgerRelations = relations(escrowLedger, ({ one }) => ({
  commitment: one(commitments, {
    fields: [escrowLedger.commitmentId],
    references: [commitments.id],
  }),
  campaign: one(campaigns, {
    fields: [escrowLedger.campaignId],
    references: [campaigns.id],
  }),
}));

export const supplierAcceptancesRelations = relations(supplierAcceptances, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [supplierAcceptances.campaignId],
    references: [campaigns.id],
  }),
}));

export const adminActionLogsRelations = relations(adminActionLogs, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [adminActionLogs.campaignId],
    references: [campaigns.id],
  }),
  commitment: one(commitments, {
    fields: [adminActionLogs.commitmentId],
    references: [commitments.id],
  }),
}));

// Insert Schemas
export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  supplierAcceptedAt: true,
});

export const insertCommitmentSchema = createInsertSchema(commitments).omit({
  id: true,
  createdAt: true,
  status: true,
  referenceNumber: true,
});

export const insertEscrowEntrySchema = createInsertSchema(escrowLedger).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierAcceptanceSchema = createInsertSchema(supplierAcceptances).omit({
  id: true,
  acceptedAt: true,
});

export const insertAdminActionLogSchema = createInsertSchema(adminActionLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Commitment = typeof commitments.$inferSelect;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;

export type EscrowEntry = typeof escrowLedger.$inferSelect;
export type InsertEscrowEntry = z.infer<typeof insertEscrowEntrySchema>;

export type SupplierAcceptance = typeof supplierAcceptances.$inferSelect;
export type InsertSupplierAcceptance = z.infer<typeof insertSupplierAcceptanceSchema>;

export type AdminActionLog = typeof adminActionLogs.$inferSelect;
export type InsertAdminActionLog = z.infer<typeof insertAdminActionLogSchema>;

// Campaign State type
export type CampaignState = "AGGREGATION" | "SUCCESS" | "FAILED" | "FULFILLMENT" | "RELEASED";
export type CommitmentStatus = "LOCKED" | "REFUNDED" | "RELEASED";
export type EscrowEntryType = "LOCK" | "REFUND" | "RELEASE";

// State machine valid transitions
export const VALID_TRANSITIONS: Record<CampaignState, CampaignState[]> = {
  AGGREGATION: ["SUCCESS", "FAILED"],
  SUCCESS: ["FULFILLMENT", "FAILED"],
  FAILED: [],
  FULFILLMENT: ["RELEASED", "FAILED"],
  RELEASED: [],
};
