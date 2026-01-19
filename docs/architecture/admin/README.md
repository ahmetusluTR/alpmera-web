# ADMIN ARCHITECTURE — README (PHASE 1.5)

## Document Metadata (Machine-Readable)

**Doc_Type:** Architecture_Index
**Domain:** Admin_Console
**Scope:** `docs/architecture/admin/*`
**Phase:** 1.5
**Status:** ACTIVE
**Authority_Level:** Subordinate
**Parent_Authority:** `docs/canon/*`
**Enforcement:** REQUIRED
**Applies_To:**

* Any Admin UI work
* Any Admin API work
* Any campaign operations tooling
* Any admin-related bug fixing
* Any data model changes that touch admin surfaces

**Rule:**
Any work that touches the Admin Console MUST consult this README first, then consult the relevant page spec(s), and MUST comply unless explicitly overridden by Canon.

---

## Canon Intent

This directory contains the **binding Architecture Specs** for Alpmera’s **Admin Console** in **Phase 1.5**.

These specs exist to:

* prevent architecture drift
* enforce trust-first operational clarity
* ensure escrow and financial visibility is auditable
* keep the Admin Console consistent across pages

---

## Authority & Precedence

### Precedence Order (Highest → Lowest)

1. `docs/canon/*` (Constitution, Language Rules, Doctrine, Tech Stack)
2. This directory: `docs/architecture/admin/*` (Admin Architecture Specs)
3. Implementation (code, UI components, endpoints)

**Rule:**
If any architecture spec conflicts with Canon, Canon wins.
If implementation conflicts with this architecture, the implementation MUST be changed.

---

## Required Reading Rules (for AI Assistants)

### Mandatory Read (Always)

Before proposing changes, an AI assistant MUST read:

* `docs/canon/README_CANON.md`
* `docs/canon/CONSTITUTION.md`
* `docs/canon/LANGUAGE_RULES.md`
* This file: `docs/architecture/admin/README.md`

### Conditional Read (By Work Area)

* If the work touches participant data or support flows → read `PAGE_PARTICIPANTS_PHASE_1_5.md`
* If the work touches escrow / ledger / refunds / clearing reconciliation → read `PAGE_COMMITMENTS_PHASE_1_5.md`
* If the work touches navigation / new admin pages / admin structure → read `ADMIN_IA_PHASE_1_5.md`

---

## Files in This Directory (Index)

### 1) Admin Information Architecture (IA)

**File:** `ADMIN_IA_PHASE_1_5.md`
**Role:** Defines the Phase 1.5 admin page map and what MUST exist.

### 2) Participants Page Spec

**File:** `PAGE_PARTICIPANTS_PHASE_1_5.md`
**Role:** Defines Participants as a truth surface: cross-campaign visibility, inquiry support, read-only governance.

### 3) Commitments Page Spec

**File:** `PAGE_COMMITMENTS_PHASE_1_5.md`
**Role:** Defines Commitments as the financial spine: escrow traceability, reconciliation composition, anomaly detection, read-only governance.

---

## Phase 1.5 Admin Architecture Commitments (Binding)

### Mandatory Admin Surfaces (Phase 1.5)

* Participants (CRITICAL)
* Commitments (CRITICAL)
* Exceptions (FULL IMPLEMENTATION REQUIRED)
* Audit (FULL IMPLEMENTATION REQUIRED)

### Deferred Surfaces (NOT Phase 1.5)

* Standalone Communications page (Phase 2)
* Standalone Supplier Acceptances page (Phase 2)

**Rule:**
Communications and Supplier Acceptances MAY exist as embedded logs/sections (Participant/Campaign/Audit), but MUST NOT be expanded into standalone Phase 1.5 pages.

---

## Non-Negotiable Admin Design Rules (Binding)

### Language Doctrine

Admin UI MUST use Alpmera terms:

* participant
* commitment
* campaign
* escrow

Admin UI MUST NOT use retail terms.

### Trust & Funds Visibility Discipline

* Admin must preserve auditability
* No silent transitions
* Commitment state must be traceable from lock → release/refund
* Aggregate platform economics must not be exposed unless required for operations

### Action Discipline

Admin pages are primarily:

* read-heavy
* action-light
  Execution actions (refund processing, campaign transitions) must stay inside their dedicated workflows and must be auditable.

---

## Change Governance

### When to Update These Docs

Update the relevant spec when:

* a new admin page is added
* a page purpose changes
* a new state is introduced (campaign, commitment, refund, delivery)
* reconciliation logic changes
* a new trust-critical workflow is added

### Update Rules

* Prefer incremental, low-risk changes
* Do not introduce duplicate authority with Canon
* Keep specs phase-scoped (Phase 1.5 only unless explicitly updated)

---

## Final Canon Statement

This directory is the **architecture law** for Admin Console behavior in Phase 1.5.
All admin development and bug fixing MUST comply with these specs to prevent trust drift and financial ambiguity.

**If a change creates unclear money flow, silent transitions, or retail framing, it is invalid.**
