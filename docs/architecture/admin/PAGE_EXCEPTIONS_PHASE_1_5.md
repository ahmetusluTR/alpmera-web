# PAGE_EXCEPTIONS_PHASE_1_5.md
## ADMIN CONSOLE — EXCEPTIONS PAGE SPEC (PHASE 1.5)
## REPRESENTATION DECISION INCLUDED (FIRST-CLASS RECORDS)

---

## Document Metadata (Machine-Readable)

**Doc_Type:** Page_Spec  
**Domain:** Admin_Console  
**Page:** Exceptions  
**Phase:** 1.5  
**Status:** ACTIVE  
**Authority_Level:** Subordinate  
**Parent_Document:** `docs/architecture/admin/ADMIN_IA_PHASE_1_5.md`  
**Parent_Authority:** `docs/canon/*`  
**Enforcement:** REQUIRED  

**Applies_To:**
- Admin UI (Exceptions page only)
- Admin API (exceptions-related endpoints)
- Incident handling
- Refund, delivery, escrow anomaly resolution
- Audit and trust verification

**Rule:**  
Any exception handling, display, or workflow MUST comply with this document unless explicitly overridden by Canon.

---

## Canon Intent

The Exceptions page exists to ensure that **failures strengthen trust rather than erode it**.

In Phase 1.5, Alpmera operates **multiple concurrent campaigns** with escrowed funds.
Any deviation from expected behavior MUST be **captured, structured, resolved, and auditable**.

Exceptions are not bugs and not support tickets.  
They are **trust-critical incidents**.

---

## Representation Decision (Hard Requirement)

### Decision
Exceptions MUST be represented as **first-class structured records**.

### What this means
- An exception has its own immutable identity.
- An exception has an explicit lifecycle (DETECTED → … → CLOSED).
- An exception can be assigned, worked, resolved, and verified.
- An exception links to the evidence (commitments, escrow, campaign events, admin logs).

### What this forbids
Exceptions MUST NOT be implemented as “derived events only” (computed from ledgers/logs) in Phase 1.5.

**Reason:** Derived-only approaches cannot prove procedural handling and can rewrite history when detection rules change.

---

## Canon Rules Applied

| Canon Principle           | Enforcement                                                       |
|--------------------------|-------------------------------------------------------------------|
| No Silent Transitions    | Every exception is visible, attributable, and closed explicitly   |
| Failure Strengthens Trust| Failures are handled procedurally, not ad-hoc                     |
| Escrow Protection        | Financial anomalies are surfaced and tracked to closure           |
| No Asymmetry             | Same factual record governs admin + participant truth             |
| Trust Debt Rule          | Missing exception records = structural trust debt                  |

---

## Page Purpose (Authoritative)

The Exceptions page is the **canonical incident registry** for deviations from expected Alpmera operation.

It exists to:
- detect and surface failures early
- provide a structured resolution workflow
- prevent ad-hoc handling
- preserve evidence for audit and disputes
- ensure consistent trust recovery

---

## Queryability Contract (From Existing Tables)

### Source-of-Truth Table (Mandatory)
Exceptions MUST be queryable from a first-class exception table:

- **Canonical Source Table:** `exceptions`

Every row shown on the Exceptions page MUST point to:
- `sourceTable = exceptions`
- `sourceRowId = exceptions.id`

If the system does not have an `exceptions` table, the Exceptions page is **not implementable** under Phase 1.5 trust rules.

### Evidence Link Tables (Referenced, Not Replaced)
Exceptions MUST link outward to evidence stored in existing tables, including (where applicable):
- `admin_action_logs`
- `campaign_admin_events`
- `escrow_ledger`
- `commitments`
- `campaigns`
- `supplier_acceptances`
- `credit_ledger_entries`

**Rule:** The exception record is the procedural truth; the linked tables are the evidentiary truth.

---

## Exception Definition (Normative)

An Exception is any condition where reality deviates from Alpmera’s declared process, rules, or guarantees.

An exception MUST be created when:
- funds do not move as expected
- delivery does not occur as procedurally stated
- a campaign transitions unexpectedly
- a participant disputes an outcome
- a supplier deviates from acceptance terms
- the system detects reconciliation mismatch

---

## Exception Categories (Closed Set)

Exceptions MUST belong to exactly one primary category:

| Category                 | Description                                                  |
|--------------------------|--------------------------------------------------------------|
| DELIVERY_FAILURE         | Late, partial, damaged, or missing delivery                  |
| PARTICIPANT_DISPUTE      | Refund disagreement, commitment dispute, communication claim  |
| SUPPLIER_DEVIATION       | Late response, spec mismatch, acceptance breach              |
| ESCROW_ANOMALY           | Ledger mismatch, failed refund, incorrect release            |
| CAMPAIGN_PROCESS_FAILURE | Invalid transition, deadline breach, logic error             |
| COMMUNICATION_FAILURE    | Required notification failed / not delivered                 |
| OTHER                    | Rare; requires explicit justification                        |

---

## Exception Severity (Mandatory)

| Severity | Meaning                                   |
|---------|-------------------------------------------|
| LOW     | Informational, no user impact             |
| MEDIUM  | Limited impact, no financial risk         |
| HIGH    | User impact or financial risk             |
| CRITICAL| Escrow risk, trust breach, legal exposure |

Severity influences priority and operational urgency.

---

## Exception Lifecycle (Authoritative)

All exceptions MUST follow this lifecycle. Skipping states is forbidden.

`DETECTED → TRIAGED → IN_PROGRESS → RESOLVED → CLOSED`

| State       | Meaning                               |
|------------|---------------------------------------|
| DETECTED    | Identified deviation exists           |
| TRIAGED     | Category/severity/owner set           |
| IN_PROGRESS | Resolution underway                   |
| RESOLVED    | Outcome decided; actions completed    |
| CLOSED      | Evidence verified; audit complete     |

---

## Mandatory Exception Fields (Structured, Not Free-Form)

Every exception record MUST include:

### Identity (Immutable)
- `exception_id` (immutable primary reference)
- `created_at` (immutable)

### Classification
- `category` (closed set)
- `severity` (closed set)
- `detection_source` = SYSTEM / ADMIN / PARTICIPANT

### Scope Links (At least one required)
- `campaign_id` (nullable)
- `commitment_id` (nullable)
- `participant_user_id` (nullable)
- `supplier_id` (nullable)

### Procedural State (Lifecycle)
- `status` (lifecycle state)
- `owner` (admin identity or role label)
- `last_updated_at`

### Resolution Proof (Required to close)
- `resolution_outcome` (closed set per category)
- `resolution_summary_structured` (structured fields; NO free-text essay)
- `resolved_at`
- `resolved_by`

### Evidence Pointers (Mandatory)
- `evidence_links[]` referencing source records, each containing:
  - `sourceTable`
  - `sourceRowId`
  - `relationship` (e.g., CAUSED_BY, PROVES, AFFECTS, RELATED)

**Rule:** If evidence cannot be pointed to, the exception cannot be closed.

---

## Exceptions List View (Read-Heavy)

### Required Columns
| Column         | Purpose                                        |
|----------------|------------------------------------------------|
| Exception ID   | Primary reference                              |
| Category       | Type of failure                                |
| Severity       | Trust impact                                   |
| Status         | Lifecycle state                                |
| Primary Link   | Campaign / Commitment / Participant / Supplier |
| Created At     | Detection time                                 |
| Last Updated   | Resolution activity                            |
| Owner          | Responsible admin                              |

### Filters (Minimum Required)
- Category
- Severity
- Status
- Detection source
- Campaign
- Participant
- Commitment reference (if applicable)
- Date range (created_at / updated_at)

---

## Exception Detail View (Authoritative)

### Header
- Exception ID
- Category + Severity badges
- Status badge
- Owner
- Created At / Updated At

### Section A — Scope Links (Must exist)
- Linked Campaign (if any)
- Linked Commitment (if any)
- Linked Participant (if any)
- Linked Supplier (if any)

### Section B — Evidence Pack (Mandatory)
A list of evidence pointers (read-only) that link to:
- escrow ledger entries
- admin action logs
- campaign admin events
- commitment record
- supplier acceptance record
- credit ledger entries (if relevant)

### Section C — Lifecycle Timeline (No Silent Transitions)
A timeline of status changes.
Each status change MUST be attributable and MUST also appear in Audit (see below).

### Section D — Resolution (Conditional)
Visible when status ∈ {RESOLVED, CLOSED}
- outcome
- resolved_by
- resolved_at
- structured resolution summary
- verification checklist (must be completed before CLOSE)

---

## Audit Relationship (Mandatory)

Every exception lifecycle change MUST generate an auditable record.

### Required Audit Source Tables
Lifecycle changes MUST be queryable in:
- `admin_action_logs` AND/OR `campaign_admin_events` (depending on your existing logging pattern)

**Rule:** Exceptions are procedural truth; Audit is immutable proof.
Both must exist and link to each other.

---

## Forbidden Actions (Strict)

Forbidden:
- deleting an exception
- editing past states
- closing without resolution proof
- changing severity retroactively after TRIAGED
- free-text internal notes fields
- exporting exception datasets
- messaging participants from Exceptions page

**Reason:** These create liability, competitive risk, or silent trust debt.

---

## Phase 1.5 Scope Boundaries

✔ Manual exception creation allowed  
✔ System-created exception records allowed  
❌ Automated resolution  
❌ Bulk actions  
❌ SLA dashboards / analytics  
❌ Trend reporting  

---

## Final Canon Statement

In Phase 1.5, Exceptions MUST be first-class records.

Derived-only “exceptions” are not exceptions — they are **detections**.
Detections do not prove procedural handling.

A trust-first escrow system requires a durable registry of deviations and resolutions.

**This document is binding for all Phase 1.5 admin work.**

---
**End of PAGE_EXCEPTIONS_PHASE_1_5.md**
