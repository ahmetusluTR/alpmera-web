import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// USER AUTHENTICATION & PROFILE TABLES
// ============================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authCodes = pgTable("auth_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// ============================================
// SUPPLIERS TABLE (Admin-only)
// ============================================

export const supplierStatusEnum = pgEnum("supplier_status", ["ACTIVE", "INACTIVE", "ARCHIVED"]);

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  phone: text("phone"),
  website: text("website"),
  region: text("region"),
  notes: text("notes"),
  status: supplierStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// CONSOLIDATION POINTS TABLE (Admin-only)
// ============================================

export const consolidationPointStatusEnum = pgEnum("consolidation_point_status", ["ACTIVE", "INACTIVE", "ARCHIVED"]);

export const consolidationPoints = pgTable("consolidation_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  status: consolidationPointStatusEnum("status").notNull().default("ACTIVE"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// PRODUCTS TABLE (Admin-only catalog)
// ============================================

export const productStatusEnum = pgEnum("product_status", ["ACTIVE", "ARCHIVED"]);

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand"),
  modelNumber: text("model_number"),
  variant: text("variant"),
  category: text("category"),
  shortDescription: text("short_description"),
  specs: text("specs"),
  primaryImageUrl: text("primary_image_url"),
  galleryImageUrls: text("gallery_image_urls"),
  referencePrices: text("reference_prices"),
  internalNotes: text("internal_notes"),
  status: productStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// LANDING SUBSCRIBERS (Public landing page)
// ============================================

export const landingSubscribers = pgTable("landing_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  source: text("source").notNull().default("alpmera.com"),
  interestTags: text("interest_tags").array(),
  notes: text("notes"),
  recommendationOptIn: boolean("recommendation_opt_in").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  lastSubmittedAt: timestamp("last_submitted_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================
// PRODUCT REQUESTS (Public landing page)
// ============================================

export const productRequestStatusEnum = pgEnum("product_request_status", [
  "not_reviewed",
  "in_review",
  "rejected",
  "accepted",
  "failed_in_campaign",
  "successful_in_campaign",
]);

export const skuVerificationStatusEnum = pgEnum("sku_verification_status", [
  "pending",
  "verified",
  "unverified",
  "error",
]);

export const productRequests = pgTable("product_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Submission data
  productName: text("product_name").notNull(),
  category: text("category"),
  inputSku: text("input_sku"),
  referenceUrl: text("reference_url").notNull(),
  reason: text("reason"),

  // Submitter info (optional, for notifications)
  submitterEmail: text("submitter_email"),
  submitterCity: text("submitter_city"),
  submitterState: text("submitter_state"),
  notifyOnCampaign: boolean("notify_on_campaign").default(false),

  // SKU verification
  derivedSku: text("derived_sku"),
  canonicalProductId: text("canonical_product_id"),
  verificationStatus: skuVerificationStatusEnum("verification_status").default("pending"),
  verificationReason: text("verification_reason"),
  verificationAttemptedAt: timestamp("verification_attempted_at", { withTimezone: true }),
  verificationRetryCount: integer("verification_retry_count").default(0),

  // Status & lifecycle
  status: productRequestStatusEnum("status").default("not_reviewed"),
  statusChangedAt: timestamp("status_changed_at", { withTimezone: true }),
  statusChangedBy: text("status_changed_by"),
  statusChangeReason: text("status_change_reason"),

  // Voting
  voteCount: integer("vote_count").default(0),

  // Anti-abuse
  submitterIp: text("submitter_ip"),
  submitterAnonId: text("submitter_anon_id"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("product_requests_status_idx").on(table.status),
  voteCountIdx: index("product_requests_vote_count_idx").on(table.voteCount),
  createdAtIdx: index("product_requests_created_at_idx").on(table.createdAt),
  emailIdx: index("product_requests_email_idx").on(table.submitterEmail),
  verificationStatusIdx: index("product_requests_verification_status_idx").on(table.verificationStatus),
}));

export const productRequestVotes = pgTable("product_request_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productRequestId: varchar("product_request_id").notNull().references(() => productRequests.id),

  // Voter identity (one of these must be present)
  anonId: text("anon_id"),
  ipHash: text("ip_hash"),
  userId: varchar("user_id").references(() => users.id),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueAnonVote: uniqueIndex("product_request_votes_anon_unique").on(table.productRequestId, table.anonId),
  uniqueIpVote: uniqueIndex("product_request_votes_ip_unique").on(table.productRequestId, table.ipHash),
  uniqueUserVote: uniqueIndex("product_request_votes_user_unique").on(table.productRequestId, table.userId),
  requestIdx: index("product_request_votes_request_idx").on(table.productRequestId),
}));

export const productRequestEvents = pgTable("product_request_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productRequestId: varchar("product_request_id").notNull().references(() => productRequests.id),

  eventType: text("event_type").notNull(),
  actor: text("actor"),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  metadata: text("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  requestIdx: index("product_request_events_request_idx").on(table.productRequestId),
  eventTypeIdx: index("product_request_events_type_idx").on(table.eventType),
}));

export const skuVerificationJobs = pgTable("sku_verification_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productRequestId: varchar("product_request_id").notNull().references(() => productRequests.id).unique(),

  status: text("status").notNull().default("pending"),
  attemptCount: integer("attempt_count").default(0),
  maxAttempts: integer("max_attempts").default(2),

  // Results cache
  fetchedContent: text("fetched_content"),
  extractedData: text("extracted_data"),

  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorMessage: text("error_message"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("sku_verification_jobs_status_idx").on(table.status),
  nextAttemptIdx: index("sku_verification_jobs_next_attempt_idx").on(table.nextAttemptAt),
}));

// ============================================
// CAMPAIGN TABLES
// ============================================

export const campaignStateEnum = pgEnum("campaign_state", ["AGGREGATION", "SUCCESS", "FAILED", "PROCUREMENT", "FULFILLMENT", "RELEASED"]);
export const commitmentStatusEnum = pgEnum("commitment_status", ["LOCKED", "REFUNDED", "RELEASED"]);
export const escrowEntryTypeEnum = pgEnum("escrow_entry_type", ["LOCK", "REFUND", "RELEASE"]);
export const adminPublishStatusEnum = pgEnum("admin_publish_status", ["DRAFT", "PUBLISHED", "HIDDEN"]);
export const creditEventTypeEnum = pgEnum("credit_event_type", ["ISSUED", "RESERVED", "RELEASED", "APPLIED", "REVOKED", "EXPIRED"]);

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
  adminPublishStatus: adminPublishStatusEnum("admin_publish_status").notNull().default("DRAFT"),
  publishedAt: timestamp("published_at"),
  publishedByAdminId: text("published_by_admin_id"),
  sku: text("sku"),
  productName: text("product_name"),
  brand: text("brand"),
  modelNumber: text("model_number"),
  variant: text("variant"),
  shortDescription: text("short_description"),
  specs: text("specs"),
  variations: text("variations"),
  targetUnits: integer("target_units"),
  primaryImageUrl: text("primary_image_url"),
  galleryImageUrls: text("gallery_image_urls"),
  media: text("media"),
  referencePrices: text("reference_prices"),
  deliveryStrategy: text("delivery_strategy").default("SUPPLIER_DIRECT"),
  deliveryCostHandling: text("delivery_cost_handling"),
  supplierDirectConfirmed: boolean("supplier_direct_confirmed").default(false),
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
  productId: varchar("product_id").references(() => products.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  consolidationPointId: varchar("consolidation_point_id").references(() => consolidationPoints.id),
});

export const commitments = pgTable("commitments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  userId: varchar("user_id").references(() => users.id),
  participantName: text("participant_name").notNull(),
  participantEmail: text("participant_email").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  status: commitmentStatusEnum("status").notNull().default("LOCKED"),
  referenceNumber: varchar("reference_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const escrowLedger = pgTable("escrow_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commitmentId: varchar("commitment_id").notNull().references(() => commitments.id),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  entryType: escrowEntryTypeEnum("entry_type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  actor: text("actor").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// CREDIT LEDGER TABLE (Alpmera Credits)
// ============================================

export const creditLedgerEntries = pgTable("credit_ledger_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull().references(() => users.id),
  eventType: creditEventTypeEnum("event_type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  commitmentId: varchar("commitment_id").references(() => commitments.id),
  ruleSetId: varchar("rule_set_id"),
  awardId: varchar("award_id"),
  reservationRef: varchar("reservation_ref"),
  auditRef: varchar("audit_ref"),
  reason: text("reason").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 255 }),
}, (table) => ({
  participantIdx: index("credit_ledger_participant_idx").on(table.participantId),
  eventTypeIdx: index("credit_ledger_event_type_idx").on(table.eventType),
  participantEventIdx: index("credit_ledger_participant_event_idx").on(table.participantId, table.eventType),
  reservationRefIdx: index("credit_ledger_reservation_ref_idx").on(table.reservationRef),
  idempotencyKeyIdx: uniqueIndex("credit_ledger_idempotency_key_idx").on(table.idempotencyKey),
}));

export const supplierAcceptances = pgTable("supplier_acceptances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  supplierName: text("supplier_name").notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
  notes: text("notes"),
});

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

export const campaignAdminEventsEnum = pgEnum("campaign_admin_event_type", ["CREATED", "UPDATED", "PUBLISHED"]);

export const campaignAdminEvents = pgTable("campaign_admin_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  adminId: text("admin_id").notNull(),
  eventType: campaignAdminEventsEnum("event_type").notNull(),
  changedFields: text("changed_fields"),
  note: text("note"),
});

export const idempotencyKeys = pgTable("idempotency_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull(),
  scope: text("scope").notNull(),
  requestHash: text("request_hash"),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  sessions: many(userSessions),
  commitments: many(commitments),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, { fields: [userSessions.userId], references: [users.id] }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  commitments: many(commitments),
  escrowEntries: many(escrowLedger),
  supplierAcceptances: many(supplierAcceptances),
  adminLogs: many(adminActionLogs),
  product: one(products, { fields: [campaigns.productId], references: [products.id] }),
  supplier: one(suppliers, { fields: [campaigns.supplierId], references: [suppliers.id] }),
  consolidationPoint: one(consolidationPoints, { fields: [campaigns.consolidationPointId], references: [consolidationPoints.id] }),
}));

export const commitmentsRelations = relations(commitments, ({ one, many }) => ({
  campaign: one(campaigns, { fields: [commitments.campaignId], references: [campaigns.id] }),
  user: one(users, { fields: [commitments.userId], references: [users.id] }),
  escrowEntries: many(escrowLedger),
}));

export const escrowLedgerRelations = relations(escrowLedger, ({ one }) => ({
  commitment: one(commitments, { fields: [escrowLedger.commitmentId], references: [commitments.id] }),
  campaign: one(campaigns, { fields: [escrowLedger.campaignId], references: [campaigns.id] }),
}));

export const supplierAcceptancesRelations = relations(supplierAcceptances, ({ one }) => ({
  campaign: one(campaigns, { fields: [supplierAcceptances.campaignId], references: [campaigns.id] }),
}));

export const adminActionLogsRelations = relations(adminActionLogs, ({ one }) => ({
  campaign: one(campaigns, { fields: [adminActionLogs.campaignId], references: [campaigns.id] }),
  commitment: one(commitments, { fields: [adminActionLogs.commitmentId], references: [commitments.id] }),
}));

export const campaignAdminEventsRelations = relations(campaignAdminEvents, ({ one }) => ({
  campaign: one(campaigns, { fields: [campaignAdminEvents.campaignId], references: [campaigns.id] }),
}));

export const productRequestsRelations = relations(productRequests, ({ many }) => ({
  votes: many(productRequestVotes),
  events: many(productRequestEvents),
}));

export const productRequestVotesRelations = relations(productRequestVotes, ({ one }) => ({
  productRequest: one(productRequests, {
    fields: [productRequestVotes.productRequestId],
    references: [productRequests.id],
  }),
  user: one(users, { fields: [productRequestVotes.userId], references: [users.id] }),
}));

export const productRequestEventsRelations = relations(productRequestEvents, ({ one }) => ({
  productRequest: one(productRequests, {
    fields: [productRequestEvents.productRequestId],
    references: [productRequests.id],
  }),
}));

export const skuVerificationJobsRelations = relations(skuVerificationJobs, ({ one }) => ({
  productRequest: one(productRequests, {
    fields: [skuVerificationJobs.productRequestId],
    references: [productRequests.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, updatedAt: true });
export const updateUserProfileSchema = insertUserProfileSchema.partial().omit({ userId: true });
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({ id: true, createdAt: true });
export const insertAuthCodeSchema = createInsertSchema(authCodes).omit({ id: true, createdAt: true });

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true, status: true });
export const updateProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(2).optional(),
  brand: z.string().nullable().optional(),
  modelNumber: z.string().nullable().optional(),
  variant: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  specs: z.string().nullable().optional(),
  primaryImageUrl: z.string().nullable().optional(),
  galleryImageUrls: z.string().nullable().optional(),
  referencePrices: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true, updatedAt: true });
export const updateSupplierSchema = z.object({
  name: z.string().min(2).optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
});

export const insertConsolidationPointSchema = createInsertSchema(consolidationPoints).omit({ id: true, createdAt: true, updatedAt: true });
export const updateConsolidationPointSchema = z.object({
  name: z.string().min(2).optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional().or(z.literal("")),
  contactPhone: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  notes: z.string().nullable().optional(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  supplierAcceptedAt: true,
}).extend({
  targetAmount: z.string().or(z.number()).transform(v => v.toString()),
  minCommitment: z.string().or(z.number()).transform(v => v.toString()),
  maxCommitment: z.string().or(z.number()).nullable().transform(v => v?.toString()),
  unitPrice: z.string().or(z.number()).transform(v => v.toString()),
  aggregationDeadline: z.coerce.date(),
});
export const updateCampaignSchema = insertCampaignSchema.partial();

export const insertCommitmentSchema = createInsertSchema(commitments).omit({ id: true, createdAt: true, status: true, referenceNumber: true });
export const insertEscrowEntrySchema = createInsertSchema(escrowLedger).omit({ id: true, createdAt: true });
export const insertCreditLedgerEntrySchema = createInsertSchema(creditLedgerEntries).omit({ id: true, createdAt: true });
export const insertSupplierAcceptanceSchema = createInsertSchema(supplierAcceptances).omit({ id: true, acceptedAt: true });
export const insertAdminActionLogSchema = createInsertSchema(adminActionLogs).omit({ id: true, createdAt: true });
export const insertIdempotencyKeySchema = createInsertSchema(idempotencyKeys).omit({ id: true, createdAt: true });
export const insertCampaignAdminEventSchema = createInsertSchema(campaignAdminEvents).omit({ id: true, createdAt: true });

// Product Request Schemas
export const insertProductRequestSchema = createInsertSchema(productRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  statusChangedAt: true,
  statusChangedBy: true,
  statusChangeReason: true,
  voteCount: true,
  derivedSku: true,
  canonicalProductId: true,
  verificationStatus: true,
  verificationReason: true,
  verificationAttemptedAt: true,
  verificationRetryCount: true,
});

export const updateProductRequestStatusSchema = z.object({
  status: z.enum(["not_reviewed", "in_review", "rejected", "accepted", "failed_in_campaign", "successful_in_campaign"]),
  reason: z.string().optional(),
});

export const insertProductRequestVoteSchema = createInsertSchema(productRequestVotes).omit({
  id: true,
  createdAt: true,
});

export const insertProductRequestEventSchema = createInsertSchema(productRequestEvents).omit({
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
export type CampaignStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";
export type CampaignState = "AGGREGATION" | "SUCCESS" | "FAILED" | "PROCUREMENT" | "FULFILLMENT" | "RELEASED";

export type Commitment = typeof commitments.$inferSelect;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;
export type CommitmentStatus = "LOCKED" | "REFUNDED" | "RELEASED";

export type EscrowEntry = typeof escrowLedger.$inferSelect;
export type InsertEscrowEntry = z.infer<typeof insertEscrowEntrySchema>;
export type EscrowEntryType = "LOCK" | "REFUND" | "RELEASE";

export type CreditLedgerEntry = typeof creditLedgerEntries.$inferSelect;
export type InsertCreditLedgerEntry = z.infer<typeof insertCreditLedgerEntrySchema>;
export type CreditEventType = "ISSUED" | "RESERVED" | "RELEASED" | "APPLIED" | "REVOKED" | "EXPIRED";

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type ProductStatus = "ACTIVE" | "ARCHIVED";

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type UpdateSupplier = z.infer<typeof updateSupplierSchema>;
export type SupplierStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ConsolidationPoint = typeof consolidationPoints.$inferSelect;
export type InsertConsolidationPoint = z.infer<typeof insertConsolidationPointSchema>;
export type UpdateConsolidationPoint = z.infer<typeof updateConsolidationPointSchema>;
export type ConsolidationPointStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type SupplierAcceptance = typeof supplierAcceptances.$inferSelect;
export type InsertSupplierAcceptance = z.infer<typeof insertSupplierAcceptanceSchema>;

export type AdminActionLog = typeof adminActionLogs.$inferSelect;
export type InsertAdminActionLog = z.infer<typeof insertAdminActionLogSchema>;

export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
export type InsertIdempotencyKey = z.infer<typeof insertIdempotencyKeySchema>;

export type CampaignAdminEvent = typeof campaignAdminEvents.$inferSelect;
export type InsertCampaignAdminEvent = z.infer<typeof insertCampaignAdminEventSchema>;
export type CampaignAdminEventType = "CREATED" | "UPDATED" | "PUBLISHED";

export type ProductRequest = typeof productRequests.$inferSelect;
export type InsertProductRequest = z.infer<typeof insertProductRequestSchema>;
export type UpdateProductRequestStatus = z.infer<typeof updateProductRequestStatusSchema>;
export type ProductRequestStatus = "not_reviewed" | "in_review" | "rejected" | "accepted" | "failed_in_campaign" | "successful_in_campaign";
export type SkuVerificationStatus = "pending" | "verified" | "unverified" | "error";

export type ProductRequestVote = typeof productRequestVotes.$inferSelect;
export type InsertProductRequestVote = z.infer<typeof insertProductRequestVoteSchema>;

export type ProductRequestEvent = typeof productRequestEvents.$inferSelect;
export type InsertProductRequestEvent = z.infer<typeof insertProductRequestEventSchema>;

export type SkuVerificationJob = typeof skuVerificationJobs.$inferSelect;

// Product Request Wording Constants
export const PRODUCT_REQUEST_WORDING = {
  formDisclaimer: "This is not a campaign. No commitments, no payments, no guarantees.",
  pageDisclaimer: "These are community-submitted ideas. Campaigns open only after Alpmera review.",
  voteCta: "I'd support this if opened",
  voteConfirmation: "Thanks for your interest!",
  formTitle: "Suggest a Product",
  pageTitle: "Product Requests",
  pageDescription: "Community-submitted product ideas.",
} as const;

export interface ReferencePrice {
  amount: number;
  currency: string;
  sourceType: "MSRP" | "RETAILER_LISTING" | "SUPPLIER_QUOTE" | "OTHER";
  sourceNameOrUrl?: string;
  capturedAt: string;
  capturedBy: string;
  note?: string;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export const VALID_TRANSITIONS: Record<CampaignState, CampaignState[]> = {
  AGGREGATION: ["SUCCESS", "FAILED"],
  SUCCESS: ["PROCUREMENT", "FAILED"],
  FAILED: [],
  PROCUREMENT: ["FULFILLMENT", "FAILED"],
  FULFILLMENT: ["RELEASED", "FAILED"],
  RELEASED: [],
};
