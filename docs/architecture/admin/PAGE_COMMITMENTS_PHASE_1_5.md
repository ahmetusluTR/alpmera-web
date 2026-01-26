# ADMIN PAGE SPEC — COMMITMENTS (PHASE 1.5)
## WITH EXPLICIT LINKAGE REQUIREMENTS (COMMITMENTS ↔ CAMPAIGNS ↔ ESCROW_LEDGER ↔ PARTICIPANT)

---

## Document Metadata (Machine-Readable)

**Doc_Type:** Architecture_Spec  
**Domain:** Admin_Console  
**Page:** Commitments  
**Phase:** 1.5  
**Status:** ACTIVE  
**Authority_Level:** Subordinate  
**Parent_Authority:** `docs/canon/*`  
**Enforcement:** REQUIRED  

**Applies_To:**
- Admin UI (Commitments)
- Admin API (Commitments)
- Clearing / Refund / Delivery reconciliation logic
- Commitment-related bug fixing
- Financial audit and dispute workflows

**Rule:**  
Any admin change affecting commitments, escrow linkage, or participant linkage  
MUST comply with this document unless explicitly overridden by Canon.

---

## Canon Intent

The Commitments page is the **canonical ledger** of all participant-to-campaign financial relationships.

Each commitment represents:
- a participant’s binding intent to join a campaign
- funds locked in escrow pending campaign outcome
- a traceable record from **LOCK → resolution** (RELEASE or REFUND)

This page exists to answer the core trust question:

> **Where is the money, and what state is it in?**

---

## PAGE PURPOSE (Normative)

The Commitments page MUST provide:
- **Escrow reconciliation** against Clearing positions (composition, not just totals)
- **Financial traceability** for all commitment-linked fund movements
- **Cross-campaign visibility** of commitment states
- **Fast support resolution** via commitment reference lookup
- **Audit readiness** via immutable records and attributable state history

---

## NON-GOALS (Explicit Prohibitions)

The Commitments page MUST NOT be used as:
- a payment processing interface
- a commitment creation tool (commitments are participant-initiated)
- a refund execution interface (Refunds / Refund Plans handle execution)
- an aggregate revenue / GMV dashboard

---

# LINKAGE REQUIREMENTS (NORMATIVE — MUST HOLD)

This page MUST be built on a provable linkage chain:

> **commitments → campaigns → escrow_ledger**  
> **commitments → participant (users/user_profiles)**

### Canonical Entities (Authoritative)
- **Commitment Record (Canonical):** `commitments`
- **Campaign Context (Canonical):** `campaigns`
- **Escrow Movement Ledger (Canonical):** `escrow_ledger`
- **Participant Identity (Canonical):** `users` (and `user_profiles` for display)

### Required Linkage Rules (Hard Requirements)

**LNK-C1 — Every commitment must link to exactly one campaign**
- `commitments.campaign_id` MUST resolve to `campaigns.id`.
- If a commitment’s campaign cannot be resolved: **INVALID STATE** → surface as system defect.

**LNK-C2 — Every commitment must link to exactly one participant**
- `commitments.user_id` MUST resolve to `users.id`.
- `user_profiles` MUST be linkable by `user_profiles.user_id = users.id` (display-only).
- If a commitment’s participant cannot be resolved: **INVALID STATE** → surface as system defect.

**LNK-C3 — Escrow ledger composition must be commitment-addressable**
- For each commitment, there MUST exist escrow ledger entries that can be filtered to that commitment
  using a stable linking key (e.g., `commitment_id` and/or `commitment_reference`).
- If escrow entries exist but cannot be linked to the commitment: **SYSTEM DEFECT**.

**LNK-C4 — Each commitment state MUST be explainable by escrow_ledger**
A commitment’s financial state MUST be derivable from escrow_ledger movement history:
- **LOCKED** implies a net positive escrow position for that commitment (funds held)
- **REFUNDED** implies a refund movement that nets escrow position to zero
- **RELEASED** implies a release movement that nets escrow position to zero

If the UI shows a state that the escrow ledger cannot justify, that is **trust debt** and a **system defect**.

**LNK-C5 — No orphaned “reference numbers”**
- The displayed `Commitment_Reference` MUST uniquely map to one commitment record.
- The same reference MUST be usable to locate linked escrow ledger entries.
- If reference cannot reach escrow composition: **support failure risk**.

**LNK-C6 — Commitments list is the composition view**
- This page is the canonical way to answer:
  - “Which commitments compose the ‘In Escrow’ position?”
- It MUST NOT rely on campaign pages as the composition substitute.

**LNK-C7 — Competitive safety constraint**
- Linkage must enable traceability and reconciliation,
  but MUST NOT reveal unit economics, margin, supplier tiers, or pricing ladders.

---

## DATA SOURCES (READ-ONLY SURFACES)

### Required Data Inputs
- `commitments` (identity, amounts, state)
- `campaigns` (campaign state + name)
- `users` (participant identity anchor)
- `user_profiles` (participant display fields; optional)
- `escrow_ledger` (financial movement trace)

### Optional Supporting Inputs (Read-Only)
- Deliveries source (for fulfillment status display)
- Refunds / refund plans source (for refund record display)
- Communication log source (commitment-scoped evidence surface)
- Audit source (state transition attribution)

> If optional sources are not yet implemented, the UI MAY display “Not available yet” sections,
> but MUST NOT break the core linkage requirements above.

---

## COMMITMENTS LIST VIEW (Authoritative)

### Columns (Normative)

| Field                | Type        | Linkage Source (Canonical) | Purpose |
|---------------------|-------------|----------------------------|---------|
| Commitment_Reference | Unique Text | `commitments.reference` (or stable id) | Primary support & audit identifier |
| Participant          | Linked Text | `commitments.user_id → users → user_profiles` | Identity context; links to Participants |
| Campaign             | Linked Text | `commitments.campaign_id → campaigns` | Lifecycle context; links to Campaigns |
| Amount               | Currency    | `commitments.amount` | Committed funds |
| Quantity             | Number      | `commitments.quantity` (if exists) | Units (if applicable) |
| Commitment_State     | Enum        | commitment state (must be ledger-justified) | LOCKED / REFUNDED / RELEASED |
| Campaign_State       | Enum        | `campaigns.state` | Context + mismatch detection |
| Committed_At         | Timestamp   | `commitments.created_at` | When escrow lock occurred |
| State_Changed_At     | Timestamp   | `commitments.updated_at` or state change timestamp | Last transition |
| Fulfillment_Status   | Enum        | derived/optional | PENDING / IN_PROGRESS / COMPLETED / DELAYED / N/A |

### Filters (Normative)

| Filter                   | Options                                                 | Purpose |
|--------------------------|---------------------------------------------------------|---------|
| Commitment_State         | LOCKED / REFUNDED / RELEASED / All                      | Primary financial triage |
| Campaign                 | Campaign selector                                       | Campaign reconciliation |
| Campaign_State           | AGGREGATION / SUCCESS / FAILED / FULFILLMENT / RELEASED | Detect mismatches |
| Participant              | Search/select                                           | Support lookup |
| Amount_Range             | Min/Max                                                 | High-value risk monitoring |
| Committed_Date_Range     | Range                                                   | Aging commitments |
| State_Changed_Date_Range | Range                                                   | Recent activity verification |
| Fulfillment_Status       | PENDING / IN_PROGRESS / COMPLETED / DELAYED / N/A       | Delivery-linked risk |
| Commitment_Reference     | Text search                                             | Direct support lookup |

### Default Views (Saved Presets)

| View_Name           | Filter_Set                            | Purpose |
|--------------------|----------------------------------------|---------|
| Active_Escrow       | Commitment_State = LOCKED              | Primary reconciliation composition |
| Pending_Fulfillment | LOCKED + Campaign_State = FULFILLMENT  | Delivery priority queue |
| Awaiting_Refund     | LOCKED + Campaign_State = FAILED       | Refund backlog detection |
| Recently_Refunded   | REFUNDED + State_Changed last 7d       | Verification & support |
| Recently_Released   | RELEASED + State_Changed last 7d       | Release verification |
| Overdue_Delivery    | LOCKED + Fulfillment_Status = DELAYED  | Exception candidates |
| High_Value          | LOCKED + Amount > threshold            | Risk monitoring |

### Sorting (Default + Allowed)
- Default: `Committed_At DESC`
- Allowed:
  - State_Changed_At DESC
  - Amount DESC
  - Campaign grouping
  - Participant A–Z

---

## COMMITMENT DETAIL VIEW (Authoritative)

### Header (Identity Snapshot)

| Field                | Purpose |
|---------------------|---------|
| Commitment_Reference | Primary identifier |
| Commitment_State     | LOCKED / REFUNDED / RELEASED |
| Amount               | Committed funds |
| Quantity             | Units committed |

---

### Section A — Commitment Core (Immutable)

**Purpose:** Establish commitment identity and creation facts.

**Fields (Immutable):**
- Commitment_Reference
- Participant (name/email link)
- Campaign (link)
- Amount
- Quantity
- Committed_At
- Commitment_Source: WEB / MOBILE / ADMIN_IMPORT

**Rule:**  
These fields MUST NOT be modified after creation.  
Any correction requires **refund + new commitment** through proper channels.

---

### Section B — State & Lifecycle (Attributable, Explainable)

**Purpose:** Prove all state transitions were explicit and attributable.

**Fields:**
- Current_State
- State_History timeline (timestamp, actor, reason)
- Campaign_State (current)
- Campaign_State_At_Commitment (expected AGGREGATION)

**Rule:**  
All transitions MUST be logged. No Silent Transitions.

---

### Section C — Campaign Context (Read-Only Context)

**Purpose:** Provide lifecycle context without forcing navigation.

**Fields:**
- Campaign_Name + link
- Campaign_State
- Product (name/SKU)
- Supplier + link
- Target (campaign goal)
- Progress (committed vs target %)
- Aggregation_Deadline

**Competitive Safety Rule:**  
Avoid surfaces that enable reverse-engineering of Alpmera economics beyond operational necessity.

---

### Section D — Escrow Ledger Entries (Commitment-Scoped) — REQUIRED LINKAGE

**Purpose:** Financial audit trail for every escrow movement linked to this commitment.

**Hard Requirement:**  
This section MUST demonstrate that **escrow_ledger entries are linkable to this commitment**.

**Ledger Entry Fields:**
- Timestamp
- Entry_Type: LOCK / REFUND / RELEASE
- Amount (movement)
- Balance_After (commitment-scoped escrow balance, if stored; otherwise derived)
- Actor (SYSTEM or Admin)
- Reason
- Ledger_ID (unique entry id)

**Ledger-to-Commitment Linkage Proof (Normative):**
- Each displayed escrow_ledger row MUST show (implicitly or explicitly) that it is tied to this commitment
  via `commitment_id` or `commitment_reference`.
- If escrow entries cannot be filtered reliably by this commitment, the page is not Phase 1.5 compliant.

**Invariant (Money Truth):**
- The commitment’s displayed state MUST be consistent with ledger composition:
  - LOCKED → net escrow position > 0
  - REFUNDED → net escrow position = 0 with refund movement present
  - RELEASED → net escrow position = 0 with release movement present

Discrepancies indicate a system defect.

---

### Section E — Participant Identity (Linkage Confirmation) — REQUIRED

**Purpose:** Confirm the participant linkage used by support.

**Fields (Read-Only):**
- Participant display name (profile if available)
- Participant email (users)
- Participant ID (users.id)
- Link to Participants detail

**Rule:**  
Participant display data MUST NEVER override identity authority (users is authoritative).

---

### Section F — Fulfillment Status (Conditional)

**Visibility Rule:**  
Show only when Campaign_State ∈ {SUCCESS, FULFILLMENT, RELEASED}

**Fields:**
- Fulfillment_Status: PENDING / IN_PROGRESS / COMPLETED / DELAYED / N/A
- Delivery_Strategy: SUPPLIER_DIRECT / BULK_TO_CONSOLIDATION
- Delivery_Address or Consolidation_Point (as applicable)
- Estimated_Delivery
- Actual_Delivery
- Tracking_Reference (if applicable)
- Delivery_Notes (structured only)

---

### Section G — Refund Record (Conditional)

**Visibility Rule:**  
Show only when Commitment_State = REFUNDED

**Fields:**
- Refund_Status: PROCESSED / PENDING / FAILED
- Refund_Amount (expected = commitment amount)
- Refund_Reason (enumerated)
- Refund_Plan link (if applicable)
- Processed_At
- Processed_By
- Payment_Reference (processor transaction id)

---

### Section H — Communication Log (Read-Only, Commitment-Scoped)

**Purpose:** Evidence of what was communicated about this commitment.

**Fields:**
- Timestamp
- Type (COMMITMENT_CONFIRMED, CAMPAIGN_STATE_CHANGE, FULFILLMENT_UPDATE, REFUND_PROCESSED, DELIVERY_SCHEDULED, MANUAL_NOTICE)
- Subject
- Channel (EMAIL/SMS)
- Delivery_Status

**Rule:**  
Log only. No composing, reply, engagement tracking.

---

### Section I — Linked Records (Navigation)

Must include links to:
- Participant detail
- Campaign detail
- Clearing filtered view (composition for this commitment if supported)
- Audit filtered view
- Refund Plan (if applicable)
- Delivery (if applicable)

---

## RELATIONSHIPS TO OTHER ADMIN PAGES (Authoritative)

### Clearing (Composition + Reconciliation)
**Invariant (Reconciliation):**
- Commitments MUST provide composition for Clearing positions.
- Aggregate totals without composition are insufficient.

### Deliveries
Deliveries manage logistics execution. Commitments track financial disposition.  
A delivery can be completed while commitment remains LOCKED (funds not released).

### Refunds / Refund Plans
Refunds are executed elsewhere; Commitments display the record and state linkage.  
Refund processing MUST transition commitment state to REFUNDED.

### Audit
Every commitment creation and state transition MUST generate audit events.

### Participants
Participants view answers “what has this person committed to?”  
Commitments view answers “what is the state of this commitment + escrow composition?”

### Campaigns
Campaign progress is derived from sum of LOCKED commitments (campaign-scoped).  
Commitments remain the canonical cross-campaign truth layer.

---

## PHASE 1.5 CRITICALITY (Normative)

If Alpmera cannot show:
- which commitments compose escrow positions
- and which escrow ledger entries justify each commitment state

then the trust-first claim is operationally indefensible.

---

## FORBIDDEN ADMIN ACTIONS (Hard Rules)

Admins MUST NOT:
- create commitments
- edit commitment amount
- delete commitments
- manually override commitment state
- reassign commitments to different participant or campaign
- process refunds from this page
- release funds from this page
- export commitment data

Violations create trust debt and audit contamination.

---

## FINAL CANON STATEMENT

The Commitments page is **infrastructure**, not an enhancement.

It is Phase 1.5 compliant only if the linkage chain is provable:

> **commitments ↔ campaigns ↔ escrow_ledger ↔ participant (users/user_profiles)**

It provides:
- cross-campaign visibility
- reconciliation composition
- audit proof
- dispute resolution speed
- anomaly detection

Without it, Phase 1.5 multi-campaign operation becomes operationally unsafe.

**This document is binding for Phase 1.5 admin work.**
---
