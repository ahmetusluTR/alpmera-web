# ADMIN PAGE SPEC — PARTICIPANT CREDITS (PHASE 1.5)

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
- Participant Credit System (Alpmera Credit)
- Admin UI (Credits & Participant surfaces)
- Credit Ledger & balance derivation
- Completion Credit Engine (issuer only)
- Campaign commitment application

**Rule:**
Any work involving credits, balances, application of credits, or credit visibility
MUST comply with this document unless explicitly overridden by Canon.

---

## Canon Intent

The Participant Credit System defines **closed-loop Alpmera Credit**
as a **ledger-based, append-only financial construct** used to adjust
future campaign commitments **without cash equivalence**.

Credits exist to:
- Reward deterministic, rule-based outcomes (e.g. completion credits)
- Preserve commitment clarity (no retroactive price changes)
- Maintain escrow and audit discipline
- Prevent silent or manual financial adjustments

Credits are **not**:
- Cash
- Refunds
- Withdrawable balances
- Negotiable instruments
- A substitute for escrow refunds

---

## Core Principles (Normative)

1. **Closed-Loop Only**  
   Credits may only be applied to future Alpmera campaign commitments.

2. **Ledger Is the Source of Truth**  
   Balances are **derived**, never stored or edited.

3. **Append-Only Discipline**  
   No credit event is deleted or overwritten.

4. **No Silent Transitions**  
   Every credit change is logged, attributable, and explainable.

5. **Exception-Only Reversal**  
   Revocation requires a formal Exception with immutable audit reason.

6. **Competitive Safety**  
   Credit data must never enable inference of supplier or platform economics.

---

## Definitions (Normative)

| Term | Definition |
|-----|------------|
| **Alpmera Credit** | Closed-loop, non-cash credit usable only toward future campaign commitments |
| **Credit Ledger** | Append-only record of all credit events |
| **Credit Balance** | Derived value computed from ledger entries |
| **Reservation** | Temporary credit hold to prevent double-spend |
| **Exception** | Formal, auditable override workflow required for revocation |

---

## Credit Data Model (Conceptual)

### Entity: `credit_ledger_entry`

**Purpose:** Immutable record of all credit-related events.

| Field | Type | Constraints | Description |
|-----|------|-------------|-------------|
| `id` | UUID | PK | Ledger entry identifier |
| `participant_id` | UUID | FK | Credit owner |
| `event_type` | Enum | REQUIRED | See Event Types |
| `amount` | Currency | Signed | Positive or negative |
| `currency` | String | ISO 4217 | Always platform base currency |
| `campaign_id` | UUID | Nullable | Originating campaign |
| `commitment_id` | UUID | Nullable | Related commitment |
| `rule_set_id` | UUID | Nullable | Credit rule source |
| `award_id` | UUID | Nullable | Completion Credit award |
| `reservation_ref` | UUID | Nullable | Reservation linkage |
| `audit_ref` | UUID | REQUIRED | Audit / Exception reference |
| `created_at` | Timestamp | Auto | Event time |
| `created_by` | Enum | SYSTEM / ADMIN | Actor |

---

### Event Types (Closed Set)

| Event | Meaning |
|------|--------|
| `CREDIT_EARNED` | Credit granted (e.g. completion credit) |
| `CREDIT_RESERVED` | Credit held for pending commitment |
| `CREDIT_RELEASED` | Reservation released unused |
| `CREDIT_SPENT` | Credit applied to commitment |
| `CREDIT_REVOKED` | Credit removed via Exception |

No other event types are permitted in Phase 1.5.

---

## Balance Derivation (Normative)

Credit balance is **derived**, never stored.

```

Available Balance =
SUM(CREDIT_EARNED)

* SUM(CREDIT_SPENT)
* SUM(CREDIT_RESERVED)
* SUM(CREDIT_REVOKED)

```

**Invariants:**
- Available Balance MUST NEVER be negative
- Reservations MUST precede spending
- Spending without reservation is invalid

Any violation triggers a CRITICAL Exception.

---

## Credit Lifecycle

### 1. Earning Credits
Credits may be earned only via:
- Completion Credit Engine
- Explicit Canon-approved mechanisms

System action:
- Create `CREDIT_EARNED` ledger entry
- Reference rule set, campaign, and award

---

### 2. Reservation (Anti Double-Spend)

When a participant applies credits to a new commitment:
- System creates `CREDIT_RESERVED`
- Amount ≤ Available Balance
- Reservation tied to commitment draft

If commitment fails or expires:
- Create `CREDIT_RELEASED`

---

### 3. Spending Credits

When commitment is finalized:
- Convert reservation → `CREDIT_SPENT`
- Reservation entry remains immutable

---

### 4. Revocation (Exception-Only)

Revocation is **not operational**.

**Requirements:**
- Formal Exception record
- Immutable reason
- Actor attribution
- Participant notification

Ledger action:
- Create `CREDIT_REVOKED`
- Negative amount
- Reference Exception ID

Repeated revocations require mandatory post-mortem review.

---

## Credit Application Rules

### Default Conversion

- **100 Alpmera Credit = $1 USD applied to commitment**
- Applied at commitment time
- Never retroactive

### Restrictions (Phase 1–2)

- ❌ No cash-out
- ❌ No transfers between participants
- ❌ No conversion to refunds
- ❌ No manual balance edits

Any non-1:1 conversion:
- Must be locked per campaign
- Must be disclosed pre-join
- Must never be retroactive

---

## Admin Console Surfaces

### Participants — Credit Summary (Required)

**Location:** Participant Detail Page

**Display:**
- Available Credit Balance
- Reserved Amount
- Recent Ledger Entries (last N)
- No totals by campaign

---

### Credits — Global Ledger (Optional)

**Route:** `/admin/credits`

**Purpose:** Audit & investigation only.

**Capabilities:**
- Filter by participant
- Filter by event type
- Filter by campaign
- Time range search

**Prohibited:**
- Export
- Aggregate financial analytics
- Cross-campaign economics

---

### Completion Credit Engine Integration

- Award runs create `CREDIT_EARNED`
- Engine MUST NOT compute balances
- Ledger is the only interface

---

## Audit Integration

Every ledger entry generates an audit event:

| Event | Trigger |
|------|--------|
| `CREDIT_EARNED` | Credit issued |
| `CREDIT_RESERVED` | Reservation created |
| `CREDIT_RELEASED` | Reservation released |
| `CREDIT_SPENT` | Credit applied |
| `CREDIT_REVOKED` | Credit revoked |

Audit payload includes:
- Ledger entry ID
- Actor
- Reason
- References

---

## Competitive Safety Constraints

Admin UI MUST NOT:
- Show implied margins
- Show % savings
- Show campaign-to-campaign credit ratios
- Show “value unlocked” messaging

Credits are displayed as **absolute values only**.

---

## Failure Modes & Recovery

### Ledger Inconsistency
- Immediate CRITICAL Exception
- Block credit usage
- Manual reconciliation required

### Orphaned Reservation
- Auto-release after TTL
- Audit logged

### Incorrect Credit Application
- Exception → revoke + notify
- No silent fixes

---

## Trust Model Compliance

| Principle | Implementation |
|---------|----------------|
| No Silent Transitions | All credit events are ledgered |
| No Implicit Guarantees | Credits described as conditional |
| No Asymmetry | Same ledger truth for all |
| No Optimism Bias | No “expected value” framing |
| Trust Debt Rule | Manual edits prohibited |

---

## Final Canon Statement

The Participant Credit System is **financial infrastructure**, not a rewards feature.

Any implementation that:
- Stores mutable balances
- Allows manual adjustments
- Enables cash equivalence
- Obscures credit events

**…is a Canon violation and MUST be blocked.**

**This document is binding for Phase 1.5.**

---
