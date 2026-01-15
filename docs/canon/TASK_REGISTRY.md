# Alpmera Task Registry

**Canon Layer:** Task Governance  
**Status:** Proposed for Ratification  
**Parent Documents:** Constitution, Trust Model, Role Authority Matrix

---

## Purpose

This registry provides a comprehensive mapping of all executable tasks to their governance requirements: roles, playbooks, and Trust Model principles.

---

## Task Inventory

| Task ID | Task Name | Primary Role | Status |
|---------|-----------|--------------|--------|
| TSK-001 | configure_test_harness | SYSTEM_ARCHITECT | Executable |
| TSK-002 | evaluate_supplier | MARKETPLACE_GATEKEEPER | Executable |
| TSK-003 | implement_backend_tests | IMPLEMENTER | Executable |
| TSK-004 | postmortem_campaign | MARKETPLACE_GATEKEEPER / FOUNDER_MODE | Executable |
| TSK-005 | red_team_campaign | RISK_ABUSE_ANALYST | Executable |
| TSK-006 | setup_test_suites | QA_LEAD | Executable |
| TSK-007 | stress_test_ui_copy | UX_TRUST_DESIGNER | Executable |
| TSK-008 | validate_escrow_mechanics | ESCROW_FINANCIAL_AUDITOR | Executable |
| TSK-009 | assess_operability | OPS_FULFILLMENT_ARCHITECT | Executable |
| TSK-010 | resolve_dispute | FOUNDER_MODE | Executable |
| TSK-011 | communicate_status_change | UX_TRUST_DESIGNER | Executable |

---

## Task-to-Role Matrix

| Task | Primary | Required Input | Approval | Consumer |
|------|---------|----------------|----------|----------|
| configure_test_harness | SYSTEM_ARCHITECT | — | QA_LEAD | IMPLEMENTER |
| evaluate_supplier | MARKETPLACE_GATEKEEPER | RISK_ABUSE_ANALYST, OPS_FULFILLMENT_ARCHITECT, ESCROW_FINANCIAL_AUDITOR | — | — |
| implement_backend_tests | IMPLEMENTER | — | QA_LEAD | — |
| postmortem_campaign | MARKETPLACE_GATEKEEPER / FOUNDER_MODE | OPS, ESCROW, UX, RISK | — | All roles |
| red_team_campaign | RISK_ABUSE_ANALYST | ESCROW, OPS | — | MARKETPLACE_GATEKEEPER |
| setup_test_suites | QA_LEAD | SYSTEM_ARCHITECT | — | IMPLEMENTER |
| stress_test_ui_copy | UX_TRUST_DESIGNER | OPS, ESCROW | — | IMPLEMENTER |
| validate_escrow_mechanics | ESCROW_FINANCIAL_AUDITOR | RISK_ABUSE_ANALYST | — | MARKETPLACE_GATEKEEPER |
| assess_operability | OPS_FULFILLMENT_ARCHITECT | RISK_ABUSE_ANALYST | — | MARKETPLACE_GATEKEEPER |
| resolve_dispute | FOUNDER_MODE | ESCROW, OPS, RISK, UX | — | — |
| communicate_status_change | UX_TRUST_DESIGNER | OPS, ESCROW | — | — |

---

## Task-to-Playbook Matrix

| Task | Must Invoke | Must Consult | Feeds Into |
|------|-------------|--------------|------------|
| configure_test_harness | — | REFUND_RELEASE, FAILURE_HANDLING | — |
| evaluate_supplier | CAMPAIGN_ACCEPTANCE, PRECEDENT_REVIEW | SUPPLIER_ONBOARDING, FAILURE_HANDLING | — |
| implement_backend_tests | — | REFUND_RELEASE, FAILURE_HANDLING | — |
| postmortem_campaign | PRECEDENT_REVIEW | FAILURE_HANDLING, DELAY_COMMUNICATION, REFUND_RELEASE | — |
| red_team_campaign | — | PRECEDENT_REVIEW, SUPPLIER_ONBOARDING, REFUND_RELEASE | CAMPAIGN_ACCEPTANCE |
| setup_test_suites | — | REFUND_RELEASE, FAILURE_HANDLING, CAMPAIGN_ACCEPTANCE | — |
| stress_test_ui_copy | — | DELAY_COMMUNICATION, FAILURE_HANDLING | — |
| validate_escrow_mechanics | REFUND_RELEASE | FAILURE_HANDLING | CAMPAIGN_ACCEPTANCE |
| assess_operability | — | DELAY_COMMUNICATION, FAILURE_HANDLING | CAMPAIGN_ACCEPTANCE |
| resolve_dispute | FAILURE_HANDLING, REFUND_RELEASE | DELAY_COMMUNICATION | — |
| communicate_status_change | — | DELAY_COMMUNICATION, FAILURE_HANDLING, REFUND_RELEASE | — |

---

## Task-to-Trust Principle Matrix

### No Silent Transitions

| Task | Enforcement |
|------|-------------|
| configure_test_harness | Test harness must log all state changes |
| evaluate_supplier | Decision logged with full rationale |
| implement_backend_tests | Code must log all transitions |
| postmortem_campaign | All breakdowns documented |
| red_team_campaign | All abuse vectors documented |
| setup_test_suites | Templates require logging verification |
| stress_test_ui_copy | State changes visible in copy |
| validate_escrow_mechanics | All fund movements logged |
| assess_operability | Fulfillment status trackable |
| resolve_dispute | Dispute status visible to all |
| communicate_status_change | Every change communicated |

### No Implicit Guarantees

| Task | Enforcement |
|------|-------------|
| configure_test_harness | Tests verify explicit behavior |
| evaluate_supplier | Acceptance ≠ success guarantee |
| implement_backend_tests | Tests verify explicit behavior |
| postmortem_campaign | No assumptions about improvement |
| red_team_campaign | Monitoring ≠ prevention |
| setup_test_suites | Templates verify explicit behavior |
| stress_test_ui_copy | Copy doesn't imply guarantees |
| validate_escrow_mechanics | Release conditions explicit |
| assess_operability | Timelines conditional |
| resolve_dispute | Resolution ≠ entitlement |
| communicate_status_change | No new guarantees implied |

### No Asymmetry

| Task | Enforcement |
|------|-------------|
| configure_test_harness | Test env mirrors production |
| evaluate_supplier | Same criteria for all suppliers |
| implement_backend_tests | Code reflects user-visible truth |
| postmortem_campaign | Internal failures acknowledged |
| red_team_campaign | Both sides analyzed equally |
| setup_test_suites | User-visible state verification |
| stress_test_ui_copy | User understanding matches system |
| validate_escrow_mechanics | User sees same fund status |
| assess_operability | User knows same status as ops |
| resolve_dispute | Both parties same information |
| communicate_status_change | User has same info as system |

### No Optimism Bias

| Task | Enforcement |
|------|-------------|
| configure_test_harness | Failure paths tested equally |
| evaluate_supplier | Worst-case failure evaluated |
| implement_backend_tests | Failure paths covered equally |
| postmortem_campaign | Near-misses treated as learning |
| red_team_campaign | Worst-case assumed |
| setup_test_suites | Failure cases equal priority |
| stress_test_ui_copy | Failure possibilities acknowledged |
| validate_escrow_mechanics | All failure scenarios covered |
| assess_operability | Worst-case timelines planned |
| resolve_dispute | User harm given full weight |
| communicate_status_change | Uncertainty explicit |

### Trust Debt Rule

| Task | Enforcement |
|------|-------------|
| configure_test_harness | Untestable paths = debt |
| evaluate_supplier | Clarity-reducing proposals rejected |
| implement_backend_tests | Untested escrow = critical debt |
| postmortem_campaign | Trust debt quantified |
| red_team_campaign | Unmitigated risk = debt |
| setup_test_suites | Missing critical tests = debt |
| stress_test_ui_copy | Confusing copy = debt |
| validate_escrow_mechanics | Unclear money flow = debt |
| assess_operability | Ops burden leak = debt |
| resolve_dispute | Resolution doesn't create debt |
| communicate_status_change | Delayed communication = debt |

---

## Task Execution Sequences

### Sequence 1: Campaign Evaluation (Pre-Acceptance)

```
1. red_team_campaign (RISK_ABUSE_ANALYST)
2. validate_escrow_mechanics (ESCROW_FINANCIAL_AUDITOR)
3. assess_operability (OPS_FULFILLMENT_ARCHITECT)
4. evaluate_supplier (MARKETPLACE_GATEKEEPER) — consumes outputs from 1-3
```

### Sequence 2: Test Infrastructure Setup

```
1. configure_test_harness (SYSTEM_ARCHITECT)
2. setup_test_suites (QA_LEAD)
3. implement_backend_tests (IMPLEMENTER)
```

### Sequence 3: UX Validation

```
1. stress_test_ui_copy (UX_TRUST_DESIGNER)
2. (approval or revision)
3. communicate_status_change (UX_TRUST_DESIGNER) — ongoing operation
```

### Sequence 4: Post-Campaign Analysis

```
1. postmortem_campaign (MARKETPLACE_GATEKEEPER / FOUNDER_MODE)
2. (if dispute) resolve_dispute (FOUNDER_MODE)
3. (corrective actions assigned to relevant roles)
```

---

## Coverage Analysis

### By Role

| Role | Primary Owner | Input Provider |
|------|---------------|----------------|
| SYSTEM_ARCHITECT | 1 task | 1 task |
| QA_LEAD | 1 task | 2 tasks |
| IMPLEMENTER | 1 task | 0 tasks |
| MARKETPLACE_GATEKEEPER | 2 tasks | 0 tasks |
| RISK_ABUSE_ANALYST | 1 task | 4 tasks |
| OPS_FULFILLMENT_ARCHITECT | 1 task | 4 tasks |
| ESCROW_FINANCIAL_AUDITOR | 1 task | 4 tasks |
| UX_TRUST_DESIGNER | 2 tasks | 2 tasks |
| FOUNDER_MODE | 2 tasks | 0 tasks |

### By Playbook

| Playbook | Invoked By | Consulted By |
|----------|------------|--------------|
| CAMPAIGN_ACCEPTANCE | 1 task | 2 tasks |
| DELAY_COMMUNICATION | 0 tasks | 4 tasks |
| FAILURE_HANDLING | 2 tasks | 7 tasks |
| PRECEDENT_REVIEW | 2 tasks | 1 task |
| REFUND_RELEASE | 2 tasks | 5 tasks |
| SUPPLIER_ONBOARDING | 0 tasks | 2 tasks |

---

## Identified Gaps

### Potential Missing Tasks

| Gap Area | Suggested Task | Owner |
|----------|----------------|-------|
| Supplier communication | notify_supplier_decision | MARKETPLACE_GATEKEEPER |
| Campaign creation | create_campaign | MARKETPLACE_GATEKEEPER |
| User onboarding | onboard_user | UX_TRUST_DESIGNER |

---

**End of Task Registry**
