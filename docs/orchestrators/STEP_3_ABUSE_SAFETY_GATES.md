# STEP 3 — ABUSE & SAFETY GATES
## Credit System Threat Model & Mitigation Requirements

**Date:** 2026-01-18
**Orchestrator:** ADMIN_PHASE_1_5_CONTINUATION.md
**Roles:** Risk Abuse Analyst + Escrow Financial Auditor

---

## THREAT MODEL OVERVIEW

**Principle:** Credits are financial value. Any credit system vulnerability is a financial integrity vulnerability.

**Attack Surface:**
- Admin manual credit issuance/revocation endpoints
- Participant credit reservation flow (commitment with credits)
- Ledger integrity (append-only enforcement)
- Balance computation accuracy

**Threat Actors:**
1. **Malicious Admin:** Insider with admin credentials attempting fraud
2. **Compromised Admin Account:** External attacker with stolen admin credentials
3. **Malicious Participant:** User attempting to game credit system
4. **System Bug/Race Condition:** Non-malicious but financially damaging errors

---

## THREAT CATALOG & MITIGATIONS

### THREAT 1: Duplicate Credit Issuance (Replay Attack)

**Severity:** CRITICAL
**Attack Vector:** Admin API retry storm, double-click, network timeout retry

**Scenario:**
```
Admin clicks "Issue 50 USD credit" button
  ↓
Network timeout (no response received)
  ↓
Admin clicks button again
  ↓
Both requests succeed → 100 USD issued instead of 50 USD
```

**Impact:**
- Financial loss (excess credits issued)
- Trust erosion (participants receive unexpected credits)
- Difficult to detect (looks like legitimate admin action)

#### MITIGATION 1.1: Mandatory Idempotency Keys

**Requirement:** ALL admin-initiated credit events (ISSUED, REVOKED) MUST include unique `idempotencyKey`.

**Enforcement:**
```typescript
// API validation (server/routes.ts)
app.post("/api/admin/credits/issue", requireAdminAuth, async (req, res) => {
  const { participantId, amount, reason, idempotencyKey } = req.body;

  // REQUIRED: idempotencyKey must be present
  if (!idempotencyKey || idempotencyKey.trim().length === 0) {
    return res.status(400).json({ error: "idempotencyKey is required" });
  }

  // Check for duplicate key
  const existing = await storage.getCreditLedgerEntryByIdempotencyKey(idempotencyKey);
  if (existing) {
    // Return existing entry (idempotent)
    return res.status(200).json(existing);
  }

  // Proceed with creation...
});
```

**Idempotency Key Format:**
```
{scope}:{timestamp}:{participantId}:{nonce}

Examples:
- admin-issue:2026-01-18T10:30:00Z:usr_abc123:xyz789
- admin-revoke:2026-01-18T11:00:00Z:usr_def456:abc123
- completion-award:camp_xyz:usr_abc123:rule_123
```

**Database Constraint:**
```typescript
// shared/schema.ts
export const creditLedgerEntries = pgTable("credit_ledger_entries", {
  // ... existing fields ...
  idempotencyKey: varchar("idempotency_key", { length: 255 }),
}, (table) => ({
  // UNIQUE INDEX prevents duplicates at DB level
  idempotencyKeyIdx: uniqueIndex("credit_ledger_idempotency_key_idx")
    .on(table.idempotencyKey),
}));
```

**Status:** REQUIRED — Must implement before manual credit issuance goes live.

---

### THREAT 2: Admin Credential Compromise (Insider Fraud)

**Severity:** CRITICAL
**Attack Vector:** Stolen admin credentials, malicious insider

**Scenario:**
```
Attacker obtains admin API key
  ↓
Issues 10,000 USD credits to own participant account
  ↓
Applies credits to multiple campaigns
  ↓
Receives products without payment
```

**Impact:**
- Direct financial loss
- Fraud detection lag (may not be noticed for days)
- Difficult attribution if admin account shared

#### MITIGATION 2.1: Mandatory Audit Trail

**Requirement:** Every credit event MUST record:
- `createdBy` (admin username or SYSTEM)
- `reason` (non-empty, human-readable)
- `createdAt` (immutable timestamp)

**Enforcement:**
```typescript
// API validation
if (!reason || reason.trim().length === 0) {
  return res.status(400).json({ error: "reason is required" });
}

// Auto-populate createdBy from admin session
const createdBy = req.session.adminUsername; // Never client-provided

await storage.createCreditLedgerEntry({
  participantId,
  eventType: "ISSUED",
  amount,
  reason,
  createdBy, // <--- ENFORCED
  idempotencyKey,
});
```

**Status:** ALREADY IMPLEMENTED (existing schema has `createdBy`, `reason` fields).

---

#### MITIGATION 2.2: Cross-Reference to Admin Action Logs

**Requirement:** All manual credit actions MUST generate entry in `adminActionLogs` table.

**Enforcement:**
```typescript
// After creating credit ledger entry
await storage.createAdminActionLog({
  campaignId: null,
  commitmentId: null,
  adminUsername: req.session.adminUsername,
  action: "CREDIT_ISSUED",
  previousState: null,
  newState: `Issued ${amount} USD to participant ${participantId}`,
  reason: reason,
});
```

**Status:** REQUIRED — Must implement alongside manual credit endpoints.

---

#### MITIGATION 2.3: Admin Action Rate Limiting (Future)

**Requirement:** Limit admin credit issuance to prevent bulk fraud.

**Example Rules:**
- Max 10 credit issuance operations per minute per admin
- Max 1,000 USD total issued per hour per admin
- Alert triggered on >5 revocations in 1 hour

**Status:** DEFERRED TO PHASE 2 (not critical for Phase 1.5 with single trusted admin).

---

### THREAT 3: Negative Balance Creation (Accounting Error)

**Severity:** HIGH
**Attack Vector:** Admin revokes more credits than participant has available

**Scenario:**
```
Participant has 30 USD available balance
  ↓
Admin attempts to revoke 50 USD
  ↓
If allowed: participant balance becomes -20 USD
  ↓
Participant can no longer use credits (broken UX)
  ↓
OR worse: negative credits applied as "debt" in future campaigns
```

**Impact:**
- Accounting error (balance integrity violated)
- Participant UX breakage
- Manual reconciliation required

#### MITIGATION 3.1: Pre-Revocation Balance Check

**Requirement:** Before creating REVOKED event, verify `available_balance >= revocation_amount`.

**Enforcement:**
```typescript
// server/routes.ts
app.post("/api/admin/credits/revoke", requireAdminAuth, async (req, res) => {
  const { participantId, amount } = req.body;

  // 1. Get current available balance
  const summary = await storage.getParticipantCreditSummary(participantId);

  // 2. Check if revocation would create negative balance
  if (summary.availableBalance < parseFloat(amount)) {
    return res.status(400).json({
      error: "Insufficient available balance for revocation",
      currentBalance: summary.availableBalance,
      requestedRevocation: amount,
      shortfall: parseFloat(amount) - summary.availableBalance,
    });
  }

  // 3. Proceed with revocation...
});
```

**Status:** REQUIRED — Must implement in revocation endpoint.

---

#### MITIGATION 3.2: Database Constraint (Defensive)

**Requirement:** Add CHECK constraint to prevent negative participant balances (defense-in-depth).

**Challenge:** PostgreSQL CHECK constraints cannot reference aggregated values (SUM).

**Alternative:** Application-level transaction with balance verification:
```typescript
// Wrap in transaction
await db.transaction(async (tx) => {
  // 1. Create REVOKED entry
  await tx.insert(creditLedgerEntries).values({...});

  // 2. Verify final balance >= 0
  const [result] = await tx
    .select({ balance: sql`SUM(amount)` })
    .from(creditLedgerEntries)
    .where(eq(creditLedgerEntries.participantId, participantId));

  if (parseFloat(result.balance) < 0) {
    throw new Error("Revocation would create negative balance");
    // Transaction rolled back
  }
});
```

**Status:** OPTIONAL (application-level check sufficient for Phase 1.5).

---

### THREAT 4: Reservation Exhaustion (Overdraft)

**Severity:** HIGH
**Attack Vector:** Participant reserves more credits than available balance

**Scenario:**
```
Participant has 50 USD total balance
  ↓
Reserves 30 USD for Campaign A (available: 20 USD)
  ↓
Quickly reserves 30 USD for Campaign B (before Campaign A commitment finalizes)
  ↓
Both reservations succeed → 60 USD reserved, only 50 USD available
  ↓
Balance integrity violated
```

**Impact:**
- Overdraft state (reserved > total)
- Commitment fulfillment at risk
- Participant may receive products without sufficient credits

#### MITIGATION 4.1: Atomic Reservation Check

**Requirement:** Check available balance and create RESERVED entry in single transaction.

**Enforcement:**
```typescript
// server/routes.ts (participant commitment flow)
await db.transaction(async (tx) => {
  // 1. Lock participant's credit records (FOR UPDATE)
  const balance = await tx
    .select({ total: sql`COALESCE(SUM(amount), 0)` })
    .from(creditLedgerEntries)
    .where(eq(creditLedgerEntries.participantId, participantId))
    .for('update'); // <--- ROW-LEVEL LOCK

  // 2. Compute reserved amount
  const reserved = await computeReserved(tx, participantId);
  const available = parseFloat(balance.total) - reserved;

  // 3. Check if reservation possible
  if (available < requestedReservation) {
    throw new Error("Insufficient available credits");
  }

  // 4. Create RESERVED entry
  await tx.insert(creditLedgerEntries).values({
    participantId,
    eventType: "RESERVED",
    amount: -requestedReservation, // Negative
    reservationRef: commitmentId,
    reason: `Credit reserved for commitment ${commitmentReference}`,
    createdBy: "SYSTEM",
  });
});
```

**Status:** REQUIRED — Must implement in commitment flow with credit application.

---

#### MITIGATION 4.2: UI Display of Available Balance

**Requirement:** Show participant "Available: X.XX USD (Y.YY reserved)" before commitment.

**Example UI:**
```
Your Credit Balance
├─ Total: 50.00 USD
├─ Reserved: 30.00 USD
└─ Available: 20.00 USD ← Use this for new commitments
```

**Status:** REQUIRED — Must implement in participant commitment wizard.

---

### THREAT 5: Orphaned Reservations (Leaked Reserved Credits)

**Severity:** MEDIUM
**Attack Vector:** Campaign fails but RESERVED credit never RELEASED

**Scenario:**
```
Participant reserves 30 USD for Campaign A
  ↓
Campaign A fails (does not reach target)
  ↓
System should create RELEASED entry (+30 USD)
  ↓
BUG: RELEASED entry not created
  ↓
Participant's 30 USD stuck in "reserved" state forever
  ↓
Available balance incorrectly low
```

**Impact:**
- Participant credits effectively lost
- Balance computation incorrect
- Support burden (manual fixes required)

#### MITIGATION 5.1: Automated Orphan Detection

**Requirement:** Post-campaign completion, detect orphaned RESERVED events.

**Detection Query:**
```sql
-- Find RESERVED events with no matching RELEASED or APPLIED
SELECT cle.*
FROM credit_ledger_entries cle
WHERE cle.event_type = 'RESERVED'
  AND cle.campaign_id = $1 -- Campaign that just completed
  AND NOT EXISTS (
    SELECT 1 FROM credit_ledger_entries cle2
    WHERE cle2.reservation_ref = cle.reservation_ref
      AND cle2.event_type IN ('RELEASED', 'APPLIED')
  );
```

**Action:** Create Exception record for manual review.

**Status:** REQUIRED — Must implement in campaign state transition (FAILED → post-processing).

---

#### MITIGATION 5.2: Reservation Pairing Invariant Enforcement

**Requirement:** Every RESERVED must eventually have RELEASED or APPLIED.

**Enforcement:**
```typescript
// Campaign failure handler
async function handleCampaignFailure(campaignId: string) {
  // 1. Get all LOCKED commitments for failed campaign
  const commitments = await storage.getCommitmentsByCampaignId(campaignId);

  for (const commitment of commitments) {
    // 2. Check if commitment used credits
    const reserved = await storage.getCreditLedgerEntry({
      commitmentId: commitment.id,
      eventType: "RESERVED",
    });

    if (reserved) {
      // 3. Create matching RELEASED entry
      await storage.createCreditLedgerEntry({
        participantId: reserved.participantId,
        eventType: "RELEASED",
        amount: Math.abs(parseFloat(reserved.amount)), // Positive
        reservationRef: reserved.reservationRef,
        campaignId: campaignId,
        commitmentId: commitment.id,
        reason: `Credit released - Campaign ${campaignId} failed`,
        createdBy: "SYSTEM",
        idempotencyKey: `release:${campaignId}:${commitment.id}`,
      });
    }
  }
}
```

**Status:** REQUIRED — Must implement in campaign failure flow.

---

### THREAT 6: Timestamp Backdating (Balance Manipulation)

**Severity:** MEDIUM
**Attack Vector:** Malicious admin backdates credit entries to manipulate historical balances

**Scenario:**
```
Participant claims: "I had 100 USD on Jan 1, but you only show 50 USD"
  ↓
Admin investigates, finds no issue
  ↓
Malicious admin backdates ISSUED entry to Jan 1
  ↓
Appears participant always had 100 USD (fraudulent evidence)
```

**Impact:**
- Dispute manipulation
- Audit trail corruption
- Historical balance queries unreliable

#### MITIGATION 6.1: Database-Generated Timestamps

**Requirement:** `createdAt` field MUST be database-generated (not client-provided).

**Current Schema:**
```typescript
createdAt: timestamp("created_at").defaultNow().notNull(),
```

**Enforcement:** API never accepts `createdAt` from client.

**Status:** ALREADY IMPLEMENTED ✅

---

#### MITIGATION 6.2: No UPDATE Allowed on Ledger

**Requirement:** Credit ledger entries are append-only. No UPDATE or DELETE.

**Enforcement:**
```typescript
// Database permissions (future)
REVOKE UPDATE ON credit_ledger_entries FROM app_user;
REVOKE DELETE ON credit_ledger_entries FROM app_user;

// Only INSERT and SELECT allowed
```

**Application-level:** No `updateCreditLedgerEntry()` method exists in storage layer.

**Status:** PARTIALLY IMPLEMENTED (no update method exists; DB-level REVOKE deferred to Phase 2).

---

#### MITIGATION 6.3: Reversal-Only Pattern

**Requirement:** Errors corrected via compensating entries, never in-place edits.

**Example:**
```
ISSUED +50 USD (error: should have been 30 USD)
  ↓
CORRECTION: Create REVOKED -20 USD with reason "Correcting over-issuance"
  ↓
Net effect: +30 USD (correct)
  ↓
Full audit trail preserved
```

**Status:** REQUIRED — Document in admin workflow (no code change).

---

### THREAT 7: Idempotency Key Reuse (Key Exhaustion)

**Severity:** LOW
**Attack Vector:** Admin reuses idempotency key for different operation

**Scenario:**
```
Admin issues 50 USD with key "admin-issue:2026-01-18:usr_abc:key1"
  ↓
Later: Admin attempts to issue 100 USD with SAME key
  ↓
System returns first issuance (50 USD) — idempotent behavior
  ↓
Admin confused: "I requested 100 USD but only got 50 USD"
```

**Impact:**
- Operational confusion
- Potential for admin to "retry" with new key (creating duplicate)

#### MITIGATION 7.1: Client-Generated Unique Keys

**Requirement:** Admin UI generates unique idempotency keys (UUID or timestamp-based).

**Enforcement:**
```typescript
// client/src/pages/admin/participant-credits.tsx
const generateIdempotencyKey = () => {
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomUUID();
  return `admin-issue:${timestamp}:${participantId}:${nonce}`;
};
```

**Status:** REQUIRED — Implement in admin credit issuance UI.

---

#### MITIGATION 7.2: Key Format Validation

**Requirement:** Validate idempotency key format to prevent malformed keys.

**Enforcement:**
```typescript
const IDEMPOTENCY_KEY_REGEX = /^[a-z-]+:[0-9T:Z-]+:[a-z0-9_-]+:[a-z0-9-]+$/i;

if (!IDEMPOTENCY_KEY_REGEX.test(idempotencyKey)) {
  return res.status(400).json({ error: "Invalid idempotency key format" });
}
```

**Status:** OPTIONAL (validation helps but not critical for Phase 1.5).

---

### THREAT 8: Race Condition in Balance Computation

**Severity:** MEDIUM
**Attack Vector:** Concurrent credit operations on same participant

**Scenario:**
```
Thread 1: Admin issues 50 USD to usr_abc
Thread 2: Admin revokes 20 USD from usr_abc
  ↓
Both threads read balance = 100 USD
  ↓
Thread 1 creates ISSUED +50 (expects new balance: 150)
Thread 2 creates REVOKED -20 (expects new balance: 80)
  ↓
Actual balance: 130 USD (correct) but expectations violated
```

**Impact:**
- Non-deterministic outcomes
- Balance computation may be stale during concurrent ops
- Potential for confusion in admin logs

#### MITIGATION 8.1: Serializable Transactions for Balance Checks

**Requirement:** Use `SERIALIZABLE` isolation level for balance-sensitive operations.

**Enforcement:**
```typescript
await db.transaction(async (tx) => {
  // Set isolation level
  await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

  // Perform balance check + credit operation
  // ...
}, {
  isolationLevel: 'serializable'
});
```

**Status:** OPTIONAL (Phase 1.5 has low concurrency; defer to Phase 2 if issues arise).

---

#### MITIGATION 8.2: Row-Level Locking for Reservations

**Requirement:** Use `SELECT ... FOR UPDATE` when checking balance for reservations.

**Status:** ALREADY SPECIFIED in Mitigation 4.1 ✅

---

### THREAT 9: Manual Revocation Without Exception Workflow

**Severity:** MEDIUM
**Attack Vector:** Admin revokes credits without proper authorization/documentation

**Scenario:**
```
Admin revokes 50 USD from participant
  ↓
Reason: "Mistake"
  ↓
No Exception record created
  ↓
Participant complains: "Where did my credits go?"
  ↓
No audit trail of WHY revocation occurred
```

**Impact:**
- Trust erosion (unexplained credit loss)
- Support burden (cannot explain revocation)
- Potential legal risk

#### MITIGATION 9.1: Mandatory Exception Reference

**Requirement:** All REVOKED events MUST reference an Exception record.

**Enforcement:**
```typescript
// API validation
if (!auditRef || auditRef.trim().length === 0) {
  return res.status(400).json({
    error: "auditRef (Exception record ID) is required for revocations"
  });
}

// Verify Exception record exists
const exception = await storage.getException(auditRef);
if (!exception) {
  return res.status(404).json({ error: "Exception record not found" });
}
```

**Status:** REQUIRED — Implement in revocation endpoint.

---

#### MITIGATION 9.2: UI Workflow: Exception-First

**Requirement:** Admin UI forces Exception creation before allowing revocation.

**Workflow:**
```
Admin clicks "Revoke Credits"
  ↓
UI prompts: "Create Exception record first"
  ↓
Admin creates Exception with:
  - Type: CREDIT_REVOCATION
  - Reason: "Credit issued in error - duplicate issuance"
  - Severity: HIGH
  ↓
Exception ID generated
  ↓
Admin returns to credit revocation form
  ↓
Exception ID auto-filled in auditRef field
  ↓
Revocation proceeds with Exception linkage
```

**Status:** REQUIRED — Implement in admin UX (Step 4).

---

## MITIGATION SUMMARY TABLE

| Threat | Severity | Mitigation | Status |
|--------|----------|------------|--------|
| **1. Duplicate Issuance** | CRITICAL | Mandatory idempotency keys + unique index | REQUIRED |
| **2. Admin Fraud** | CRITICAL | Audit trail (createdBy, reason) + admin action logs | REQUIRED |
| **3. Negative Balance** | HIGH | Pre-revocation balance check | REQUIRED |
| **4. Reservation Overdraft** | HIGH | Atomic reservation check with row locks | REQUIRED |
| **5. Orphaned Reservations** | MEDIUM | Automated orphan detection + pairing enforcement | REQUIRED |
| **6. Timestamp Backdating** | MEDIUM | DB-generated timestamps + no UPDATE allowed | IMPLEMENTED ✅ |
| **7. Idempotency Key Reuse** | LOW | Client-generated unique keys | REQUIRED |
| **8. Race Conditions** | MEDIUM | Row-level locking for reservations | REQUIRED |
| **9. Revocation Without Exception** | MEDIUM | Mandatory Exception reference + UI workflow | REQUIRED |

---

## IMPLEMENTATION REQUIREMENTS (Binding)

### Schema Changes (REQUIRED)

```typescript
// shared/schema.ts
export const creditLedgerEntries = pgTable("credit_ledger_entries", {
  // ... existing fields ...
  idempotencyKey: varchar("idempotency_key", { length: 255 }),
}, (table) => ({
  participantIdx: index("credit_ledger_participant_idx").on(table.participantId),
  eventTypeIdx: index("credit_ledger_event_type_idx").on(table.eventType),
  participantEventIdx: index("credit_ledger_participant_event_idx")
    .on(table.participantId, table.eventType),
  reservationRefIdx: index("credit_ledger_reservation_ref_idx")
    .on(table.reservationRef),
  idempotencyKeyIdx: uniqueIndex("credit_ledger_idempotency_key_idx")
    .on(table.idempotencyKey), // <--- UNIQUE INDEX
}));
```

---

### API Validation Rules (REQUIRED)

**POST `/api/admin/credits/issue`:**
- ✅ `idempotencyKey` required (non-empty string)
- ✅ `reason` required (non-empty string)
- ✅ `amount` > 0
- ✅ `participantId` exists in `users` table
- ✅ Duplicate idempotencyKey → 200 OK (return existing entry)

**POST `/api/admin/credits/revoke`:**
- ✅ `idempotencyKey` required
- ✅ `reason` required
- ✅ `auditRef` (Exception ID) required
- ✅ `amount` > 0
- ✅ `available_balance >= amount` (pre-check)
- ✅ Exception record exists

**POST `/api/participant/commitment` (with credit application):**
- ✅ Atomic transaction with row lock
- ✅ `available_balance >= requested_reservation`
- ✅ Create RESERVED entry with unique `reservationRef`

---

### Storage Layer Methods (NEW)

```typescript
interface IStorage {
  // ... existing methods ...

  // NEW: Get ledger entry by idempotency key
  getCreditLedgerEntryByIdempotencyKey(key: string): Promise<CreditLedgerEntry | undefined>;

  // NEW: Get participant credit summary (with breakdown)
  getParticipantCreditSummary(participantId: string): Promise<{
    totalBalance: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
    currentlyReserved: number;
    availableBalance: number;
    currency: string;
  }>;

  // NEW: Detect orphaned reservations for campaign
  getOrphanedReservations(campaignId: string): Promise<CreditLedgerEntry[]>;
}
```

---

### Campaign Failure Handler (REQUIRED)

```typescript
// Triggered when campaign transitions to FAILED state
async function handleCampaignFailure(campaignId: string) {
  // 1. Get all commitments with RESERVED credits
  const reservations = await storage.getCreditLedgerEntries({
    campaignId,
    eventType: "RESERVED",
  });

  for (const reserved of reservations.entries) {
    // 2. Check if already RELEASED or APPLIED
    const paired = await storage.getCreditLedgerEntries({
      reservationRef: reserved.reservationRef,
      eventType: ["RELEASED", "APPLIED"],
    });

    if (paired.entries.length === 0) {
      // 3. Create RELEASED entry (orphan resolution)
      await storage.createCreditLedgerEntry({
        participantId: reserved.participantId,
        eventType: "RELEASED",
        amount: Math.abs(parseFloat(reserved.amount)),
        reservationRef: reserved.reservationRef,
        campaignId,
        reason: `Credit released - Campaign ${campaignId} failed`,
        createdBy: "SYSTEM",
        idempotencyKey: `release:${campaignId}:${reserved.id}`,
      });
    }
  }
}
```

---

## ACCEPTANCE CRITERIA (Quality Gates)

Before deploying to production:

- [ ] Idempotency key unique index applied to database
- [ ] Duplicate issuance test: Retry with same key → returns existing entry
- [ ] Negative balance test: Revocation attempt with insufficient balance → 400 error
- [ ] Reservation overdraft test: Concurrent reservations → only one succeeds
- [ ] Orphaned reservation test: Campaign failure → all RESERVED credits RELEASED
- [ ] Timestamp immutability test: No UPDATE allowed on `createdAt`
- [ ] Admin action logging test: All manual credits generate admin action log
- [ ] Exception-required test: Revocation without auditRef → 400 error
- [ ] Balance computation accuracy test: SUM(amount) = displayed balance

---

## STEP 3 COMPLETE ✅

**Deliverable Summary:**
- ✅ 9 threats identified and analyzed
- ✅ Mitigations specified for each threat
- ✅ Schema changes defined (idempotencyKey + unique index)
- ✅ API validation rules enumerated
- ✅ Storage layer methods specified
- ✅ Campaign failure handler designed
- ✅ Acceptance criteria defined

**Critical Requirements for Implementation:**
1. Add `idempotencyKey` field + unique index to `credit_ledger_entries`
2. Enforce idempotency in `POST /issue` and `POST /revoke` endpoints
3. Pre-check available balance before revocations
4. Atomic reservation check with row locks
5. Campaign failure handler to release orphaned reservations
6. Mandatory Exception reference for revocations

**Next:** Proceed to **Step 4 — UX Spec** (UX Trust Designer)

---
