# ADMIN ARCHITECTURE — INFORMATION ARCHITECTURE (IA)
## PHASE 1.5

---

## Document Metadata (Machine-Readable)

**Doc_Type:** Architecture_IA  
**Domain:** Admin_Console  
**Phase:** 1.5  
**Status:** ACTIVE  
**Authority_Level:** Subordinate  
**Parent_Authority:** `docs/canon/*`  
**Enforcement:** REQUIRED  

**Applies_To:**
- Admin UI
- Admin API
- Admin navigation
- Admin page creation, removal, or modification

**Rule:**  
Any Admin Console page added, removed, or materially modified  
**MUST be reflected in this document** unless explicitly overridden by Canon.

---

## Canon Intent

This document defines the **authoritative Admin Console Information Architecture**
required to safely operate Alpmera in **Phase 1.5**.

This is an **IA map**, not a behavior or logic spec.

It defines:
- What admin pages exist
- Which pages are missing
- Which pages are **trust-critical orchestration surfaces**
- How pages relate at a navigation level

It explicitly does **NOT** define:
- Business logic
- State machines
- Data models
- UI behavior
- Permissions beyond page-level authority

Those belong exclusively in:
- `PAGE_*_PHASE_1_5.md` files
- Canon Playbooks
- Canon Tasks

Failure to maintain this map creates:
- undocumented authority surfaces
- operational blind spots
- silent trust erosion

---

## ADMIN PAGE INVENTORY — PHASE 1.5 (AUTHORITATIVE)

### Legend
- **Status**
  - CURRENT = Exists in admin today
  - MISSING = Required but not yet implemented
- **Trust Orchestration**
  - YES = Trust-critical control / audit / protection surface
  - NO = Operational or reference surface

---

### ADMIN PAGES — CURRENT (EXISTING)

| Page Name              | Canonical Path                | Status  | Trust Orchestration | Primary Responsibility |
|------------------------|-------------------------------|---------|---------------------|------------------------|
| Control Room           | `/admin/control-room`         | CURRENT | NO                  | Operational overview |
| Campaigns              | `/admin/campaigns`            | CURRENT | NO                  | Campaign lifecycle control |
| Clearing               | `/admin/clearing`             | CURRENT | YES                 | Escrow aggregation visibility |
| Refunds                | `/admin/refunds`              | CURRENT | YES                 | Refund execution |
| Refund Plans           | `/admin/refund-plans`         | CURRENT | YES                 | Bulk refund coordination |
| Deliveries             | `/admin/deliveries`           | CURRENT | NO                  | Fulfillment operations |
| Consolidation Points   | `/admin/consolidation-points` | CURRENT | NO                  | Fulfillment reference |
| Products               | `/admin/products`             | CURRENT | NO                  | Product catalog |
| Suppliers              | `/admin/suppliers`            | CURRENT | NO                  | Supplier registry |
| Credits                | `/admin/credits`              | CURRENT | YES                 | Append-only credit ledger |

> These pages form the **baseline operational surface**.
> They are **necessary but insufficient** for Phase 1.5.

---

### ADMIN PAGES — REQUIRED (MISSING OR INCOMPLETE)

| Page Name      | Canonical Path          | Status  | Priority | Trust Orchestration | Spec Reference |
|---------------|-------------------------|---------|----------|---------------------|---------------|
| Participants  | `/admin/participants`  | MISSING | CRITICAL | YES                 | `PAGE_PARTICIPANTS_PHASE_1_5.md` |
| Commitments   | `/admin/commitments`   | MISSING | CRITICAL | YES                 | `PAGE_COMMITMENTS_PHASE_1_5.md` |
| Exceptions    | `/admin/exceptions`    | PARTIAL | HIGH     | YES                 | `PAGE_EXCEPTIONS_PHASE_1_5.md` |
| Audit         | `/admin/audit`         | PARTIAL | HIGH     | YES                 | `PAGE_AUDIT_PHASE_1_5.md` |

---

## TRUST ORCHESTRATION SURFACES — PHASE 1.5

The following pages are **Trust Orchestration Surfaces**.

They:
- protect user trust
- expose irreversible history
- govern money, failure, or accountability
- MUST be read-only or strictly constrained
- MUST generate audit records
- MUST NOT allow silent mutation

### Trust Orchestration Surfaces

- Participants
- Commitments
- Clearing
- Refunds / Refund Plans
- Credits
- Exceptions
- Audit

These pages collectively form the **trust spine** of the Admin Console.

Any change to these surfaces:
- requires Canon awareness
- must be traceable
- must not introduce implicit guarantees

---

## COMMUNICATION GOVERNANCE — PHASE 1.5 (EXPLICIT DECISION)

### ❌ NO Admin Message Template Editor

There is **no Admin UI** for editing participant-facing message bodies
in Phase 1.5.

### ✅ Canonical Source of Truth

All participant-facing communication templates live in **versioned files**:

```

docs/architecture/admin/communications/
└── CANONICAL_MESSAGE_TEMPLATES_PHASE_1_5.md

```

### Rationale (Binding)

- Prevents tone drift
- Preserves auditability
- Eliminates silent copy changes
- Enforces Canon language discipline
- Avoids over-engineering in Phase 1–2

Admin UI may:
- reference message type
- reference template ID
- log delivery

Admin UI must NOT:
- edit message body
- create ad-hoc wording
- override canonical templates

---

## ADMIN PAGE RELATIONSHIPS — IA VIEW (NON-BEHAVIORAL)

```

Campaigns
├── Participants
│    └── Credits (summary only)
├── Commitments
│    └── Credits (application reference)
├── Credits (global ledger)
├── Clearing
├── Refunds / Refund Plans
├── Exceptions
└── Audit

```

No Admin page operates in isolation.
Trust surfaces always cross-reference each other.

---

## Canon Alignment Matrix

| Canon Principle           | Enforcement in IA |
|---------------------------|-------------------|
| Trust-First               | Explicit trust surfaces |
| No Silent Transitions     | Audit + Credits + Exceptions |
| Escrow Protection         | Commitments + Clearing |
| Failure Strengthens Trust | Structured Exceptions |
| Operator Model            | No marketplace abstractions |
| Language Doctrine         | Canon-only terminology |

---

## Final Canon Statement

`ADMIN_IA_PHASE_1_5.md` is the **single source of truth** for:

- Admin page existence
- Admin navigation expectations
- Trust vs operational surface classification
- Phase 1.5 scope boundaries

Any Admin Console work that bypasses this map
creates **structural trust debt**.

**This document is binding for Phase 1.5.**

---
