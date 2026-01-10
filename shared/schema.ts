import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// USER AUTHENTICATION & PROFILE TABLES
// ============================================

// Users table - core user identity
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User profiles - extended user information for delivery
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  fullName: text("full_name"),
  phone: text("phone"),
  defaultAddressLine1: text("default_address_line1"),
  defaultAddressLine2: text("default_address_line2"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User sessions - for persistent login (httpOnly cookie-based)
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Auth codes - temporary codes for passwordless login
export const authCodes = pgTable("auth_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(), // bcrypt hashed 6-digit code
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

// Admin Publish Status (separate from campaign state machine)
// Controls visibility in public UI and editability in admin
export const adminPublishStatusEnum = pgEnum("admin_publish_status", [
  "DRAFT",
  "PUBLISHED", 
  "HIDDEN"
]);

// Delivery Strategy enum
export const deliveryStrategyEnum = pgEnum("delivery_strategy", [
  "SUPPLIER_DIRECT",
  "CONSOLIDATION_POINT"
]);

// Delivery Cost Handling enum
export const deliveryCostHandlingEnum = pgEnum("delivery_cost_handling", [
  "INCLUDED_IN_UNIT_PRICE",
  "SEPARATE_POST_CAMPAIGN",
  "SUPPLIER_COVERED"
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
  // Admin publish status (separate from state machine)
  adminPublishStatus: adminPublishStatusEnum("admin_publish_status").notNull().default("DRAFT"),
  publishedAt: timestamp("published_at"),
  publishedByAdminId: text("published_by_admin_id"),
  // SKU and product identification
  sku: text("sku"),
  productName: text("product_name"),
  // Product details
  brand: text("brand"),
  modelNumber: text("model_number"),
  variant: text("variant"),
  shortDescription: text("short_description"),
  specs: text("specs"), // JSON: array of { key: string, value: string }
  variations: text("variations"), // JSON: array of { name: string, attributes: { key: value } }
  // Target in UNITS (primary for Phase 1.5+)
  targetUnits: integer("target_units"),
  // Images
  primaryImageUrl: text("primary_image_url"),
  galleryImageUrls: text("gallery_image_urls"), // JSON: array of strings
  media: text("media"), // JSON: array of { url: string, altText?: string, sortOrder: number }
  // Reference prices (for transparency)
  referencePrices: text("reference_prices"), // JSON: array of { amount, currency, source, url?, capturedAt?, note? }
  // Delivery strategy
  deliveryStrategy: text("delivery_strategy").default("SUPPLIER_DIRECT"), // SUPPLIER_DIRECT | CONSOLIDATION_POINT
  deliveryCostHandling: text("delivery_cost_handling"), // INCLUDED_IN_UNIT_PRICE | SEPARATE_POST_CAMPAIGN | SUPPLIER_COVERED
  supplierDirectConfirmed: boolean("supplier_direct_confirmed").default(false),
  // Consolidation fields (editable while published, locked in fulfillment phase)
  consolidationContactName: text("consolidation_contact_name"),
  consolidationCompany: text("consolidation_company"),
  consolidationContactEmail: text("consolidation_contact_email"),
  consolidationAddressLine1: text("consolidation_address_line1"),
  consolidationAddressLine2: text("consolidation_address_line2"),
  consolidationCity: text("consolidation_city"),
  consolidationState: text("consolidation_state"),
  consolidationPostalCode: text("consolidation_postal_code"),
  consolidationCountry: text("consolidation_country"),
  consolidationPhone: text("consolidation_phone"),
  deliveryWindow: text("delivery_window"),
  fulfillmentNotes: text("fulfillment_notes"),
});

// Commitments table - user commitments to campaigns
export const commitments = pgTable("commitments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  userId: varchar("user_id").references(() => users.id), // nullable FK - new commitments attach user_id when logged in
  participantName: text("participant_name").notNull(),
  participantEmail: text("participant_email").notNull(), // kept for legacy/audit
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  status: commitmentStatusEnum("status").notNull().default("LOCKED"),
  referenceNumber: varchar("reference_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Escrow Ledger - append-only record of all fund movements
// Balances are DERIVED by summing entries, not stored (append-only ledger pattern)
// Both actor and reason are REQUIRED for Phase 1 auditability
export const escrowLedger = pgTable("escrow_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commitmentId: varchar("commitment_id").notNull().references(() => commitments.id),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  entryType: escrowEntryTypeEnum("entry_type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  actor: text("actor").notNull(), // Who performed this action (user email, admin username, or 'system')
  reason: text("reason").notNull(), // Required audit reason (commitment_created, admin_refund, admin_release, etc.)
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

// Campaign Admin Events - append-only audit log for campaign changes
// Tracks CREATED, UPDATED, PUBLISHED events with changed fields
export const campaignAdminEventsEnum = pgEnum("campaign_admin_event_type", [
  "CREATED",
  "UPDATED", 
  "PUBLISHED"
]);

export const campaignAdminEvents = pgTable("campaign_admin_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  adminId: text("admin_id").notNull(), // admin email or username
  eventType: campaignAdminEventsEnum("event_type").notNull(),
  changedFields: text("changed_fields"), // JSON array of field names that changed
  note: text("note"),
});

// Idempotency Keys - prevent duplicate money-affecting operations
// Keys are scoped (key + scope unique) to allow key reuse across different operations
// Keys are retained indefinitely for auditability (no TTL expiration)
export const idempotencyKeys = pgTable("idempotency_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull(),
  scope: text("scope").notNull(),
  requestHash: text("request_hash"),
  response: text("response"), // JSON string of cached response
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  sessions: many(userSessions),
  commitments: many(commitments),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

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
  user: one(users, {
    fields: [commitments.userId],
    references: [users.id],
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

export const campaignAdminEventsRelations = relations(campaignAdminEvents, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignAdminEvents.campaignId],
    references: [campaigns.id],
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

export const insertIdempotencyKeySchema = createInsertSchema(idempotencyKeys).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignAdminEventSchema = createInsertSchema(campaignAdminEvents).omit({
  id: true,
  createdAt: true,
});

// User-related insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  updatedAt: true,
});

export const updateUserProfileSchema = insertUserProfileSchema.partial().omit({
  userId: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertAuthCodeSchema = createInsertSchema(authCodes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type AuthCode = typeof authCodes.$inferSelect;
export type InsertAuthCode = z.infer<typeof insertAuthCodeSchema>;

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

export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
export type InsertIdempotencyKey = z.infer<typeof insertIdempotencyKeySchema>;

export type CampaignAdminEvent = typeof campaignAdminEvents.$inferSelect;
export type InsertCampaignAdminEvent = z.infer<typeof insertCampaignAdminEventSchema>;
export type CampaignAdminEventType = "CREATED" | "UPDATED" | "PUBLISHED";

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
