Below is a **clean, LLM-law rewrite of `TASK_REGISTRY.md`** that:

* Removes ambiguity and repetition
* Tightens authority and enforcement language
* Makes task intent obvious to AI agents
* Aligns with your **Phase 1–2 operator model**
* Preserves everything that matters (nothing is lost)

You can **replace the existing file entirely** with this version.

---

# TASK_REGISTRY.md — EXECUTABLE TASK GOVERNANCE

**Phase 1–2 (Operator Model)**

---

## 0. DOCUMENT METADATA (LLM-READABLE)

**Canon_Layer:** Task Governance
**Status:** ACTIVE (Ratification Required)
**Authority:** Subordinate to Constitution, Trust Model, Role Authority Matrix
**Scope:** All executable work affecting Alpmera behavior
**Mutation_Policy:** Canon change required for task additions/removals

---

## 1. PURPOSE (WHY THIS EXISTS)

This registry defines **what work is allowed to be executed**, **by whom**, and **under which trust constraints**.

It exists to ensure:

* No work bypasses Canon
* No task is executed without role authority
* No trust-critical activity is performed implicitly
* AI agents cannot invent or self-assign work

If a task is not defined here, it is **not executable** without Canon escalation.

---

## 2. TASK INVENTORY (AUTHORITATIVE)

Each task represents a **unit of executable authority**.

| Task ID | Task Code                 | Primary Role                          | Status     |
| ------- | ------------------------- | ------------------------------------- | ---------- |
| TSK-001 | configure_test_harness    | SYSTEM_ARCHITECT                      | EXECUTABLE |
| TSK-002 | evaluate_supplier         | MARKETPLACE_GATEKEEPER                | EXECUTABLE |
| TSK-003 | implement_backend_tests   | IMPLEMENTER                           | EXECUTABLE |
| TSK-004 | postmortem_campaign       | MARKETPLACE_GATEKEEPER / FOUNDER_MODE | EXECUTABLE |
| TSK-005 | red_team_campaign         | RISK_ABUSE_ANALYST                    | EXECUTABLE |
| TSK-006 | setup_test_suites         | QA_LEAD                               | EXECUTABLE |
| TSK-007 | stress_test_ui_copy       | UX_TRUST_DESIGNER                     | EXECUTABLE |
| TSK-008 | validate_escrow_mechanics | ESCROW_FINANCIAL_AUDITOR              | EXECUTABLE |
| TSK-009 | assess_operability        | OPS_FULFILLMENT_ARCHITECT             | EXECUTABLE |
| TSK-010 | resolve_dispute           | FOUNDER_MODE                          | EXECUTABLE |
| TSK-011 | communicate_status_change | UX_TRUST_DESIGNER                     | EXECUTABLE |

---

## 3. TASK → ROLE AUTHORITY MATRIX

Defines **who owns execution**, **who must provide input**, and **who consumes outputs**.

| Task                      | Executor                  | Mandatory Inputs      | Approval Required | Output Consumer |
| ------------------------- | ------------------------- | --------------------- | ----------------- | --------------- |
| configure_test_harness    | SYSTEM_ARCHITECT          | —                     | QA_LEAD           | IMPLEMENTER     |
| evaluate_supplier         | MARKETPLACE_GATEKEEPER    | RISK, OPS, ESCROW     | —                 | —               |
| implement_backend_tests   | IMPLEMENTER               | —                     | QA_LEAD           | —               |
| postmortem_campaign       | GATEKEEPER / FOUNDER      | OPS, ESCROW, UX, RISK | —                 | All roles       |
| red_team_campaign         | RISK_ABUSE_ANALYST        | ESCROW, OPS           | —                 | GATEKEEPER      |
| setup_test_suites         | QA_LEAD                   | SYSTEM_ARCHITECT      | —                 | IMPLEMENTER     |
| stress_test_ui_copy       | UX_TRUST_DESIGNER         | OPS, ESCROW           | —                 | IMPLEMENTER     |
| validate_escrow_mechanics | ESCROW_FINANCIAL_AUDITOR  | RISK                  | —                 | GATEKEEPER      |
| assess_operability        | OPS_FULFILLMENT_ARCHITECT | RISK                  | —                 | GATEKEEPER      |
| resolve_dispute           | FOUNDER_MODE              | ESCROW, OPS, RISK, UX | —                 | —               |
| communicate_status_change | UX_TRUST_DESIGNER         | OPS, ESCROW           | —                 | —               |

---

## 4. TASK → PLAYBOOK DEPENDENCIES

Tasks **must not execute in isolation**.
Playbooks define the lawful process envelope.

| Task                      | MUST Invoke                           | MUST Consult                          | Feeds Into          |
| ------------------------- | ------------------------------------- | ------------------------------------- | ------------------- |
| configure_test_harness    | —                                     | REFUND_RELEASE, FAILURE_HANDLING      | —                   |
| evaluate_supplier         | CAMPAIGN_ACCEPTANCE, PRECEDENT_REVIEW | SUPPLIER_ONBOARDING                   | —                   |
| implement_backend_tests   | —                                     | REFUND_RELEASE, FAILURE_HANDLING      | —                   |
| postmortem_campaign       | PRECEDENT_REVIEW                      | FAILURE_HANDLING, DELAY_COMMUNICATION | —                   |
| red_team_campaign         | —                                     | PRECEDENT_REVIEW, REFUND_RELEASE      | CAMPAIGN_ACCEPTANCE |
| setup_test_suites         | —                                     | CAMPAIGN_ACCEPTANCE, FAILURE_HANDLING | —                   |
| stress_test_ui_copy       | —                                     | DELAY_COMMUNICATION, FAILURE_HANDLING | —                   |
| validate_escrow_mechanics | REFUND_RELEASE                        | FAILURE_HANDLING                      | CAMPAIGN_ACCEPTANCE |
| assess_operability        | —                                     | FAILURE_HANDLING, DELAY_COMMUNICATION | CAMPAIGN_ACCEPTANCE |
| resolve_dispute           | FAILURE_HANDLING, REFUND_RELEASE      | DELAY_COMMUNICATION                   | —                   |
| communicate_status_change | —                                     | DELAY_COMMUNICATION, REFUND_RELEASE   | —                   |

---

## 5. TASK → TRUST MODEL ENFORCEMENT

Every task enforces **all five trust principles**.
Violation in any dimension invalidates execution.

### 5.1 No Silent Transitions

Each task MUST produce traceable state changes.

* Fund movement → logged
* Decision → documented
* Communication → recorded

### 5.2 No Implicit Guarantees

Tasks must not:

* imply outcomes
* promise timelines
* suggest certainty beyond rules

### 5.3 No Asymmetry

Tasks must ensure:

* user-visible truth == system truth
* internal failures are acknowledged
* no privileged knowledge leaks

### 5.4 No Optimism Bias

Tasks must:

* model failure paths
* assume worst-case scenarios
* document uncertainty explicitly

### 5.5 Trust Debt Rule

Any task that:

* reduces clarity
* increases ambiguity
* hides operational risk

**creates trust debt and must be rejected or escalated.**

---

## 6. CANONICAL TASK SEQUENCES

### Campaign Evaluation (Pre-Acceptance)

```
1. red_team_campaign
2. validate_escrow_mechanics
3. assess_operability
4. evaluate_supplier
```

### Test Infrastructure

```
1. configure_test_harness
2. setup_test_suites
3. implement_backend_tests
```

### UX & Communication Validation

```
1. stress_test_ui_copy
2. (approval or revision)
3. communicate_status_change
```

### Post-Campaign Handling

```
1. postmortem_campaign
2. (if dispute) resolve_dispute
3. corrective tasks assigned
```

---

## 7. COVERAGE ANALYSIS (SANITY CHECK)

### By Role

Each role has:

* at least one executable task
* defined authority boundaries
* no orphan responsibilities

### By Playbook

All critical playbooks are:

* invoked by at least one task
* consulted where risk exists

No unused playbooks exist.

---

## 8. IDENTIFIED GAPS (NON-EXECUTABLE)

The following are **NOT executable** yet and require Canon approval:

| Gap                    | Proposed Task            | Proposed Owner         |
| ---------------------- | ------------------------ | ---------------------- |
| Supplier notification  | notify_supplier_decision | MARKETPLACE_GATEKEEPER |
| Campaign creation      | create_campaign          | MARKETPLACE_GATEKEEPER |
| Participant onboarding | onboard_participant      | UX_TRUST_DESIGNER      |

---

## 9. EXECUTION RULE (FINAL)

> **If a task is not in this registry, it may not be executed.**
>
> **If a task conflicts with Canon, it must be refused.**
>
> **If a task creates trust debt, it must be escalated.**

---

**End of TASK_REGISTRY.md — Phase 1–2 Operator-Aligned Edition**
