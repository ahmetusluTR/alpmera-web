# PAGE_AUDIT_PHASE_1_5.md
## ADMIN CONSOLE — AUDIT PAGE SPEC (PHASE 1.5)
## WITH EXPLICIT “QUERYABLE FROM EXISTING TABLES” REQUIREMENT

---

## Document Metadata (Machine-Readable)

**Doc_Type:** Page_Spec  
**Domain:** Admin_Console  
**Page:** Audit  
**Phase:** 1.5  
**Status:** ACTIVE  
**Authority_Level:** Subordinate  
**Parent_Document:** `docs/architecture/admin/ADMIN_IA_PHASE_1_5.md`  
**Parent_Authority:** `docs/canon/*`  
**Enforcement:** REQUIRED  

**Applies_To:**
- Admin UI (Audit page only)
- Admin API (audit/event endpoints)
- All admin actions
- Campaign lifecycle transitions
- Escrow, refund, and fulfillment events
- Communication outcomes (send/fail)
- Credit events (ledger)
- Supplier acceptance workflow events

**Rule:**  
Any auditable action or state transition MUST be representable in the Audit page  
by querying existing system tables (defined below) unless explicitly overridden by Canon.

---

## Canon Intent

The Audit page exists to enforce **No Silent Transitions**.

In Phase 1.5, Alpmera operates multiple concurrent campaigns in a trust-first model.
Trust must be **provable**.

The Audit page is the **immutable proof layer** of Alpmera.

---

## Canon Rules Applied

| Canon Principle           | Enforcement                                                       |
|--------------------------|-------------------------------------------------------------------|
| No Silent Transitions    | Every consequential event is queryable                             |
| Escrow Protection        | All fund movements are auditable                                   |
| No Asymmetry             | Admin, system, and participant operate on the same factual record |
| Failure Strengthens Trust| Failures are visible, not hidden                                   |
| Trust Debt Rule          | Missing auditability is structural trust debt                       |

---

## Page Purpose (Authoritative)

The Audit page is the **single read-only historical view**
of all consequential platform events.

It exists to:
- prove what happened, when, and why
- attribute every action to an actor (SYSTEM or ADMIN)
- support dispute resolution
- enable compliance verification
- provide trust assurance

---

## What This Page IS

✔ A read-only, append-only event view (composed from logs/ledgers)  
✔ A forensic investigation surface  
✔ A cross-entity timeline  
✔ A trust verification surface  

---

## What This Page IS NOT

❌ A workflow engine  
❌ A daily operations dashboard  
❌ An editable log  
❌ A reporting or analytics system  
❌ A place to summarize or interpret events  

---

# QUERYABILITY CONTRACT (HARD REQUIREMENT)

## “Queryable From Existing Tables” Definition

An audit event is **Phase 1.5 compliant** only if it can be produced by querying
the existing DB tables listed in this document.

**No event may be “imagined” or “inferred only in code” without an underlying row.**  
If the underlying row does not exist, the event is **not auditable** and the system is **non-compliant**.

---

## Canonical Source Tables (Authoritative)

The Audit page MUST be built by querying these existing tables:

| Table | Role In Audit | Notes |
|------|---------------|------|
| `admin_action_logs` | Admin actions proof | Required for “who did what” |
| `campaign_admin_events` | Campaign lifecycle / admin event stream | Campaign-related timeline |
| `escrow_ledger` | Escrow fund movements proof | LOCK / REFUND / RELEASE composition |
| `commitments` | Commitment facts + state | Creation + current state anchor |
| `campaigns` | Campaign facts + current state | Context for campaign events |
| `credit_ledger_entries` | Credits proof layer | Append-only credit events |
| `supplier_acceptances` | Supplier acceptance evidence | Requested/accepted/rejected/expired |
| `auth_codes` | Admin auth / OTP evidence (if used) | Security-relevant traces (optional to display) |
| `user_sessions` / `session` | Auth/session evidence (if needed) | Optional to display; exists for forensic use |
| `users` | Participant identity anchor | Linkable entity, not “an event table” |
| `user_profiles` | Participant display | Display-only; not authoritative |

**Note:** The Audit page MAY also link out to other pages (Participants, Commitments, Campaigns, Credits),
but the event rows must come from the tables above.

---

## “Audit View” Composition Rule (Strict)

The Audit page is a **read model** that merges multiple sources.

**Rule:**  
Every row in the Audit list MUST cite exactly one “Source Table” + “Source Row ID”.

If an event cannot point to a specific row, it MUST NOT appear.

---

# AUDIT EVENT MODEL (NORMATIVE)

## Canonical Event Envelope (UI-Level)

Every displayed audit row MUST have:

| Field | Requirement |
|------|-------------|
| `eventId` | Stable unique id (can be derived: `<sourceTable>:<sourceRowId>`) |
| `timestamp` | UTC timestamp from source row |
| `eventType` | Canonical closed set (below) |
| `entityType` | Campaign / Commitment / Participant / Supplier / Escrow / Refund / Delivery / Credit / Admin / Communication |
| `entityId` | Entity identifier (campaign_id, commitment_id, user_id, supplier_id, etc.) |
| `actorType` | SYSTEM or ADMIN (SUPPLIER permitted only if explicitly recorded) |
| `actorId` | Admin identifier when ADMIN; otherwise SYSTEM |
| `actionSummary` | Short factual summary (no marketing tone) |
| `source` | UI / API / SYSTEM (derived from row fields if present) |
| `sourceTable` | MUST be one of the tables listed above |
| `sourceRowId` | MUST be the primary key/id of the source row |
| `correlationId` | Optional but recommended; used to group related events |

If any mandatory field is missing, the event MUST NOT be rendered.

---

# CANONICAL EVENT TYPES (CLOSED SET) + TABLE MAPPING

## Mapping Rule

Every canonical `eventType` MUST map to one or more existing tables.

If a canonical event type has no table mapping, it is **not available in Phase 1.5**.

---

## 1) Campaign Events (Queryable)

| Event Type | Source Table(s) | Queryability Requirement |
|-----------|------------------|--------------------------|
| `CAMPAIGN_CREATED` | `campaigns` (or `campaign_admin_events`) | Must be tied to the campaign creation row or event row |
| `CAMPAIGN_STATE_CHANGED` | `campaign_admin_events` (preferred), `campaigns` (fallback context) | Must have an event row indicating transition |
| `CAMPAIGN_DEADLINE_REACHED` | `campaign_admin_events` | Must be recorded as an event row |

**Hard rule:** `campaigns` alone (current state) is not sufficient to prove transitions.  
Transitions MUST be proven via `campaign_admin_events`.

---

## 2) Commitment Events (Queryable)

| Event Type | Source Table(s) | Queryability Requirement |
|-----------|------------------|--------------------------|
| `COMMITMENT_CREATED` | `commitments` | Must be represented by the commitment creation row |
| `COMMITMENT_STATE_CHANGED` | `campaign_admin_events` (preferred) or `admin_action_logs` (if state changes are admin-driven) | Must have a state-change event row (commitments alone is insufficient for history) |

**Hard rule:** If commitment state history is not recorded anywhere, it is non-auditable.  
The Audit page MUST NOT fabricate state history from “updated_at”.

---

## 3) Escrow Events (Queryable)

| Event Type | Source Table(s) | Queryability Requirement |
|-----------|------------------|--------------------------|
| `ESCROW_LOCK` | `escrow_ledger` | Must be a ledger entry row |
| `ESCROW_REFUND` | `escrow_ledger` | Must be a ledger entry row |
| `ESCROW_RELEASE` | `escrow_ledger` | Must be a ledger entry row |

**Invariant:** Every escrow ledger row MUST be linkable to a commitment and campaign when applicable.

---

## 4) Refund Events (Queryable via existing evidence)

Phase 1.5 uses existing surfaces:
- Refund execution actions should already log admin actions and escrow movements.

| Event Type | Source Table(s) | Queryability Requirement |
|-----------|------------------|--------------------------|
| `REFUND_INITIATED` | `admin_action_logs` or `campaign_admin_events` | Must exist as an admin/event row |
| `REFUND_PROCESSED` | `escrow_ledger` | Must exist as escrow REFUND entry |
| `REFUND_FAILED` | `admin_action_logs` or `campaign_admin_events` | Must be recorded explicitly |

**Note:** If there is a dedicated refunds table in the future, it can become authoritative,
but Phase 1.5 MUST rely on existing tables only.

---

## 5) Fulfillment / Delivery Events (Queryable constraint)

If fulfillment events are not yet recorded in a dedicated event table, they MUST be represented
through existing admin event logging.

| Event Type | Source Table(s) | Queryability Requirement |
|-----------|------------------|--------------------------|
| `FULFILLMENT_STARTED` | `campaign_admin_events` | Must exist as event row |
| `FULFILLMENT_UPDATED` | `campaign_admin_events` | Must exist as event row |
| `FULFILLMENT_COMPLETED` | `campaign_admin_events` | Must exist as event row |
| `FULFILLMENT_DELAYED` | `campaign_admin_events` | Must exist as event row |

**Hard rule:** If a fulfillment status exists only in a delivery table but no event exists,
Audit must display the delivery record as a “state snapshot” only if that table exists.
Otherwise, it cannot claim a “timeline event”.

---

## 6) Supplier Events (Queryable)

| Event Type | Source Table(s) | Queryability Requirement |
|-----------|------------------|--------------------------|
| `SUPPLIER_ACCEPTANCE_REQUESTED` | `supplier_acceptances` | Must be represented by a row (requested/pending) |
| `SUPPLIER_ACCEPTED` | `supplier_acceptances` | Must be represented by status/state in row |
| `SUPPLIER_REJECTED` | `supplier_acceptances` | Must be represented by status/state in row |

---

## 7) Credit Events (Queryable)

| Event Type | Source Table(s) | Queryability Requirement |
|-----------|------------------|--------------------------|
| `CREDIT_ISSUED` | `credit_ledger_entries` | Must exist as a ledger entry row |
| `CREDIT_REVERSED` | `credit_ledger_entries` | Must exist as a ledger entry row |
| `CREDIT_APPLIED` | `credit_ledger_entries` | Must exist as a ledger entry row |

**Note:** Credit event type names must match the ledger’s stored taxonomy.

---

## 8) Admin Events (Queryable)

| Event Type | Source Table(s) | Queryability Requirement |
|-----------|------------------|--------------------------|
| `ADMIN_ACTION_EXECUTED` | `admin_action_logs` | Must exist as an action log row |
| `ADMIN_OVERRIDE_ATTEMPTED` | `admin_action_logs` | Must exist as an action log row |

---

## 9) Communication Events (Queryable)

Phase 1.5 communication governance uses a **versioned file** for message bodies,
but send/fail outcomes must still be auditable.

| Event Type | Source Table(s) | Queryability Requirement |
|-----------|------------------|--------------------------|
| `COMMUNICATION_SENT` | `campaign_admin_events` or `admin_action_logs` | Must exist as a logged event/action row |
| `COMMUNICATION_FAILED` | `campaign_admin_events` or `admin_action_logs` | Must exist as a logged event/action row |

**Rule:** The Audit page proves *that a communication was attempted and its outcome*, not template editing.

---

# AUDIT PAGE — LIST VIEW (READ-ONLY)

## Required Columns (UI)

| Column | Purpose |
|--------|---------|
| Timestamp | When the event occurred |
| Event Type | Nature of the event |
| Entity Type | What was affected |
| Entity ID | Reference |
| Actor | Who performed the action |
| Action | Factual summary |
| Source Table | Proof origin |
| Source Row ID | Proof pointer |
| Correlation ID | Event grouping |

---

## Filtering & Navigation (Read-Only)

Allowed filters:
- Event Type
- Entity Type
- Entity ID
- Actor
- Date range
- Source table

Navigation links:
- Campaign detail
- Commitment detail
- Participant detail
- Credits ledger (filtered)
- Supplier acceptance record (if applicable)
- Escrow ledger (filtered)

---

# IMMUTABILITY RULES (STRICT)

| Rule | Enforcement |
|------|-------------|
| Append-only | No edits or deletes in source ledgers/logs |
| Immutable timestamps | Source-of-truth timestamps only |
| Actor attribution required | No anonymous admin events |
| Reason required for admin actions | Must be present in `admin_action_logs` / event payload |
| Proof pointer required | Must include Source Table + Source Row ID |

Any system that allows modification of audit evidence is non-compliant.

---

# PHASE 1.5 BOUNDARIES

✔ Forensic investigation  
✔ Dispute support  
✔ Compliance verification  

❌ Editing  
❌ Commenting  
❌ Exporting  
❌ Aggregated metrics dashboards  

---

# FINAL CANON STATEMENT

The Audit page is the truth layer of Alpmera.

In Phase 1.5, an event is “auditable” only if it is **queryable from existing tables**
and each rendered row points to a concrete source record.

If an action is not auditable, it did not happen (for trust purposes).  
If a transition is not logged, it violates Canon.

**This document is binding for all Phase 1.5 admin work.**

---
