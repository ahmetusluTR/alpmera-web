# ADMIN PAGE SPEC — PARTICIPANTS (PHASE 1.5)
## WITH EXPLICIT ENTITY LINKAGE REQUIREMENTS (USERS ↔ PROFILES ↔ COMMITMENTS)

---

## Document Metadata (Machine-Readable)

**Doc_Type:** Architecture_Spec  
**Domain:** Admin_Console  
**Page:** Participants  
**Phase:** 1.5  
**Status:** ACTIVE  
**Authority_Level:** Subordinate  
**Parent_Authority:** `docs/canon/*`  
**Enforcement:** REQUIRED  

**Applies_To:**
- Admin UI (Participants)
- Admin API (Participants)
- Participant-related bug fixing
- Support & incident investigation workflows

**Rule:**  
Any admin change affecting participant visibility, identity, or linkage to commitments  
MUST comply with this document unless explicitly overridden by Canon.

---

## Canon Intent

The Participants page is a **visibility and support surface**, not a management interface.

Participants:
- join campaigns
- commit funds to escrow
- are not administered, edited, or manipulated by admins

Admin responsibility is limited to:
- observation
- inquiry response
- verification
- investigation

---

## PAGE PURPOSE (Normative)

The Participants page provides a **cross-campaign registry** of all individuals who have committed funds to any Alpmera campaign.

It exists to:
- answer participant inquiries
- assess cross-campaign exposure risk
- verify delivery of procedural communications (read-only evidence)
- support dispute and incident investigation

This page is **read-heavy and action-light** by design.

---

## NON-GOALS (Explicit Prohibitions)

The Participants page MUST NOT be used as:
- a CRM or marketing tool
- a participant messaging interface
- an account management system
- a source of aggregate platform metrics

---

# ENTITY LINKAGE REQUIREMENTS (NORMATIVE — MUST HOLD)

This page MUST be implemented on top of a **single canonical linkage chain**:

> **users → user_profiles → commitments → campaigns**

### Canonical Entities (Authoritative)
- **User Identity (Canonical):** `users`
- **User Display Profile (Canonical):** `user_profiles`
- **Participation & Funds Commitment (Canonical):** `commitments`
- **Campaign Context (Canonical):** `campaigns`

### Required Linkage Rules (Hard Requirements)

**LNK-1 — Participants are users**
- Every participant row MUST map to exactly one `users.id`.

**LNK-2 — Profiles are attached to users**
- `user_profiles` MUST be linkable by `user_profiles.user_id = users.id`.
- The Participants UI MUST NOT treat `user_profiles` as the identity authority.
- If a profile is missing, the participant MUST still be resolvable via `users`.

**LNK-3 — Participation is defined by commitments**
- A user is a “participant” in Phase 1.5 if and only if:
  - They have at least one `commitments` record.
- Admin MUST NOT create “participants” directly.

**LNK-4 — Commitments are attached to users and campaigns**
- Each commitment MUST be linkable by:
  - `commitments.user_id = users.id`
  - `commitments.campaign_id = campaigns.id`

**LNK-5 — Participants list must be commitment-derived**
- The Participants list MUST be computed from commitments (distinct user set),
  not from “users table scanning” or “profiles scanning”.

**LNK-6 — No orphaned visibility**
- The UI MUST handle these cases explicitly:
  - user exists + commitments exist + profile missing → participant still visible
  - profile exists + user missing → INVALID STATE (must surface as data defect)
  - commitment exists + user missing → INVALID STATE (must surface as data defect)
  - commitment exists + campaign missing → INVALID STATE (must surface as data defect)

**LNK-7 — Aggregates are participant-scoped only**
- Allowed: per-participant totals (e.g., “Total committed active”)
- Forbidden: platform totals, leaderboards, “top participants”, global metrics

---

## DATA SOURCES (READ-ONLY SURFACES)

### Required Data Inputs
- `users` (identity anchor: id, email; no admin edits)
- `user_profiles` (display fields: name, phone; optional)
- `commitments` (participation + state)
- `campaigns` (campaign state + name for context)

### Optional Supporting Inputs (Read-Only)
- Communication log source (if implemented) — displayed read-only
- Exceptions link source (if implemented) — used to justify FLAGGED

> Note: If Communication Log storage is not yet implemented, this section MAY render as “Not available yet” without breaking linkage requirements.

---

## PARTICIPANT LIST VIEW (Authoritative)

### Columns (Normative)

| Field                  | Type          | Linkage Source (Canonical) | Purpose |
|------------------------|---------------|-----------------------------|---------|
| Participant_Name       | Text          | `user_profiles.display_name` (fallback allowed) | Primary identifier for support |
| Email                  | Text          | `users.email`               | Identity verification reference |
| Phone                  | Optional Text | `user_profiles.phone`       | Secondary delivery contact |
| Active_Campaigns       | Count         | derived from `commitments` (LOCKED) | Exposure breadth & risk signal |
| Total_Committed_Active | Currency      | derived from `commitments` (LOCKED) | Participant-scoped exposure |
| Joined_At              | Date          | MIN(`commitments.created_at`) | First commitment date |
| Last_Activity          | Date          | MAX(commitment/refund/comm event time if available; else commitment updates) | Recent activity |
| Status                 | Enum          | derived rule (see Status Rules) | ACTIVE / INACTIVE / FLAGGED |

### Status Rules (Normative)
- **ACTIVE:** has ≥ 1 LOCKED commitment
- **INACTIVE:** has commitments, but 0 LOCKED commitments
- **FLAGGED:** only if linked to an active Exception (no arbitrary flagging)

### Filters (Normative)

| Filter           | Options                           | Purpose |
|------------------|-----------------------------------|---------|
| Status           | Active / Inactive / Flagged / All | Primary triage |
| Campaign         | Campaign selector                 | Campaign-scoped inquiries |
| Commitment_State | LOCKED / REFUNDED / RELEASED      | Escrow state visibility |
| Joined_Date      | Range                             | Cohort investigation |
| Last_Activity    | Range                             | Missed communication detection |
| Search           | Name / Email / Phone              | Direct support lookup |

### Sorting (Default + Allowed)
- Default: `Last_Activity DESC`
- Allowed:
  - Active_Campaigns DESC
  - Total_Committed_Active DESC
  - Joined_At ASC / DESC
  - Participant_Name A–Z

---

## PARTICIPANT DETAIL VIEW (Authoritative)

### Header (Identity Snapshot)

| Field         | Source (Canonical) | Purpose |
|--------------|---------------------|---------|
| Name         | `user_profiles.display_name` (fallback allowed) | Primary identifier |
| Email        | `users.email`        | Identity verification |
| Phone        | `user_profiles.phone` | Secondary contact |
| Status       | derived               | ACTIVE / INACTIVE / FLAGGED |
| Member_Since | MIN(commitments.created_at) | First commitment date |
| Last_Activity| derived               | Latest interaction |

---

### Section A — Campaign Participation

**Purpose:**  
Provide a single-view answer to:
> “What campaigns is this participant involved in?”

| Field              | Linkage Source | Purpose |
|-------------------|----------------|---------|
| Campaign_Name      | `campaigns.name` via `commitments.campaign_id` | Campaign identity |
| Campaign_State     | `campaigns.state` | Lifecycle context |
| Participation_Date | `commitments.created_at` | Join timestamp |
| Commitment_Amount  | `commitments.amount` | Campaign-specific exposure |
| Commitment_State   | `commitments.state` | LOCKED / REFUNDED / RELEASED |
| Fulfillment_Status | derived / optional | Delivery state (if applicable) |

**Rationale:**  
Support must see the full picture without cross-navigation.

---

### Section B — Commitments Ledger (Participant-Scoped)

**Purpose:**  
Definitive answer to:
> “Where is my money?”

| Field                | Source (Canonical) | Purpose |
|---------------------|--------------------|---------|
| Commitment_Reference | `commitments.reference` (or id) | Support & audit identifier |
| Campaign             | `campaigns.name` | Source campaign |
| Amount               | `commitments.amount` | Committed funds |
| Quantity             | `commitments.quantity` (if exists) | Units (if applicable) |
| State                | `commitments.state` | LOCKED / REFUNDED / RELEASED |
| State_Changed_At     | `commitments.updated_at` or state change timestamp | Last transition |
| Reason               | commitment/refund reason field if present | Rationale |

**Sorting:**  
State_Changed_At DESC

---

### Section C — Refund History (Read-Only Evidence)

**Purpose:**  
High-risk dispute resolution evidence.

**Visibility Rule:**  
Only show if refund data exists in the system.

| Field                | Source | Purpose |
|---------------------|--------|---------|
| Refund_Date          | refund record timestamp | Execution time |
| Campaign             | campaign link | Context |
| Commitment_Reference | link to commitment | Evidence linkage |
| Amount               | refunded amount | Proof |
| Reason               | enumerated cause | Consistency |
| Refund_Plan          | plan link (if applicable) | Bulk context |
| Processed_By         | admin attribution | Audit trail |

---

### Section D — Communication Log (Read-Only)

**Purpose:**  
Evidence of procedural communication delivery.

| Field           | Purpose |
|----------------|---------|
| Timestamp       | Send time |
| Type            | Communication category |
| Campaign        | Related campaign |
| Channel         | EMAIL / SMS |
| Subject         | Message subject |
| Delivery_Status | SENT / DELIVERED / FAILED |
| Content_Preview | Read-only snippet |

**Explicitly Forbidden:**
- composing messages
- replying
- engagement tracking
- read receipts

---

## FORBIDDEN ADMIN ACTIONS (Hard Rules)

Admins MUST NOT:
- edit participant profile data
- delete or archive participants
- create commitments
- modify commitment amounts
- cancel commitments
- process refunds
- send messages from this page
- export participant data
- view aggregate participant metrics
- flag participants without an active Exception
- add free-text notes

Violations create **trust debt and audit risk**.

---

## PAGE BEHAVIOR RULES

### Data Freshness
- Refresh on load and filter change
- Manual refresh allowed
- No real-time counters

### Empty States
- No participants → “No participants have committed yet.”
- No results → “No participants match filters.”
- No commitments → “No commitment history.”

### Navigation
- List → Detail (single click)
- Detail → Campaign / Refund Plan (if exists)
- Back preserves filters

### Access Control
- Single admin role
- All access logged to Audit

---

## CANON ALIGNMENT CHECK

| Principle              | Compliance |
|------------------------|------------|
| Trust-First            | ✓ Read-only, no manipulation |
| No Silent Transitions  | ✓ Communication evidence surface |
| Escrow Integrity       | ✓ Display-only financial data |
| Failure Handling       | ✓ Refund evidence |
| Language Doctrine      | ✓ No retail terms |
| Competitive Safety     | ✓ No platform aggregates |
| Operational Simplicity | ✓ Action-light |

---

## FINAL CANON STATEMENT

The Participants page is **not** an admin control surface.  
It is a **truth surface** built on the canonical linkage:

> **users → user_profiles → commitments → campaigns**

If this linkage cannot be proven and enforced, the page is not Phase 1.5 compliant.

This page enables:
- verifiable answers
- fast support resolution
- risk awareness
- trust preservation

Any expansion beyond this scope violates Phase 1.5 discipline and MUST NOT be implemented.

**This document is binding for Phase 1.5 admin work.**
