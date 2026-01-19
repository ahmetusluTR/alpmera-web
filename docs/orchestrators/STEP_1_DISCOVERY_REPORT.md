# STEP 1 — DISCOVERY REPORT
## Admin Console Credits System — Current State Analysis

**Date:** 2026-01-18
**Orchestrator:** ADMIN_PHASE_1_5_CONTINUATION.md
**Role:** Implementer + System Architect

---

## 1. Current Credit Ledger Schema

### Table: `credit_ledger_entries` (Append-Only)

**Location:** `shared/schema.ts:211-226`

```typescript
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
});
```

### Event Types (Enum)

**Location:** `shared/schema.ts:129`

```typescript
export const creditEventTypeEnum = pgEnum("credit_event_type", [
  "ISSUED",
  "RESERVED",
  "RELEASED",
  "APPLIED",
  "REVOKED",
  "EXPIRED"
]);
```

### Zod Schemas & TypeScript Types

**Location:** `shared/schema.ts:385, 415-416`

```typescript
export const insertCreditLedgerEntrySchema = createInsertSchema(creditLedgerEntries)
  .omit({ id: true, createdAt: true });

export type CreditLedgerEntry = typeof creditLedgerEntries.$inferSelect;
export type InsertCreditLedgerEntry = z.infer<typeof insertCreditLedgerEntrySchema>;
```

---

## 2. Participant Entity Identification

### Primary Participant Table: `users`

**Location:** `shared/schema.ts:9-13`

```typescript
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Participant ID in Admin:** `users.id` (UUID)

### Participant Profile (Display Data)

**Location:** `shared/schema.ts:15-27`

```typescript
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  fullName: text("full_name"),
  phone: text("phone"),
  // ... address fields ...
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Linkage:** `userProfiles.userId → users.id` (1:1 relationship)

### Foreign Key in Credit Ledger

```typescript
participantId: varchar("participant_id").notNull().references(() => users.id)
```

✅ **Credit ledger correctly references `users.id` as the participant anchor.**

---

## 3. Existing Escrow/Refund Flows (Patterns to Follow)

### Escrow Ledger Table

**Location:** `shared/schema.ts:195-205`

```typescript
export const escrowLedger = pgTable("escrow_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commitmentId: varchar("commitment_id").notNull().references(() => commitments.id),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  entryType: escrowEntryTypeEnum("entry_type").notNull(),  // LOCK, REFUND, RELEASE
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  actor: text("actor").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Pattern:** Append-only ledger with `actor` + `reason` for auditability.

### Commitments Table (Financial Linkage)

**Location:** `shared/schema.ts:182-193`

```typescript
export const commitments = pgTable("commitments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  userId: varchar("user_id").references(() => users.id),
  participantName: text("participant_name").notNull(),
  participantEmail: text("participant_email").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  status: commitmentStatusEnum("status").notNull().default("LOCKED"),  // LOCKED, REFUNDED, RELEASED
  referenceNumber: varchar("reference_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Note:** `commitments.userId` references `users.id` — same pattern as credit ledger.

---

## 4. Current Admin API Endpoints for Credits

**Location:** `server/routes.ts:426-511`

### Implemented Endpoints:

1. **GET `/api/admin/credits`** — List credit ledger entries with filters
   - Query params: `participantId`, `eventType`, `from`, `to`, `campaignId`, `limit`, `offset`
   - Returns: `{ entries: CreditLedgerEntry[], total: number, limit: number, offset: number }`

2. **GET `/api/admin/credits/:id`** — Get single credit ledger entry detail
   - Returns: `CreditLedgerEntry` (with participant email/name and campaign name via joins)

3. **GET `/api/admin/credits/participant/:participantId/balance`** — Get participant credit balance
   - Returns: `{ balance: string, currency: string }`
   - **Computation:** `SUM(amount)` from `credit_ledger_entries` where `participantId = X`

### Storage Layer Methods

**Location:** `server/storage.ts:740-843`

```typescript
interface IStorage {
  // ...
  getCreditLedgerEntries(filters?: {...}): Promise<{ entries: CreditLedgerEntry[]; total: number }>;
  getCreditLedgerEntry(id: string): Promise<CreditLedgerEntry | undefined>;
  createCreditLedgerEntry(entry: InsertCreditLedgerEntry): Promise<CreditLedgerEntry>;
  getParticipantCreditBalance(participantId: string): Promise<number>;
}
```

**Balance Computation:**
```typescript
async getParticipantCreditBalance(participantId: string): Promise<number> {
  const [result] = await db
    .select({ balance: sql<string>`COALESCE(SUM(${creditLedgerEntries.amount}), 0)` })
    .from(creditLedgerEntries)
    .where(eq(creditLedgerEntries.participantId, participantId));
  return parseFloat(result?.balance || "0");
}
```

✅ **Balance is derived, not stored — complies with append-only ledger principle.**

---

## 5. Current Admin UI Pages

### Credits Ledger Page

**Location:** `client/src/pages/admin/credits.tsx`

**Features:**
- Filters: Participant ID, Event Type, From/To Date
- Table columns: Created At, Participant, Event Type, Amount, Campaign, Reason
- Color-coded event type badges
- Positive/negative amount styling
- Links to participant and campaign detail pages
- **NO export button** (competitive safety)
- **NO aggregate totals** (competitive safety)

### Credit Detail Page

**Location:** `client/src/pages/admin/credit-detail.tsx`

**Features:**
- Section A: Event Core (ID, type, amount, timestamp, creator, reason)
- Section B: Participant Context (email, name, **current balance**)
- Section C: Related Entities (campaign, commitment, rule set, award refs)

### Navigation

**Location:** `client/src/pages/admin/layout.tsx:44`

```typescript
{
  items: [
    { path: "/admin/clearing", label: "Clearing", icon: Wallet },
    { path: "/admin/credits", label: "Credits", icon: Coins },
  ],
}
```

✅ **Credits page is in Financial section alongside Clearing.**

---

## 6. Existing Idempotency Infrastructure

**Location:** `shared/schema.ts:260-267`

```typescript
export const idempotencyKeys = pgTable("idempotency_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull(),
  scope: text("scope").notNull(),
  request_hash: text("request_hash"),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

✅ **Generic idempotency table exists and can be used for credit operations.**

---

## 7. Currency Model — Current State

### Credit Amounts

**Storage:** `decimal(12, 2)` in `credit_ledger_entries.amount`

**Default Currency:** `USD` (hardcoded in schema default)

```typescript
currency: varchar("currency", { length: 3 }).notNull().default("USD")
```

**Observation:**
- Credits are currently stored in **USD decimal format** (e.g., 50.00 = $50.00)
- No conversion table exists
- No multi-currency support beyond the `currency` field

**Decision Point for Step 2:**
- **Option A (Recommended):** Treat credits as **USD cents stored as decimal** (e.g., 50.00 = 5000 cents = $50.00 value)
- **Option B (Complex):** Introduce conversion rate table for abstract credit units

---

## 8. Missing Components (Gaps Identified)

### ❌ No `credit_accounts` table
- Currently, balance is computed on-demand via `SUM(amount)`
- No cached/materialized balance
- No per-participant credit account structure

### ❌ No credit breakdown by status
- Cannot easily show: "Earned", "Spent", "Reserved", "Available"
- Event types exist (ISSUED, RESERVED, RELEASED, etc.) but no aggregation logic

### ❌ No participant-scoped credits view in Admin UI
- Admin can filter ledger by participant ID
- But there's no dedicated "Participant Credit Summary" page with:
  - Current balance
  - Lifetime earned/spent
  - Reserved credits
  - Ledger entries table

### ❌ No idempotency enforcement for credit events
- `idempotencyKeys` table exists but not wired to credit creation
- Risk of duplicate credit issuance

### ❌ No admin manual credit adjustment workflow
- No `POST /api/admin/credits/adjust` endpoint
- No UI for issuing/revoking credits manually

---

## 9. Summary — Current State

| Component | Status | Notes |
|-----------|--------|-------|
| **Credit Ledger Table** | ✅ Exists | Append-only, `participantId` → `users.id` |
| **Event Types Enum** | ✅ Exists | 6 types: ISSUED, RESERVED, RELEASED, APPLIED, REVOKED, EXPIRED |
| **Participant Entity** | ✅ Identified | `users.id` (primary), `userProfiles` (display) |
| **Balance Computation** | ✅ Implemented | `SUM(amount)` derived on-demand |
| **Admin API Endpoints** | ✅ Partial | List, detail, balance — but no create/adjust |
| **Admin UI Pages** | ✅ Partial | Ledger list + detail, but no participant summary |
| **Currency Model** | ⚠️ Implicit | USD decimal, no conversion logic |
| **Idempotency** | ❌ Not enforced | Table exists but not used for credits |
| **Credit Accounts** | ❌ Missing | No dedicated account structure |
| **Breakdown (Earned/Spent)** | ❌ Missing | No aggregation by event type |
| **Manual Adjustment Flow** | ❌ Missing | No admin credit issuance UI/API |

---

## 10. Recommended Next Steps (Step 2 Preview)

### Minimal Schema Additions

1. **Option: Add `credit_accounts` table (optional)**
   - One row per participant (or per participant + currency)
   - Stores: `participantId`, `currency`, `cachedBalance`, `lastComputedAt`
   - **Pros:** Fast balance queries, explicit account ownership
   - **Cons:** Adds denormalization, requires sync logic

2. **Alternative: Keep ledger-only** (Recommended for Phase 1.5)
   - No new table
   - Compute balance via `SUM(amount)` grouped by `participantId`
   - Add indexed view or materialized view (if performance degrades)

### API Enhancements Needed

1. **GET `/api/admin/credits/participant/:participantId/summary`**
   - Returns: `{ balance, earned, spent, reserved, currency }`
   - Breakdown by event type aggregation

2. **POST `/api/admin/credits/issue`** (Manual issuance)
   - Requires: `participantId`, `amount`, `reason`, `idempotencyKey`
   - Creates ISSUED event
   - Admin auth required

3. **POST `/api/admin/credits/revoke`** (Manual revocation)
   - Requires: `participantId`, `amount`, `reason`, `idempotencyKey`
   - Creates REVOKED event
   - Admin auth required

### UX Enhancements Needed

1. **New Page: `/admin/participants/:id/credits`**
   - Participant identity header
   - Summary cards: Balance, Earned, Spent, Reserved
   - Ledger entries table filtered to participant
   - Link to Participants page

2. **Link from Participants page** (future)
   - Add "Credits" tab/link on participant detail

---

## STEP 1 COMPLETE ✅

**Deliverable Summary:**
- ✅ Inspected `credit_ledger_entries` schema (append-only, 6 event types)
- ✅ Identified participant entity: `users.id` (primary), `userProfiles` (display)
- ✅ Reviewed existing escrow/refund patterns (append-only ledger with actor/reason)
- ✅ Documented current API endpoints (list, detail, balance)
- ✅ Documented current UI pages (ledger list + detail)
- ✅ Identified gaps: no credit accounts, no breakdown, no manual adjustment workflow
- ✅ Currency model: USD decimal (implicit, no conversion logic)
- ✅ Idempotency table exists but not enforced for credits

**Next:** Proceed to **Step 2 — Define Canonical Credit Model** (System Architect + Escrow Financial Auditor)

---
