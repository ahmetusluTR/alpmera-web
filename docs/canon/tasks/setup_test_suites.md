# Task: Setup Test Suites

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Role Authority Matrix

---

## Purpose

Establish the folder structure, documentation templates, and initial test cases for systematic quality assurance, with emphasis on escrow and state transition coverage.

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| QA_LEAD | **Primary** | Structure definition, case design, standards |
| SYSTEM_ARCHITECT | **Input** | Technical constraints, architecture alignment |
| IMPLEMENTER | **Consumer** | Uses structure for test implementation |

### Playbook Dependencies

| Playbook | Relationship |
|----------|--------------|
| REFUND_RELEASE | Test cases must cover all refund/release scenarios |
| FAILURE_HANDLING | Test cases must cover all failure transitions |
| CAMPAIGN_ACCEPTANCE | Test cases must cover acceptance state transitions |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | Test structure must require transition logging verification |
| No Implicit Guarantees | Test cases must verify explicit behavior only |
| No Asymmetry | Test coverage must include user-visible state verification |
| No Optimism Bias | Failure cases must have equal priority to success cases |
| Trust Debt Rule | Missing critical test cases = trust debt |

---

## Preconditions

- [ ] QA_LEAD role activated
- [ ] Constitution and Trust Model loaded
- [ ] Core Doctrine escrow state machine documented
- [ ] configure_test_harness task completed (or in parallel)

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| Escrow state machine | Core Doctrine | Critical path identification |
| Campaign state machine | PRD | State transition inventory |
| Architecture documentation | SYSTEM_ARCHITECT | Technical constraints |

---

## Execution Steps

### Step 1: Directory Structure Creation
**Actor:** QA_LEAD

Create `docs/tests/` directory with subdirectories:

```
docs/tests/
├── README.md              # Test documentation overview
├── cases/                 # Individual test case definitions
│   ├── unit/              # Unit test cases
│   ├── integration/       # Integration test cases
│   └── escrow/            # Critical escrow test cases
├── regressions/           # Regression test tracking
│   ├── critical/          # Must-pass regressions
│   └── standard/          # Standard regressions
└── steps/                 # Reusable test step definitions
    ├── setup/             # Setup procedures
    ├── verification/      # Verification procedures
    └── teardown/          # Cleanup procedures
```

**Trust Model Check:** Structure must separate critical (escrow) from standard tests

**Output:** Directory structure created

### Step 2: Test Case Template Definition
**Actor:** QA_LEAD

Create test case template that enforces Trust Model compliance:

```markdown
# Test Case: [TC-XXX] [Name]

## Classification
- **Priority:** Critical / High / Medium / Low
- **Category:** Unit / Integration / Escrow
- **Trust Principle:** [Which principle this verifies]

## Purpose
[What this test verifies]

## Preconditions
- [ ] [Required state before test]

## Test Steps
1. [Action]
   - Expected: [Result]
   - Trust Check: [Which principle is verified]

## Verification
- [ ] [What must be true for pass]

## Trust Model Compliance
- [ ] State transition logged (No Silent Transitions)
- [ ] Behavior is explicit (No Implicit Guarantees)
- [ ] User-visible state matches internal (No Asymmetry)

## Failure Handling
[What to do if test fails]
```

**Trust Model Check:** Template must require Trust Model verification

**Output:** Test case template document

### Step 3: Regression Case Template Definition
**Actor:** QA_LEAD

Create regression tracking template:

```markdown
# Regression: [REG-XXX] [Name]

## Origin
- **Source:** [Bug ID / Incident / Postmortem]
- **Date Added:** [Date]
- **Severity:** Critical / High / Medium

## Description
[What this regression prevents]

## Test Cases
- [TC-XXX] [Related test case]

## Trust Impact
[What trust damage this regression prevents]
```

**Output:** Regression template document

### Step 4: Critical Escrow Test Cases
**Actor:** QA_LEAD

Define test cases for all escrow transitions (per REFUND_RELEASE playbook):

| Test Case ID | Transition | Scenario | Priority |
|--------------|------------|----------|----------|
| TC-ESC-001 | LOCK | Funds locked on valid commitment | Critical |
| TC-ESC-002 | LOCK | Lock rejected on invalid commitment | Critical |
| TC-ESC-003 | RELEASE | Release after fulfillment confirmation | Critical |
| TC-ESC-004 | RELEASE | Release blocked without confirmation | Critical |
| TC-ESC-005 | REFUND | Auto-refund on campaign failure | Critical |
| TC-ESC-006 | REFUND | Refund on user exit (allowed) | Critical |
| TC-ESC-007 | REFUND | Refund on acceptance timeout | Critical |
| TC-ESC-008 | REFUND | Refund blocked on invalid exit | Critical |
| TC-ESC-009 | PARTIAL | Partial refund calculation | Critical |
| TC-ESC-010 | PARTIAL | Partial refund user notification | Critical |

**Trust Model Check:** No Optimism Bias — failure cases have equal priority

**Output:** Escrow test case documents in `docs/tests/cases/escrow/`

### Step 5: Campaign State Transition Test Cases
**Actor:** QA_LEAD

Define test cases for campaign state machine:

| Test Case ID | Transition | Scenario | Priority |
|--------------|------------|----------|----------|
| TC-CAM-001 | → AGGREGATION | Campaign created correctly | High |
| TC-CAM-002 | AGGREGATION → SUCCESS | Target met, transition occurs | High |
| TC-CAM-003 | AGGREGATION → FAILED | Target not met, transition occurs | High |
| TC-CAM-004 | SUCCESS → FULFILLMENT | Supplier accepts, transition occurs | High |
| TC-CAM-005 | SUCCESS → FAILED | Supplier rejects/timeout | High |
| TC-CAM-006 | FULFILLMENT → RELEASED | Fulfillment confirmed | High |
| TC-CAM-007 | FULFILLMENT → FAILED | Fulfillment fails | High |
| TC-CAM-008 | Invalid transition | Blocked by system | High |

**Trust Model Check:** No Silent Transitions — each test must verify logging

**Output:** Campaign test case documents in `docs/tests/cases/integration/`

### Step 6: Initial Regression Cases
**Actor:** QA_LEAD

Document first set of critical regressions:

| Regression ID | Prevents | Related Test Cases |
|---------------|----------|-------------------|
| REG-001 | Silent fund movement | TC-ESC-001 through TC-ESC-010 |
| REG-002 | Invalid state transition | TC-CAM-008 |
| REG-003 | Missing audit log entry | All transition tests |

**Output:** Regression documents in `docs/tests/regressions/critical/`

### Step 7: Documentation Overview
**Actor:** QA_LEAD

Create `docs/tests/README.md` with:
- Test structure overview
- How to add new test cases
- How to run tests
- Trust Model compliance requirements
- Critical vs. standard test distinction

**Output:** Test documentation README

---

## Required Outputs

| Output | Location | Purpose |
|--------|----------|---------|
| Directory structure | `docs/tests/` | Organized test artifacts |
| Test case template | `docs/tests/cases/TEMPLATE.md` | Standardized case format |
| Regression template | `docs/tests/regressions/TEMPLATE.md` | Standardized regression format |
| Escrow test cases | `docs/tests/cases/escrow/` | Critical path coverage |
| Campaign test cases | `docs/tests/cases/integration/` | State transition coverage |
| Initial regressions | `docs/tests/regressions/critical/` | Core protection |
| README | `docs/tests/README.md` | Documentation overview |

---

## Completion Criteria

This task is complete when:
- [ ] Directory structure is created
- [ ] Test case template is defined
- [ ] Regression template is defined
- [ ] All escrow transitions have test cases
- [ ] All campaign transitions have test cases
- [ ] Initial regressions are documented
- [ ] README provides clear guidance

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] Templates require transition logging verification (No Silent Transitions)
- [ ] Templates require explicit behavior verification (No Implicit Guarantees)
- [ ] Templates require user-visible state verification (No Asymmetry)
- [ ] Failure cases have equal priority to success cases (No Optimism Bias)
- [ ] All critical escrow paths have test cases (Trust Debt Rule)

---

## Handoff

On completion:
- IMPLEMENTER uses structure for implement_backend_tests task
- QA_LEAD maintains and expands test suite
- Test cases become gate for all code changes
