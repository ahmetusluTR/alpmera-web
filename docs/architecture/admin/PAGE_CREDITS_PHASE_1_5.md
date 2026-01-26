# ADMIN PAGE SPEC — CREDITS (PHASE 1.5)

## Document Metadata (Machine-Readable)

**Doc_Type:** Architecture_Spec
**Domain:** Admin_Console
**Page:** Credits
**Phase:** 1.5
**Status:** ACTIVE
**Authority_Level:** Subordinate
**Parent_Authority:** `docs/canon/*`
**Enforcement:** REQUIRED

**Applies_To:**

* Admin UI (Credits)
* Admin API (Credits ledger)
* Completion Credit Engine (credit issuance)
* Participant credit balance computation
* Campaign commitment credit application

**Rule:**
Any work involving Alpmera Credits (closed-loop, platform-issued credits) MUST comply with this document unless explicitly overridden by Canon.

---

## Canon Intent

The Credits page provides **append-only ledger visibility** for all Alpmera Credit transactions.

### Core Principle

> **Credits are closed-loop, non-cash, non-transferable platform value. The ledger is the single source of truth. No mutable balance fields.**

This is **NOT**:
- A rewards dashboard
- A balance manipulation interface
- An analytics surface
- A participant messaging tool

This **IS**:
- Append-only audit trail
- Investigation and support tool
- Competitive-safe read-only surface
- Ledger integrity verification interface

---

## Definitions (Normative)

| Term | Definition |
|------|------------|
| **Alpmera Credit** | Closed-loop, platform-issued credit usable for future campaign commitments. Non-cash, non-withdrawable, non-transferable. No guaranteed monetary equivalence outside Alpmera. |
| **Credit Ledger** | Append-only record of all credit events (issuance, reservation, release, revocation, expiration) |
| **Credit Balance** | Derived value computed from ledger; never stored as mutable field |
| **Credit Event** | Single ledger entry representing credit state change |
| **Reservation** | Temporary hold on credit for pending commitment; released on commitment finalization or campaign failure |

---

## Entities & Data Model (Conceptual)

### Entity: `credit_ledger_entries`

**Purpose:** Append-only ledger of all Alpmera Credit events.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | Unique identifier |
| `participant_id` | UUID | Foreign key (users.id), NOT NULL | Participant who owns the credit |
| `event_type` | Enum | NOT NULL | ISSUED, RESERVED, RELEASED, APPLIED, REVOKED, EXPIRED |
| `amount` | Decimal(12,2) | NOT NULL | Credit amount (positive for credit, negative for debit) |
| `currency` | String | Default 'USD' | Currency code (ISO 4217) |
| `campaign_id` | UUID | Foreign key, nullable | Related campaign (if applicable) |
| `commitment_id` | UUID | Foreign key, nullable | Related commitment (if applied to commitment) |
| `rule_set_id` | UUID | Nullable | Completion credit rule set (if ISSUED from credit engine) |
| `award_id` | UUID | Nullable | Completion credit award (if ISSUED from credit engine) |
| `reservation_ref` | UUID | Nullable | Reservation identifier (for RESERVED/RELEASED pair matching) |
| `audit_ref` | UUID | Nullable | Cross-reference to audit log entry |
| `reason` | Text | NOT NULL | Human-readable reason for this event |
| `created_by` | Text | NOT NULL | SYSTEM or admin identifier |
| `created_at` | Timestamp | Auto, NOT NULL | Event timestamp |

**Invariants:**
- Entries are append-only; no UPDATE or DELETE permitted
- Every RESERVED event must have corresponding RELEASED or APPLIED event (eventual consistency)
- Balance = SUM(amount WHERE participant_id = X)
- No orphaned reservations (RESERVED without RELEASED/APPLIED after campaign completion)

---

## Event Types (Normative)

| Event Type | Amount Sign | Description | Triggered By |
|------------|-------------|-------------|--------------|
| **ISSUED** | Positive | Credit granted to participant | Completion Credit Engine, manual admin action |
| **RESERVED** | Negative | Credit temporarily held for pending commitment | Participant joins campaign with credit application |
| **RELEASED** | Positive (reversal) | Reserved credit returned (commitment failed or cancelled) | Campaign failure, commitment cancellation |
| **APPLIED** | Zero (accounting) | Reserved credit finalized to commitment | Campaign success, commitment confirmed |
| **REVOKED** | Negative | Credit removed (exceptional action) | Admin via Exception workflow only |
| **EXPIRED** | Negative | Credit expired per expiration policy (future Phase 2+) | Automated expiration process |

---

## Credit Balance Computation (Normative)

**Balance Formula:**
```sql
participant_balance = SUM(amount)
WHERE participant_id = X
AND event_type IN ('ISSUED', 'RESERVED', 'RELEASED', 'REVOKED', 'EXPIRED')
```

**Available Balance (unreserved):**
```sql
available_balance = SUM(amount)
WHERE participant_id = X
AND (
  event_type IN ('ISSUED', 'RELEASED', 'REVOKED', 'EXPIRED')
  OR (event_type = 'RESERVED' AND /* check if released or applied */)
)
```

**Rule:** Balance MUST NEVER be stored as a mutable field. Always compute from ledger.

---

## Admin Console UI Specification

### Page: Credits (`/admin/credits`)

**Purpose:** Read-only credit ledger visibility for admin investigation and support.

---

### List View: Credit Ledger Entries

**Columns:**

| Column | Description |
|--------|-------------|
| Created At | Event timestamp |
| Participant ID | Participant identifier (linked to Participants page) |
| Participant Email | For quick identification |
| Event Type | ISSUED / RESERVED / RELEASED / APPLIED / REVOKED / EXPIRED |
| Amount | Credit amount (with sign: +/- for display clarity) |
| Campaign | Linked campaign name (if applicable) |
| Commitment Ref | Commitment reference number (if applicable) |
| Reason | Human-readable event reason |
| Audit Ref | Link to Audit log (if applicable) |

**Filters:**

| Filter | Options | Purpose |
|--------|---------|---------|
| **Participant ID** | Text search | Lookup by participant |
| **Participant Email** | Text search | Lookup by email |
| **Event Type** | Dropdown (all types + "All") | Filter by event type |
| **Date Range** | From/To date picker | Temporal filtering |
| **Campaign** | Campaign selector | Campaign-specific credit events |
| **Amount Range** | Min/Max | Identify high-value events |

**Default Sort:** Created At DESC (most recent first)

**Forbidden Features:**
- No export button
- No aggregate totals
- No balance summary
- No charts or analytics

---

### Detail View: Credit Ledger Entry Detail

**Accessed by:** Clicking on a ledger entry

**Sections:**

#### Section A: Event Core

| Field | Description |
|-------|-------------|
| Event ID | System identifier |
| Event Type | ISSUED / RESERVED / etc. |
| Amount | Credit amount |
| Currency | Currency code |
| Created At | Timestamp |
| Created By | SYSTEM or admin identifier |
| Reason | Full reason text |

---

#### Section B: Participant Context

| Field | Description |
|-------|-------------|
| Participant ID | Linked to Participants page |
| Participant Name | Full name |
| Participant Email | Email address |
| Current Balance | Computed from ledger (as of this event) |

**Competitive Safety Rule:** Balance shown only in detail view, not in list view.

---

#### Section C: Related Entities (Conditional)

**Visibility:** Show only if applicable

| Field | Description |
|-------|-------------|
| Campaign | Linked campaign (if campaign_id present) |
| Commitment | Linked commitment (if commitment_id present) |
| Rule Set | Linked completion credit rule set (if rule_set_id present) |
| Award | Linked completion credit award (if award_id present) |
| Reservation Ref | Reservation identifier (for RESERVED/RELEASED pairing) |
| Audit Ref | Linked audit log entry |

---

#### Section D: Reservation Matching (for RESERVED/RELEASED events)

**Purpose:** For RESERVED or RELEASED events, show the matching pair.

| Field | Description |
|-------|-------------|
| Reservation Ref | Shared identifier |
| Paired Event | Link to matching RELEASED (if this is RESERVED) or RESERVED (if this is RELEASED) |
| Paired Event Status | PENDING (no pair yet) / MATCHED (pair found) |

**Anomaly Detection:** If RESERVED event has no matching RELEASED/APPLIED after campaign completion, flag as exception candidate.

---

## Relationship to Other Admin Pages (Normative)

### Participants Page

**Integration:**
- Participants detail page SHOULD show credit balance summary
- Link to Credits page filtered by participant_id

**Data Flow:**
- Participants page queries balance from ledger
- No direct balance storage

---

### Commitments Page

**Integration:**
- Commitment detail page SHOULD show applied credit (if any)
- Link to Credits page filtered by commitment_id

**Data Flow:**
- When commitment uses credit, RESERVED event created
- On commitment success: APPLIED event (accounting entry)
- On commitment failure: RELEASED event (credit returned)

---

### Completion Credit Engine Page

**Integration:**
- Credit Engine issues ISSUED events when awards are approved
- Each award creates one ISSUED ledger entry

**Data Flow:**
- Completion Credit Engine → Credit Ledger (ISSUED event)
- Ledger entry includes rule_set_id, award_id for audit trail

---

### Audit Page

**Integration:**
- Every manual credit action (ISSUED by admin, REVOKED) generates audit event
- audit_ref links credit ledger to audit log

---

### Exceptions Page

**Integration:**
- REVOKED events require Exception workflow
- Orphaned RESERVED events (no RELEASED/APPLIED) surfaced as exceptions

---

## API Endpoints (Conceptual)

### Admin API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/admin/credits` | GET | List credit ledger entries with filters | Admin |
| `/api/admin/credits/:id` | GET | Get credit ledger entry detail | Admin |
| `/api/admin/credits/participant/:participantId/balance` | GET | Compute participant credit balance | Admin |
| `/api/admin/credits/issue` | POST | Manually issue credit (exception workflow) | Admin |
| `/api/admin/credits/revoke` | POST | Revoke credit (exception workflow) | Admin |

### Query Parameters (GET /api/admin/credits)

| Parameter | Type | Description |
|-----------|------|-------------|
| `participantId` | UUID | Filter by participant |
| `participantEmail` | String | Filter by email (fuzzy match) |
| `eventType` | Enum | Filter by event type |
| `from` | ISO Date | Start date filter |
| `to` | ISO Date | End date filter |
| `campaignId` | UUID | Filter by campaign |
| `limit` | Integer | Page size (default 50, max 200) |
| `offset` | Integer | Pagination offset |

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "participantId": "uuid",
      "participantEmail": "user@example.com",
      "eventType": "ISSUED",
      "amount": "50.00",
      "currency": "USD",
      "campaignId": "uuid",
      "campaignName": "Campaign X",
      "commitmentId": null,
      "reason": "Completion credit - early join bonus",
      "createdBy": "SYSTEM",
      "createdAt": "2024-01-20T14:00:00Z"
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0
}
```

---

### Validation Rules (Enforced at API Layer)

**On Manual Credit Issuance:**
- Reason must be non-empty
- Amount must be positive
- Participant must exist
- Admin must acknowledge: "Manual credit issuance requires Exception workflow"

**On Credit Revocation:**
- Reason must be non-empty
- Participant balance must be >= revocation amount (cannot go negative)
- Exception workflow required
- Admin must acknowledge: "Credit revocation is an exceptional action"

---

## Participant API (Read-Only)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/participant/credits/balance` | GET | Get own credit balance | Participant |
| `/api/participant/credits/history` | GET | Get own credit ledger history | Participant |

**Response (balance):**
```json
{
  "balance": "50.00",
  "currency": "USD",
  "lastUpdated": "2024-01-20T14:00:00Z"
}
```

**Response (history):**
```json
{
  "entries": [
    {
      "id": "uuid",
      "eventType": "ISSUED",
      "amount": "50.00",
      "campaignName": "Campaign X",
      "reason": "Early participation bonus",
      "createdAt": "2024-01-20T14:00:00Z"
    }
  ]
}
```

---

## Competitive Safety Constraints (Explicit)

### Admin UI MUST NOT Display:

- Aggregate credit issuance totals across all participants
- Credit-to-commitment conversion rates
- Campaign-level credit economics (total credits issued per campaign)
- Participant-to-participant credit comparisons
- Any analytics that expose credit issuance patterns

### Admin UI MAY Display:

- Individual participant balance (in detail view only)
- Event-level details (timestamp, amount, reason)
- Audit trail for compliance

### Screenshot Safety:

**No single admin screen should enable reverse engineering of:**
- Credit issuance strategy across campaigns
- Participant credit distribution patterns

---

## Failure Modes & Recovery (Normative)

### Failure Mode 1: Orphaned Reservation

**Symptom:** RESERVED event with no matching RELEASED/APPLIED after campaign completion

**Detection:** Automated check post-campaign completion

**Recovery:**
1. Identify affected participant and campaign
2. Create HIGH Exception
3. Manual review:
   - If commitment succeeded: Create APPLIED event (accounting entry)
   - If commitment failed: Create RELEASED event (return credit)
4. Log correction in audit trail

---

### Failure Mode 2: Negative Balance

**Symptom:** Computed balance < 0 for participant

**Detection:** Balance computation check

**Recovery:**
1. Block further credit operations for participant
2. Create CRITICAL Exception
3. Manual ledger audit
4. Identify erroneous entry
5. Create compensating entry with Exception reference
6. Resume operations only after balance >= 0

---

### Failure Mode 3: Duplicate Credit Issuance

**Symptom:** Same award_id appears in multiple ISSUED events

**Detection:** Unique constraint validation or post-processing check

**Recovery:**
1. Create HIGH Exception
2. Manual review of award processing
3. Option A: Revoke duplicate (if identifiable)
4. Option B: Honor both (if ambiguous)
5. Fix award processing logic to prevent recurrence

---

## Trust Model Compliance Checklist

| Principle | Implementation |
|-----------|----------------|
| **No Silent Transitions** | All credit events logged with timestamp, actor, reason |
| **No Implicit Guarantees** | Credits explicitly described as "non-cash, non-guaranteed value" |
| **No Asymmetry** | All participants subject to same credit rules; no hidden bonuses |
| **No Optimism Bias** | Credit balance shown as "available" not "earned" or "saved" |
| **Trust Debt Rule** | Manual credit actions require Exception workflow + audit trail |

---

## Rollout Plan (Phase 1.5)

### Stage 1: Ledger Infrastructure (Week 1)

- [ ] Database schema (`credit_ledger_entries`)
- [ ] Zod schemas and types
- [ ] Storage layer (insert, query)
- [ ] Balance computation logic
- [ ] Unit tests

### Stage 2: Admin API (Week 2)

- [ ] GET /api/admin/credits (list with filters)
- [ ] GET /api/admin/credits/:id (detail)
- [ ] GET /api/admin/credits/participant/:id/balance
- [ ] Integration tests

### Stage 3: Admin UI (Week 3)

- [ ] Credits list page
- [ ] Filters UI
- [ ] Detail view
- [ ] Participant page integration (balance display)

### Stage 4: Participant API (Week 4)

- [ ] GET /api/participant/credits/balance
- [ ] GET /api/participant/credits/history
- [ ] Participant-facing credit display

### Stage 5: Integration with Completion Credit Engine (Week 5)

- [ ] ISSUED event creation on award approval
- [ ] Ledger reconciliation checks
- [ ] Exception handling for mismatches

---

## Verification Steps (Pre-Production)

**Before deploying to production:**

1. **Ledger Integrity**
   - [ ] No mutable balance fields in schema
   - [ ] All events append-only verified
   - [ ] Balance computation tested with edge cases

2. **Competitive Safety**
   - [ ] No aggregate totals in admin UI
   - [ ] No export functionality
   - [ ] Screenshot review (no economics leaks)

3. **Trust Compliance**
   - [ ] All manual actions require Exception workflow
   - [ ] Audit trail complete for all events
   - [ ] Participant-facing language reviewed (no "earned", "saved", etc.)

---

## Rollback Plan

**If critical issues detected post-launch:**

1. **Immediate Actions**
   - Disable credit application to commitments (feature flag)
   - Disable manual credit issuance
   - Preserve all ledger data (no deletions)

2. **Data Preservation**
   - Mark affected entries with rollback flag
   - Preserve full audit trail

3. **Recovery Options**
   - Option A: Fix issue + resume credit system
   - Option B: Freeze credits; honor existing balances; no new issuance
   - Option C: Compensate participants via manual Exception workflow

**Decision Authority:** Requires Canon review + operational lead approval

---

## Final Canon Statement

The Credits page is **operational infrastructure**, not a participant engagement tool.

It exists to:
- Provide **append-only audit trail** for all credit events
- Enable **support investigation** without balance manipulation
- Maintain **competitive safety** by hiding aggregate economics
- Preserve **trust** through immutable ledger and Exception-gated actions

Any use of this page that:
- Exposes aggregate credit economics
- Allows balance manipulation without Exception workflow
- Creates analytics surfaces
- Violates Language Rules

**...is a Canon violation and MUST be blocked.**

**This document is binding for Phase 1.5.**

---
