# ADMIN PAGE SPEC — COMPLETION CREDIT ENGINE (PHASE 1.5)

## Document Metadata (Machine-Readable)

**Doc_Type:** Architecture_Spec
**Domain:** Admin_Console
**Page:** Completion_Credit_Engine
**Phase:** 1.5
**Status:** ACTIVE
**Authority_Level:** Subordinate
**Parent_Authority:** `docs/canon/*`
**Enforcement:** REQUIRED
**Hard_Dependency:**
- `docs/architecture/admin/PAGE_CREDITS_PHASE_1_5.md`


**Applies_To:**

* Admin UI (Completion Credit Engine)
* Admin API (Credit rule management)
* Campaign lifecycle (post-completion credit issuance)
* Escrow/ledger integration
* Participant-facing credit disclosure

**Rule:**
Any work involving completion credits, post-completion adjustments, or campaign-linked incentive rules MUST comply with this document unless explicitly overridden by Canon.

---

## Canon Intent

The Completion Credit Engine enables **rule-based, deterministic, post-completion adjustments** to participant outcomes **without changing the commitment amount**.
### Dependency Notice (Normative)

This engine REQUIRES the Participant Credit System defined in
`docs/architecture/admin/PAGE_CREDITS_PHASE_1_5.md`.

All credit issuance, balance calculation, reservation, revocation,
and participant-facing credit display MUST be performed exclusively
through the closed-loop Alpmera Credit ledger defined there.

This document does NOT define credit storage or balance semantics.
Any implementation that bypasses the Participant Credit ledger
constitutes a Canon violation.


### Core Principle

> **Commitment amounts are FIXED and public. Credits are post-completion adjustments based on locked, objective rules.**

This is **NOT**:
- Dynamic pricing
- Personalized discounts
- Subjective evaluation
- Hidden incentives

This **IS**:
- Transparent rule disclosure before participation
- Deterministic eligibility computed from objective facts
- Post-completion issuance only
- Escrow-safe credit ledger integration

---

## Role Authority (Normative)

Primary Owners:
- Credit Rule Design & Locking: MARKETPLACE_GATEKEEPER
- Public Disclosure Copy Approval: UX_TRUST_DESIGNER
- Ledger Integrity & Reconciliation: ESCROW_FINANCIAL_AUDITOR
- Award Issuance Execution: OPS_FULFILLMENT_ARCHITECT

Blocking Authority:
- Any role may block activation if Trust Model risk is identified.

---

## Definitions (Normative)

| Term | Definition |
|------|------------|
| **Completion Credit** | A post-completion financial adjustment issued to participants based on pre-locked rules and objective eligibility criteria |
| **Commitment Amount** | The fixed, public amount a participant commits when joining a campaign; **never changes** |
| **Credit Rule Set** | A versioned, immutable collection of credit rules linked to a campaign |
| **Join Window** | A time-based eligibility window (e.g., Day 1-2, Day 3-5) relative to campaign start |
| **Credit Award** | An individual credit issuance to a specific participant based on rule evaluation |
| **Alpmera Credit** | Closed-loop, platform-issued credit usable for future campaign commitments. Credits are non-cash, non-withdrawable, non-transferable. They may only be applied toward future campaign commitments. Credits have no guaranteed monetary equivalence outside the Alpmera system.|


---

## Entities & Data Model (Conceptual)

### Entity: `completion_credit_rule_set`

**Purpose:** Container for all credit rules associated with a campaign.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | Unique identifier |
| `campaign_id` | UUID | Foreign key, nullable | Links to specific campaign (null = template) |
| `status` | Enum | DRAFT, LOCKED, ACTIVE, ARCHIVED | Lifecycle state |
| `version` | Integer | Auto-increment | Rule set version for audit |
| `description` | Text | Admin-only | Internal notes |
| `public_disclosure_copy` | Text | Required before ACTIVE | Safe, Canon-compliant participant-facing text |
| `created_by` | UUID | Required | Admin who created |
| `created_at` | Timestamp | Auto | Creation time |
| `locked_at` | Timestamp | Nullable | When rules were locked |
| `locked_by` | UUID | Nullable | Admin who locked |
| `activated_at` | Timestamp | Nullable | When rule set became active |
| `activated_by` | UUID | Nullable | Admin who activated |
| `archived_at` | Timestamp | Nullable | When archived |
| `archived_by` | UUID | Nullable | Admin who archived |

---

### Entity: `completion_credit_rule`

**Purpose:** Individual credit eligibility rules within a rule set.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | Unique identifier |
| `rule_set_id` | UUID | Foreign key | Parent rule set |
| `rule_name` | Text | Required | Admin label (e.g., "Early Join Window 1") |
| `join_window_start_day` | Integer | >= 0 | Days from campaign start (inclusive) |
| `join_window_end_day` | Integer | >= start_day | Days from campaign start (inclusive) |
| `credit_amount` | Currency | > 0 | Fixed credit amount |
| `credit_currency` | String | ISO 4217 | Currency code |
| `eligibility_condition` | JSON | Nullable | Additional deterministic filters (future) |
| `precedence` | Integer | Required | Rule priority if overlapping windows |
| `created_at` | Timestamp | Auto | Creation time |

**Invariants:**
- `join_window_end_day >= join_window_start_day`
- Within a rule set, overlapping windows MUST have distinct precedence values
- Once rule set is LOCKED, rules are immutable

---

### Entity: `completion_credit_award`

**Purpose:** Append-only ledger of credit issuances.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | Unique identifier |
| `campaign_id` | UUID | Foreign key | Source campaign |
| `participant_id` | UUID | Foreign key | Recipient participant |
| `commitment_id` | UUID | Foreign key | Source commitment |
| `rule_set_id` | UUID | Foreign key | Applied rule set |
| `rule_id` | UUID | Foreign key | Specific rule matched |
| `credit_amount` | Currency | > 0 | Issued credit |
| `credit_currency` | String | ISO 4217 | Currency code |
| `award_status` | Enum | PENDING, ISSUED, REVOKED | Lifecycle state |
| `issued_at` | Timestamp | Nullable | When credit was issued |
| `revoked_at` | Timestamp | Nullable | When credit was revoked (exception only) |
| `revoked_reason` | Text | Required if revoked | Audit trail |
| `ledger_entry_id` | UUID | Foreign key | Links to escrow ledger |
| `created_at` | Timestamp | Auto | Record creation |

**Invariants:**
- Awards are append-only; updates only change `award_status`
- Every ISSUED award MUST have corresponding ledger entry
- REVOKED awards MUST have `revoked_reason`
- REVOCATION is an exceptional action.
- Routine or batch revocation is prohibited.
- Repeated revocations trigger mandatory post-mortem review.


---

## Rule Set State Machine (Normative)

```
DRAFT → LOCKED → ACTIVE → ARCHIVED
  ↓        ↓        ↓
DELETE   (blocked) (blocked)
```

### State Definitions

| State | Meaning | Allowed Transitions | Edit Rules |
|-------|---------|---------------------|------------|
| **DRAFT** | Work in progress | → LOCKED, → DELETE | Fully editable |
| **LOCKED** | Rules finalized, not yet active | → ACTIVE | **Immutable** (exception required) |
| **ACTIVE** | Rules in effect for campaign | → ARCHIVED | **Immutable** (exception required) |
| **ARCHIVED** | Historical record | None | **Immutable** (read-only) |

### Transition Rules

#### DRAFT → LOCKED

**Preconditions:**
- All required fields populated
- `public_disclosure_copy` approved (manual verification required)
- No overlapping windows with identical precedence
- At least one rule defined
- Precedent Review completed if credit rules materially differ from prior campaigns


**Effects:**
- Sets `locked_at`, `locked_by`
- Rules become immutable
- Version snapshot created

**Admin Checklist (UI-enforced acknowledgment):**
- [ ] "No retroactive changes after lock"
- [ ] "Public copy complies with Language Rules"
- [ ] "Competitive safety review completed"
- [ ] "No implicit guarantees in copy"

---

#### LOCKED → ACTIVE

**Preconditions:**
- Rule set is LOCKED
- Campaign is in DRAFT or AGGREGATION state
- No other ACTIVE rule set for this campaign

**Effects:**
- Sets `activated_at`, `activated_by`
- Rule set becomes the canonical source for credit calculation
- Public disclosure copy becomes visible on campaign page

**Admin Action Required:**
- Link rule set to campaign
- Confirm campaign participant-facing display

---

#### ACTIVE → ARCHIVED

**Preconditions:**
- Campaign has completed (SUCCESS → FULFILLMENT → RELEASED or FAILED)
- All awards have been processed (no PENDING awards)

**Effects:**
- Sets `archived_at`, `archived_by`
- Rule set preserved for audit but no longer executable

---

### Immutability Enforcement

**After LOCKED:**
- Changes require Exception workflow
- Exception MUST log:
  - What changed
  - Who authorized
  - Why change was necessary
  - Risk assessment
- All affected participants MUST be notified

---

## Admin Console UI Specification

### Page: Completion Credit Engine (`/admin/completion-credit-engine`)

**Purpose:** Manage credit rule sets across campaigns.

---

### List View: Rule Sets

**Columns:**

| Column | Description |
|--------|-------------|
| Rule Set ID | System identifier |
| Campaign | Linked campaign (or "Template" if null) |
| Status | DRAFT / LOCKED / ACTIVE / ARCHIVED |
| Version | Rule set version number |
| Created By | Admin name |
| Created At | Timestamp |
| Rules Count | Number of rules in set |

**Filters:**
- Status
- Campaign
- Created Date Range

**Default Sort:** Created At DESC

**Actions:**
- Create New Rule Set
- View/Edit (DRAFT only)
- Lock (DRAFT → LOCKED)
- Activate (LOCKED → ACTIVE)
- Archive (ACTIVE → ARCHIVED, conditional)

---

### Detail View: Rule Set Detail

**Sections:**

#### Section A: Rule Set Identity

| Field | Editable (DRAFT only) |
|-------|----------------------|
| Campaign | Yes |
| Description (admin-only) | Yes |
| Public Disclosure Copy | Yes |
| Status | Read-only (transitions via actions) |
| Version | Read-only |

**Public Disclosure Copy Field:**

**Purpose:** Participant-facing text explaining credit eligibility.

**Requirements:**
- MUST NOT create price ladders or discount language
- MUST NOT expose supplier or margin information
- MUST comply with `docs/canon/LANGUAGE_RULES.md`
- MUST state: "Commitment amount is fixed. Early participation may affect post-completion outcome."

**Example (Compliant):**
```
Early participants may receive completion credits after the campaign
successfully completes. Everyone commits the same amount. Credits are
issued based on join timing and are applied after fulfillment. No
guarantees are made regarding credit amounts.
```

**Example (NON-Compliant):**
```
❌ "Join early and save $100!" (discount language)
❌ "First 50 people get 20% off" (creates price ladder)
❌ "We're passing supplier savings to you" (exposes economics)
```

---

#### Section B: Credit Rules

**Table of Rules:**

| Rule Name | Join Window | Credit Amount | Precedence | Actions |
|-----------|-------------|---------------|------------|---------|
| Early Window 1 | Day 0-2 | $50 | 1 | Edit (DRAFT), Delete (DRAFT) |
| Early Window 2 | Day 3-5 | $25 | 2 | Edit (DRAFT), Delete (DRAFT) |

**Add Rule Button:** (DRAFT only)

**Rule Creation Form:**

| Field | Input Type | Validation |
|-------|------------|------------|
| Rule Name | Text | Required, 1-100 chars |
| Join Window Start Day | Integer | >= 0 |
| Join Window End Day | Integer | >= Start Day |
| Credit Amount | Currency | > 0 |
| Precedence | Integer | Unique within rule set |

**Validation Rules:**
- No overlapping windows with same precedence
- Credit amount MUST NOT equal or exceed typical commitment amounts (competitive safety)
- Maximum 10 rules per set (operational simplicity)

---

#### Section C: State History (Read-Only)

**Timeline of State Transitions:**

| Timestamp | From | To | Actor | Notes |
|-----------|------|-----|-------|-------|
| 2024-01-15 10:00 | — | DRAFT | admin@alpmera.com | Created |
| 2024-01-16 14:23 | DRAFT | LOCKED | admin@alpmera.com | Checklist acknowledged |
| 2024-01-17 09:00 | LOCKED | ACTIVE | admin@alpmera.com | Linked to Campaign X |

---

#### Section D: Preview (Participant-Facing)

**Purpose:** Show exactly what participants will see on the campaign page.

**Display:**
- Public disclosure copy
- No rule details
- No credit amounts
- No windows

**Rationale:** Prevents screenshot-based reverse engineering of rule logic.

---

### Workflow: Create New Rule Set

**Steps:**

1. **Create (DRAFT)**
   - Select campaign or leave as template
   - Enter description
   - Draft public disclosure copy

2. **Add Rules**
   - Define join windows
   - Set credit amounts
   - Assign precedence

3. **Preview**
   - Review participant-facing copy
   - Verify no competitive leaks

4. **Lock**
   - Admin checklist acknowledgment:
     - [ ] No retroactive changes
     - [ ] Language Rules compliance
     - [ ] Competitive safety verified
     - [ ] No implicit guarantees
   - Transition to LOCKED

5. **Activate**
   - Link to campaign (if not already linked)
   - Confirm public disclosure
   - Transition to ACTIVE

---

### Workflow: Post-Completion Credit Award Run

**Trigger:** Campaign transitions to RELEASED state.

**Process:**

1. **Eligibility Calculation** (automated)
   - For each commitment in campaign:
     - Determine join day relative to campaign start
     - Match against active rule set
     - Apply precedence rules if overlapping
     - Create award record (PENDING)

2. **Admin Review** (manual gate)
   - View award summary:
     - Total credits to be issued
     - Number of participants affected
     - Aggregate credit amount (if competitive-safe)
   - Approve or reject batch

3. **Award Issuance** (automated on approval)
   - For each PENDING award:
     - Create ledger entry (escrow-linked)
     - Update award status to ISSUED
     - Log audit event
     - Queue participant notification

4. **Verification**
   - Reconcile ledger entries
   - Verify all awards have corresponding ledger IDs
   - Surface any failures to Exceptions page

---

## Integration Points (Normative)

### Campaign Lifecycle Integration

**Hook Point:** Campaign Detail Page

**Display (when ACTIVE rule set exists):**
- Badge: "Completion Credits Available"
- Public disclosure copy (read-only)
- Link to full terms (if applicable)

**Rule:** Credit information MUST NOT be shown if campaign state is FAILED.

---

### Escrow / Ledger Integration

**Credit Issuance Process:**

1. Award approved (status: PENDING → ISSUED)
2. Create ledger entry:
   - Entry type: `CREDIT_ISSUED`
   - Amount: Credit amount
   - Actor: SYSTEM
   - Reason: "Completion credit - Rule Set [ID], Rule [ID]"
   - Cross-reference: `award_id`
3. Create CREDIT_ISSUED ledger entry. Balance is derived from ledger
4. Link `ledger_entry_id` to award record

**Invariant:**
```
SUM(credit_awards WHERE status=ISSUED) = SUM(ledger WHERE type=CREDIT_ISSUED)
```

**Discrepancy Handling:**
If invariant fails → create Exception with CRITICAL severity.

---

### Commitment Relationship

**Rule:** Credits are **linked to commitments**, not participants.

- One commitment → zero or one credit award
- If participant has multiple commitments in same campaign (edge case) → each evaluated independently

**Commitment Detail View Enhancement:**

Add Section I: Completion Credit (Conditional)

**Visibility Rule:** Show only if award exists for this commitment.

**Fields:**
- Credit Amount
- Award Status (PENDING / ISSUED / REVOKED)
- Rule Set (linked)
- Issued At
- Ledger Entry (linked)

---

### Audit Integration

**Events Generated:**

| Event Type | Trigger |
|------------|---------|
| `CREDIT_RULE_SET_CREATED` | Rule set created |
| `CREDIT_RULE_SET_LOCKED` | DRAFT → LOCKED |
| `CREDIT_RULE_SET_ACTIVATED` | LOCKED → ACTIVE |
| `CREDIT_RULE_SET_ARCHIVED` | ACTIVE → ARCHIVED |
| `CREDIT_RULE_CREATED` | Rule added to set |
| `CREDIT_RULE_UPDATED` | Rule modified (DRAFT only) |
| `CREDIT_RULE_DELETED` | Rule removed (DRAFT only) |
| `CREDIT_AWARD_CREATED` | Award eligibility determined |
| `CREDIT_AWARD_ISSUED` | Award processed |
| `CREDIT_AWARD_REVOKED` | Award reversed (exception) |

**Audit Payload (minimum):**
- Event type
- Timestamp
- Actor (admin or SYSTEM)
- Entity IDs (rule_set_id, rule_id, award_id)
- State before/after (for transitions)
- Reason (if manual action)

---

### Exceptions Integration

**Exception Scenarios:**

| Scenario | Severity | Handling |
|----------|----------|----------|
| Need to modify LOCKED rule set | HIGH | Exception required; admin justification + audit trail |
| Award issuance failure (ledger mismatch) | CRITICAL | Block completion; manual reconciliation required |
| Participant disputes credit eligibility | MEDIUM | Exception created; review join timestamp + rule logic |
| Rule set activated without campaign link | MEDIUM | Prevent activation; surface error |

---

## Competitive Safety Constraints (Explicit)

### Admin UI MUST NOT Display:

- Supplier cost or margin
- Per-unit economics (derived from commitments ÷ quantity)
- Aggregate revenue projections
- Profit per campaign
- Credit ROI calculations
- Campaign-to-campaign pricing comparisons

### Admin UI MAY Display:

- Rule set status and version
- Credit amounts (absolute, not as % of commitment)
- Award counts (aggregate only, no per-participant breakdowns in list view)
- Audit logs (for compliance, not analytics)

### Screenshot Safety Rule:

**No single admin screen should enable reverse engineering of:**
- Supplier pricing
- Alpmera margin structure
- Commitment-to-credit ratios across campaigns

**Mitigation:**
- Separate views for rule configuration vs award issuance
- Suppress aggregate totals in high-exposure views
- Admin-only access (no export, no API exposure)

---

## Participant-Facing Disclosure (Canon Compliance)

### Where Credits Are Mentioned:

1. **Campaign Detail Page (Public)**
   - Section: "Completion Credits"
   - Content: `public_disclosure_copy` from ACTIVE rule set
   - Placement: Below commitment section, above FAQ

2. **Commitment Confirmation (Email/Web)**
   - Text: "This campaign may offer completion credits. See campaign page for details."
   - Link: Back to campaign page

3. **Post-Completion Notification (Email)**
   - Subject: "Campaign [Name] Complete - Credit Issued"
   - Body: "You received a $[amount] completion credit based on your join timing. This credit is available for future campaigns."

### What MUST NOT Be Disclosed:

- Specific join windows before joining
- Tiered credit amounts
- "How much you could have saved"
- Comparative messaging ("others got more/less")

### Language Rules Compliance:

**Allowed:**
- "Completion credit"
- "Early participation may affect outcome"
- "Credits issued after fulfillment"
- "No guarantees regarding credit amounts"

**Forbidden:**
- "Discount"
- "Early bird pricing"
- "Limited time offer"
- "Save $X by joining now"

---

## Failure Modes & Recovery (Normative)

### Failure Mode 1: Ledger Mismatch

**Symptom:** Award marked ISSUED but no corresponding ledger entry.

**Detection:** Automated reconciliation check post-issuance.

**Recovery:**
1. Block further awards
2. Create CRITICAL Exception
3. Manual ledger audit
4. Identify missing entries
5. Recreate ledger entries with audit annotation
6. Resume awards only after full reconciliation

---

### Failure Mode 2: Rule Set Activated for Wrong Campaign

**Symptom:** ACTIVE rule set linked to unintended campaign.

**Detection:** Admin review or participant complaint.

**Recovery:**
1. Create HIGH Exception
2. If no awards issued yet:
   - Deactivate rule set
   - Correct campaign link
   - Reactivate
3. If awards already issued:
   - Assess impact (how many participants)
   - Option A: Honor awards (absorb cost)
   - Option B: Revoke awards + notify participants (trust risk)
   - Decision logged in Exception

---

### Failure Mode 3: Public Copy Contains Competitive Leak

**Symptom:** Disclosure copy exposes supplier pricing or margin.

**Detection:** Pre-activation review or post-launch audit.

**Recovery:**
1. Immediate campaign HIDE (if published)
2. Update `public_disclosure_copy`
3. Re-lock rule set (exception required)
4. Notify all existing participants of copy change
5. Resume campaign

---

### Failure Mode 4: Participant Join Timestamp Incorrect

**Symptom:** Participant disputes credit eligibility; claims earlier join.

**Detection:** Exception filed by support.

**Recovery:**
1. Audit commitment timestamp
2. Cross-reference with server logs
3. If timestamp error confirmed:
   - Create manual award with Exception reference
   - Issue credit + ledger entry
   - Log correction in audit trail
4. If timestamp correct:
   - Communicate rule logic to participant
   - Close Exception

---

## Trust Model Compliance Checklist

| Principle | Implementation |
|-----------|----------------|
| **No Silent Transitions** | All rule set state changes logged to Audit |
| **No Implicit Guarantees** | Public copy explicitly states "no guarantees regarding credit amounts" |
| **No Asymmetry** | All participants see same public disclosure; eligibility is deterministic |
| **No Optimism Bias** | Credits described as "may receive," not "will receive" |
| **Trust Debt Rule** | Rule set changes after LOCKED require Exception + participant notification |

---

## API Endpoints (Conceptual)

### Admin API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/admin/credit-rule-sets` | GET | List all rule sets | Admin |
| `/api/admin/credit-rule-sets` | POST | Create new rule set | Admin |
| `/api/admin/credit-rule-sets/:id` | GET | Get rule set detail | Admin |
| `/api/admin/credit-rule-sets/:id` | PATCH | Update rule set (DRAFT only) | Admin |
| `/api/admin/credit-rule-sets/:id/lock` | POST | Transition DRAFT → LOCKED | Admin |
| `/api/admin/credit-rule-sets/:id/activate` | POST | Transition LOCKED → ACTIVE | Admin |
| `/api/admin/credit-rule-sets/:id/archive` | POST | Transition ACTIVE → ARCHIVED | Admin |
| `/api/admin/credit-rule-sets/:id/rules` | GET | List rules in set | Admin |
| `/api/admin/credit-rule-sets/:id/rules` | POST | Add rule (DRAFT only) | Admin |
| `/api/admin/credit-rule-sets/:id/rules/:rule_id` | PATCH | Update rule (DRAFT only) | Admin |
| `/api/admin/credit-rule-sets/:id/rules/:rule_id` | DELETE | Delete rule (DRAFT only) | Admin |
| `/api/admin/credit-awards/campaign/:campaign_id` | GET | List awards for campaign | Admin |
| `/api/admin/credit-awards/batch-approve` | POST | Approve pending awards | Admin |
| `/api/admin/credit-awards/:id/revoke` | POST | Revoke issued award (exception) | Admin |

### Validation Rules (Enforced at API Layer)

**On Rule Set Lock:**
- Public disclosure copy not empty
- At least one rule defined
- No overlapping windows with same precedence
- Admin checklist acknowledged

**On Rule Set Activate:**
- Status is LOCKED
- Campaign linked
- No other ACTIVE rule set for same campaign

**On Award Issuance:**
- Campaign state is RELEASED
- All commitments have been evaluated
- Ledger reconciliation check passes

---

## Participant API (Read-Only)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/campaigns/:id/credit-disclosure` | GET | Get public disclosure copy | Public |
| `/api/participant/credits` | GET | List participant's issued credits | Participant |

**Response (credit-disclosure):**
```json
{
  "campaign_id": "uuid",
  "has_credits": true,
  "disclosure_copy": "Early participants may receive...",
  "terms_url": "/terms/completion-credits"
}
```

**Response (participant credits):**
```json
{
  "credits": [
    {
      "award_id": "uuid",
      "campaign_name": "Campaign X",
      "credit_amount": 50.00,
      "credit_currency": "USD",
      "issued_at": "2024-01-20T14:00:00Z",
      "status": "ISSUED"
    }
  ],
  "total_balance": 50.00
}
```

---

## Rollout Plan (Phase 1.5)

### Stage 1: Admin Infrastructure (Week 1-2)

- [ ] Database schema (rule sets, rules, awards)
- [ ] Admin API endpoints
- [ ] Basic CRUD UI (no activation yet)
- [ ] Audit event logging
- [ ] Unit tests + integration tests

### Stage 2: State Machine (Week 3)

- [ ] Lock/Activate transitions
- [ ] Immutability enforcement
- [ ] Admin checklist UI
- [ ] Exception integration hooks

### Stage 3: Award Engine (Week 4)

- [ ] Eligibility calculation logic
- [ ] Ledger integration
- [ ] Batch approval UI
- [ ] Reconciliation checks

### Stage 4: Public Disclosure (Week 5)

- [ ] Campaign page integration
- [ ] Participant credit balance view
- [ ] Notification templates
- [ ] Competitive safety review

### Stage 5: Pilot Campaign (Week 6)

- [ ] Create first rule set
- [ ] Activate on test campaign
- [ ] Monitor award issuance
- [ ] Verify ledger reconciliation
- [ ] Post-mortem

---

## Verification Steps (Pre-Production)

**Before deploying to production:**

1. **Canon Compliance Audit**
   - [ ] Language Rules verified (no retail terms)
   - [ ] Public copy reviewed by UX_TRUST_DESIGNER
   - [ ] Competitive safety confirmed (no economics leaks)

2. **Technical Validation**
   - [ ] State machine transitions tested (all paths)
   - [ ] Ledger reconciliation verified (no orphaned awards)
   - [ ] Audit events generated for all actions
   - [ ] Exception integration tested

3. **Operational Readiness**
   - [ ] Admin training completed
   - [ ] Support playbook created
   - [ ] Rollback procedure documented
   - [ ] Monitoring alerts configured

---

## Rollback Plan

**If critical issues detected post-launch:**

1. **Immediate Actions**
   - Disable award issuance (feature flag)
   - Hide public disclosure copy from campaigns
   - Notify participants of temporary unavailability

2. **Data Preservation**
   - Do NOT delete rule sets or awards
   - Mark affected campaigns with Exception flag
   - Preserve all audit logs

3. **Recovery Options**
   - Option A: Fix issue + resume awards
   - Option B: Manually issue credits via Exception workflow
   - Option C: Cancel credit program + notify participants

**Decision Authority:** Requires Canon review + operational lead approval.

---

## Final Canon Statement

The Completion Credit Engine is **operational infrastructure**, not a marketing tool.

It exists to:
- Reward early participation **without distorting commitment clarity**
- Issue credits **deterministically and transparently**
- Maintain **competitive safety** by hiding supplier economics
- Preserve **trust** through immutability and audit trails

Any use of this engine that:
- Creates price ladders
- Exposes margins
- Introduces asymmetry
- Violates Language Rules

**...is a Canon violation and MUST be blocked.**

**This document is binding for Phase 1.5.**

---
