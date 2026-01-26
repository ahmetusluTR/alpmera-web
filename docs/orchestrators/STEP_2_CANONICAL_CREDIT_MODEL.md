# STEP 2 — CANONICAL CREDIT MODEL SPECIFICATION
## Admin Console Credits System — Authoritative Data Model

**Date:** 2026-01-18
**Orchestrator:** ADMIN_PHASE_1_5_CONTINUATION.md
**Roles:** System Architect + Escrow Financial Auditor

---

## DECISION SUMMARY (Executive)

**Model Choice:** **Option A — Ledger-Only with Computed Aggregations (Recommended)**

**Rationale:**
- Minimizes trust debt (single source of truth)
- Avoids denormalization/sync complexity
- Aligns with existing escrow ledger pattern
- Sufficient performance for Phase 1.5 scale
- Explainable to non-expert admins

**Key Principle:**
> **The ledger is the truth. All balances and breakdowns are derived, never stored.**

---

## 1. CANONICAL CREDIT MODEL (Phase 1.5)

### 1.1 Core Architecture

```
┌─────────────────────────────────────────────────────────┐
│  SINGLE SOURCE OF TRUTH                                 │
│  credit_ledger_entries (append-only)                    │
│  ├─ participantId → users.id                            │
│  ├─ eventType (ISSUED, RESERVED, RELEASED, etc.)        │
│  ├─ amount (decimal 12,2 = USD)                         │
│  ├─ currency (default: USD)                             │
│  ├─ createdBy, reason, createdAt (audit trail)          │
│  └─ idempotencyKey (NEW — prevents duplicates)          │
└─────────────────────────────────────────────────────────┘
                    ↓
        DERIVED (computed on-demand)
                    ↓
┌─────────────────────────────────────────────────────────┐
│  AGGREGATIONS (never stored)                            │
│  ├─ Total Balance = SUM(amount)                         │
│  ├─ Earned = SUM(amount WHERE eventType = ISSUED)       │
│  ├─ Spent = SUM(amount WHERE eventType = APPLIED)       │
│  ├─ Reserved = SUM(amount WHERE eventType = RESERVED    │
│  │              AND no matching RELEASED/APPLIED)       │
│  └─ Available = Total Balance - Reserved                │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Why NOT Option B (Credit Accounts Table)

**Rejected: Separate `credit_accounts` table with cached balances**

**Reasons:**
1. **Sync complexity:** Requires triggers or application-level sync between ledger and account balance
2. **Trust risk:** Two sources of truth (ledger vs cached balance) can diverge
3. **Over-engineering:** Phase 1.5 scale does not require denormalization
4. **Audit complexity:** Must reconcile account balance with ledger (adds verification burden)

**If needed later:** Materialized views or read replicas can optimize queries without schema changes.

---

## 2. SCHEMA ADDITIONS (Minimal Changes)

### 2.1 Add Idempotency Key to Credit Ledger (REQUIRED)

**Purpose:** Prevent duplicate credit issuance (e.g., retry storms, double-click, API replay)

**Change to `shared/schema.ts`:**

```typescript
export const creditLedgerEntries = pgTable("credit_ledger_entries", {
  // ... existing fields ...

  // NEW FIELD (add after 'createdAt'):
  idempotencyKey: varchar("idempotency_key", { length: 255 }),

  // ... rest of fields ...
}, (table) => ({
  // NEW UNIQUE INDEX:
  idempotencyKeyIdx: uniqueIndex("credit_ledger_idempotency_key_idx").on(table.idempotencyKey),
}));
```

**Enforcement:**
- When creating ISSUED/REVOKED events via admin API, `idempotencyKey` is REQUIRED
- Format: `{scope}:{timestamp}:{participantId}:{nonce}` (e.g., `admin-issue:2026-01-18T10:30:00Z:usr_123:abc456`)
- Duplicate key → HTTP 409 Conflict (return existing entry, do not create new)

**Migration:**
- Existing entries: `idempotencyKey = NULL` (allowed)
- New entries: enforce non-null for admin-initiated events

---

### 2.2 NO New Tables Required

**Confirmed:** No `credit_accounts`, no `credit_conversion_rates`, no `credit_policies` tables.

**Ledger-only approach is sufficient for Phase 1.5.**

---

## 3. CREDIT SEMANTICS (Normative Definitions)

### 3.1 Currency Model — USD Decimal (Canonical)

**Decision:** Credits are denominated in **USD** using **decimal(12,2)** storage.

**Semantic Mapping:**
- `amount = 50.00` → **$50.00 USD credit**
- `amount = -20.00` → **$20.00 USD debit** (e.g., RESERVED, REVOKED)

**Conversion Rule:**
- **Identity conversion:** 1 credit unit = 1 USD
- No conversion table required
- No abstract "points" system

**Display:**
- Admin UI: `$50.00 USD` (always show currency)
- Participant UI: "50.00 USD credits" (never imply cash equivalence)

**Future Flexibility:**
- If multi-currency needed (e.g., EUR credits), add new ledger entries with `currency = 'EUR'`
- Balance computed per currency: `SUM(amount) GROUP BY currency`

---

### 3.2 Event Type Semantics (Binding Definitions)

| Event Type | Sign | Meaning | Triggered By | Reversible? |
|------------|------|---------|--------------|-------------|
| **ISSUED** | `+` | Credit granted to participant | Completion Credit Engine, manual admin issuance | Yes (via REVOKED) |
| **RESERVED** | `-` | Credit temporarily held for pending commitment | Participant applies credit to campaign join | Yes (via RELEASED if commitment fails) |
| **RELEASED** | `+` | Reserved credit returned (commitment failed/cancelled) | Campaign failure, commitment cancellation | No (final) |
| **APPLIED** | `0` or accounting entry | Reserved credit finalized to commitment (campaign success) | Campaign success, commitment confirmed | No (final) |
| **REVOKED** | `-` | Credit removed (exceptional admin action) | Manual admin revocation (requires Exception workflow) | No (irreversible; use compensating ISSUED if error) |
| **EXPIRED** | `-` | Credit expired per policy (future Phase 2+) | Automated expiration job | No (final) |

**RESERVED/RELEASED Pairing Invariant:**
- Every RESERVED event MUST eventually have a matching RELEASED or APPLIED event
- Orphaned RESERVED events (no pair after campaign completion) → system defect → Exception workflow

**APPLIED Accounting:**
- APPLIED events may use `amount = 0` (accounting entry only) OR `amount = -{reserved_amount}` (net to zero)
- Decision: Use `amount = 0` with reference to original RESERVED event via `reservationRef`

---

### 3.3 Balance Computation Rules (Authoritative)

#### 3.3.1 Total Balance

```sql
SELECT COALESCE(SUM(amount), 0) AS total_balance
FROM credit_ledger_entries
WHERE participant_id = $1;
```

**Includes:** ISSUED, RESERVED, RELEASED, REVOKED, EXPIRED
**Excludes:** APPLIED (if using amount = 0 accounting entry)

#### 3.3.2 Lifetime Earned

```sql
SELECT COALESCE(SUM(amount), 0) AS lifetime_earned
FROM credit_ledger_entries
WHERE participant_id = $1
  AND event_type = 'ISSUED';
```

#### 3.3.3 Lifetime Spent (Applied to Commitments)

```sql
SELECT COALESCE(SUM(ABS(amount)), 0) AS lifetime_spent
FROM credit_ledger_entries
WHERE participant_id = $1
  AND event_type = 'RESERVED'
  AND EXISTS (
    SELECT 1 FROM credit_ledger_entries cle2
    WHERE cle2.participant_id = credit_ledger_entries.participant_id
      AND cle2.reservation_ref = credit_ledger_entries.reservation_ref
      AND cle2.event_type = 'APPLIED'
  );
```

**Simplified (if APPLIED uses amount = 0):**
```sql
SELECT COUNT(*) * AVG(ABS(reserved_amount)) AS lifetime_spent
FROM credit_ledger_entries
WHERE participant_id = $1
  AND event_type = 'APPLIED';
```

#### 3.3.4 Currently Reserved

```sql
SELECT COALESCE(SUM(ABS(amount)), 0) AS currently_reserved
FROM credit_ledger_entries
WHERE participant_id = $1
  AND event_type = 'RESERVED'
  AND NOT EXISTS (
    SELECT 1 FROM credit_ledger_entries cle2
    WHERE cle2.participant_id = credit_ledger_entries.participant_id
      AND cle2.reservation_ref = credit_ledger_entries.reservation_ref
      AND cle2.event_type IN ('RELEASED', 'APPLIED')
  );
```

#### 3.3.5 Available Balance

```sql
available_balance = total_balance - currently_reserved
```

**Invariant:** `available_balance >= 0` (enforced at reservation time)

---

## 4. CREDIT LIFECYCLE FLOWS (Normative State Machines)

### 4.1 Manual Admin Credit Issuance

```
Admin initiates issuance
  ↓
Validate:
  - participantId exists
  - amount > 0
  - reason non-empty
  - idempotencyKey unique
  ↓
Create ledger entry:
  - eventType = ISSUED
  - amount = +X.XX
  - createdBy = admin username
  - reason = admin-provided reason
  - idempotencyKey = request key
  ↓
Return success (201 Created)
```

**Error Cases:**
- Participant not found → 404 Not Found
- Invalid amount → 400 Bad Request
- Duplicate idempotencyKey → 409 Conflict (return existing entry)

---

### 4.2 Participant Applies Credit to Campaign Commitment

```
Participant initiates commitment with credit application
  ↓
Check available balance >= requested credit amount
  ↓
Create RESERVED ledger entry:
  - eventType = RESERVED
  - amount = -X.XX (debit)
  - reservationRef = commitment_id
  - createdBy = SYSTEM
  - reason = "Credit reserved for commitment {ref}"
  ↓
Commitment proceeds...
  ↓
Campaign outcome determined:
  ├─ SUCCESS → Create APPLIED entry (amount = 0, reservationRef)
  └─ FAILED → Create RELEASED entry (amount = +X.XX, reservationRef)
```

**Invariant Enforcement:**
- Before RESERVED: ensure `available_balance >= requested_amount`
- RESERVED amount must match commitment credit application amount
- reservationRef must link to valid commitment

---

### 4.3 Manual Admin Credit Revocation (Exceptional)

```
Admin initiates revocation (requires Exception workflow)
  ↓
Validate:
  - participantId exists
  - amount > 0
  - available balance >= revocation amount (cannot create negative)
  - reason non-empty (requires Exception reference)
  - idempotencyKey unique
  ↓
Create ledger entry:
  - eventType = REVOKED
  - amount = -X.XX
  - createdBy = admin username
  - reason = "Exception #{id}: {reason}"
  - auditRef = exception record ID
  ↓
Return success (201 Created)
```

**Hard Rule:** Revocation MUST NOT result in negative available balance.

---

## 5. INVARIANTS & INTEGRITY RULES (Must Hold)

### 5.1 Ledger Integrity

1. **Append-only:** No UPDATE or DELETE allowed on `credit_ledger_entries`
2. **Immutable timestamps:** `createdAt` auto-set, never modified
3. **Attributable:** Every entry has `createdBy` (admin username or SYSTEM)
4. **Explainable:** Every entry has non-empty `reason`

### 5.2 Balance Integrity

1. **Derived truth:** Balance MUST equal `SUM(amount)` from ledger
2. **No stored balance:** No mutable balance field anywhere in schema
3. **Non-negative available:** `available_balance >= 0` before any RESERVED event

### 5.3 Reservation Integrity

1. **Eventual pairing:** Every RESERVED event MUST eventually have RELEASED or APPLIED
2. **Unique reservationRef:** Each reservation has unique `reservationRef` (e.g., commitment_id)
3. **No orphans:** Orphaned RESERVED (no pair) after campaign completion → Exception

### 5.4 Idempotency Integrity

1. **Unique keys:** `idempotencyKey` unique per entry (admin-initiated events)
2. **Retry safety:** Duplicate key request returns existing entry (idempotent)
3. **No reuse:** Once used, idempotency key cannot be reused for different operation

---

## 6. ABUSE PREVENTION MECHANISMS (Security Gates)

### 6.1 Idempotency Enforcement

**Threat:** Duplicate credit issuance via retry storms, double-click, API replay

**Mitigation:**
- Require `idempotencyKey` for all admin-initiated ISSUED/REVOKED events
- Unique index on `idempotencyKey` prevents duplicates at DB level
- API returns 409 Conflict with existing entry on duplicate key

### 6.2 Admin Action Auditability

**Threat:** Silent credit manipulation

**Mitigation:**
- Every admin-initiated event requires `createdBy = admin_username`
- Every event requires non-empty `reason`
- Cross-reference to `adminActionLogs` table for full audit trail
- Manual REVOKED events require `auditRef` to Exception record

### 6.3 Negative Balance Prevention

**Threat:** Revocation creating negative balance (accounting error)

**Mitigation:**
- Before REVOKED event: check `available_balance >= revocation_amount`
- Reject revocation if balance insufficient (HTTP 400 Bad Request)
- Admin must resolve via compensating ISSUED entry if balance correction needed

### 6.4 Reservation Exhaustion Prevention

**Threat:** Participant reserves more credits than available

**Mitigation:**
- Before RESERVED event: check `available_balance >= reservation_amount`
- Reject commitment if insufficient available credits
- UI shows "Available: X.XX USD (Y.YY reserved)" before commitment confirmation

### 6.5 Timestamp Immutability

**Threat:** Backdating entries to manipulate balances

**Mitigation:**
- `createdAt` is database-generated timestamp (not client-provided)
- No UPDATE allowed on `createdAt` field
- Only reversal entries (new REVOKED) allowed, never in-place edits

---

## 7. API DESIGN (Canonical Endpoints)

### 7.1 Admin Credit Summary (NEW)

**Endpoint:** `GET /api/admin/credits/participant/:participantId/summary`

**Response:**
```json
{
  "participantId": "usr_abc123",
  "participantEmail": "user@example.com",
  "participantName": "John Doe",
  "currency": "USD",
  "totalBalance": "50.00",
  "breakdown": {
    "lifetimeEarned": "100.00",
    "lifetimeSpent": "30.00",
    "currentlyReserved": "20.00",
    "availableBalance": "30.00"
  },
  "lastUpdated": "2026-01-18T10:30:00Z"
}
```

**Computation:**
- All values derived from ledger queries (no caching)
- `lastUpdated` = MAX(createdAt) from participant's ledger entries

---

### 7.2 Admin Manual Credit Issuance (NEW)

**Endpoint:** `POST /api/admin/credits/issue`

**Request:**
```json
{
  "participantId": "usr_abc123",
  "amount": "50.00",
  "currency": "USD",
  "reason": "Manual adjustment - customer service resolution case #123",
  "idempotencyKey": "admin-issue:2026-01-18T10:30:00Z:usr_abc123:xyz789"
}
```

**Response (201 Created):**
```json
{
  "id": "cle_def456",
  "participantId": "usr_abc123",
  "eventType": "ISSUED",
  "amount": "50.00",
  "currency": "USD",
  "reason": "Manual adjustment - customer service resolution case #123",
  "createdBy": "admin_johndoe",
  "createdAt": "2026-01-18T10:30:01Z",
  "idempotencyKey": "admin-issue:2026-01-18T10:30:00Z:usr_abc123:xyz789"
}
```

**Error Cases:**
- 400 Bad Request: Invalid amount, missing reason, missing idempotencyKey
- 404 Not Found: Participant not found
- 409 Conflict: Duplicate idempotencyKey (return existing entry)

---

### 7.3 Admin Manual Credit Revocation (NEW)

**Endpoint:** `POST /api/admin/credits/revoke`

**Request:**
```json
{
  "participantId": "usr_abc123",
  "amount": "20.00",
  "currency": "USD",
  "reason": "Exception #456: Credit issued in error",
  "auditRef": "exc_789",
  "idempotencyKey": "admin-revoke:2026-01-18T11:00:00Z:usr_abc123:abc123"
}
```

**Response (201 Created):**
```json
{
  "id": "cle_ghi789",
  "participantId": "usr_abc123",
  "eventType": "REVOKED",
  "amount": "-20.00",
  "currency": "USD",
  "reason": "Exception #456: Credit issued in error",
  "createdBy": "admin_johndoe",
  "createdAt": "2026-01-18T11:00:01Z",
  "auditRef": "exc_789",
  "idempotencyKey": "admin-revoke:2026-01-18T11:00:00Z:usr_abc123:abc123"
}
```

**Error Cases:**
- 400 Bad Request: Insufficient available balance, invalid amount, missing reason/auditRef
- 404 Not Found: Participant not found
- 409 Conflict: Duplicate idempotencyKey

---

## 8. COMPLETION CREDIT ENGINE READINESS

### 8.1 Integration Points

**Completion Credit Engine will:**
1. Query participant eligibility (campaign join date, commitment status, etc.)
2. Compute credit award amounts based on locked rules
3. Create ISSUED events via `createCreditLedgerEntry()` storage method
4. Link to rule set + award IDs via `ruleSetId`, `awardId` fields

**Required fields already present:**
- `ruleSetId`: Links to completion credit rule set
- `awardId`: Links to specific credit award record
- `reason`: Auto-populated with rule context (e.g., "Early join bonus - Day 1-2 window")

**No schema changes needed for Completion Credit Engine integration.**

---

### 8.2 Award Issuance Flow (Future)

```
Campaign completes successfully
  ↓
Completion Credit Engine evaluates rules
  ↓
For each eligible participant:
  Create ISSUED ledger entry:
    - eventType = ISSUED
    - amount = computed award amount
    - ruleSetId = rule set ID
    - awardId = award record ID
    - createdBy = SYSTEM
    - reason = "Completion credit - Rule Set #{ruleSetId}, Award #{awardId}"
    - idempotencyKey = "completion-award:{campaignId}:{participantId}:{ruleSetId}"
  ↓
Participant balance updated (via SUM(amount))
```

**Idempotency:** Each participant can receive at most one award per rule set (enforced by idempotency key).

---

## 9. PERFORMANCE CONSIDERATIONS (Phase 1.5)

### 9.1 Query Optimization

**Current approach:** On-demand aggregation via `SUM(amount)`

**Expected scale:**
- ~1,000 participants (Phase 1.5)
- ~10 credit events per participant average
- ~10,000 total ledger entries

**Performance:**
- Simple SUM query: <10ms (with participant_id index)
- Breakdown queries (earned/spent/reserved): ~20-50ms (with event_type + participant_id composite index)

**Acceptable for Phase 1.5 scale.**

### 9.2 Index Strategy (REQUIRED)

```typescript
// Add to creditLedgerEntries table definition:
export const creditLedgerEntries = pgTable("credit_ledger_entries", {
  // ... fields ...
}, (table) => ({
  participantIdx: index("credit_ledger_participant_idx").on(table.participantId),
  eventTypeIdx: index("credit_ledger_event_type_idx").on(table.eventType),
  participantEventIdx: index("credit_ledger_participant_event_idx").on(table.participantId, table.eventType),
  reservationRefIdx: index("credit_ledger_reservation_ref_idx").on(table.reservationRef),
  idempotencyKeyIdx: uniqueIndex("credit_ledger_idempotency_key_idx").on(table.idempotencyKey),
}));
```

### 9.3 Future Optimization (Phase 2+)

If query performance degrades (>100ms for balance queries):
- Add materialized view for participant balances (refreshed hourly)
- Add read replica for admin queries
- Consider PostgreSQL partial indexes for active participants only

**Do NOT prematurely optimize with cached balances in Phase 1.5.**

---

## 10. CANONICAL CREDIT MODEL — SUMMARY TABLE

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Architecture** | Ledger-only, no credit_accounts table | Single source of truth, minimal trust debt |
| **Balance Storage** | Derived via SUM(amount), never stored | Append-only integrity, explainability |
| **Currency Model** | USD decimal(12,2), identity conversion | Simple, no conversion table needed |
| **Event Types** | 6 types (ISSUED, RESERVED, RELEASED, APPLIED, REVOKED, EXPIRED) | Covers all lifecycle states |
| **Idempotency** | Required for admin ISSUED/REVOKED events | Prevents duplicate issuance |
| **Reservation Pairing** | RESERVED must have RELEASED or APPLIED | Prevents orphaned reservations |
| **Negative Balance** | Forbidden (enforce at revocation time) | Prevents accounting errors |
| **Admin Audit** | createdBy + reason + auditRef required | Full traceability |
| **Performance** | On-demand aggregation sufficient for Phase 1.5 | No premature optimization |
| **Completion Credit Engine** | Ready (ruleSetId, awardId fields exist) | No schema changes needed |

---

## 11. VERIFICATION CHECKLIST (Pre-Implementation)

Before implementing:

- [ ] Schema changes reviewed by ESCROW_FINANCIAL_AUDITOR
- [ ] Idempotency key format agreed upon
- [ ] Balance computation queries tested with sample data
- [ ] Negative balance prevention logic designed
- [ ] Reservation pairing invariant enforcement designed
- [ ] API endpoint contracts reviewed by UX_TRUST_DESIGNER
- [ ] Performance benchmarks estimated for Phase 1.5 scale
- [ ] Completion Credit Engine integration points confirmed

---

## STEP 2 COMPLETE ✅

**Next:** Proceed to **Step 3 — Abuse & Safety Gates** (Risk Abuse Analyst + Escrow Financial Auditor)

---
