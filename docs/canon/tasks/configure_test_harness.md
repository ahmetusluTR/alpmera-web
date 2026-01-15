# Task: Configure Test Harness

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Role Authority Matrix

---

## Purpose

Select and configure the automated test tools and environment to ensure all state transitions are testable and auditable.

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| SYSTEM_ARCHITECT | **Primary** | Technology selection, environment strategy |
| QA_LEAD | **Approval** | Test standards compliance |
| IMPLEMENTER | **Execution** | Configuration implementation |

### Playbook Dependencies

| Playbook | Relationship |
|----------|--------------|
| REFUND_RELEASE | Test harness must support escrow path testing |
| FAILURE_HANDLING | Test harness must support failure state testing |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | Test harness must log all state changes during test runs |
| No Implicit Guarantees | Test results must be deterministic, not probabilistic |
| No Asymmetry | Test environment must mirror production behavior |
| No Optimism Bias | Failure paths must be first-class test targets |
| Trust Debt Rule | Untestable state transitions = trust debt |

---

## Preconditions

- [ ] SYSTEM_ARCHITECT role activated
- [ ] QA_LEAD available for approval
- [ ] Constitution and Trust Model loaded

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| Critical path inventory | QA_LEAD | Identify what must be testable |
| Database schema | SYSTEM_ARCHITECT | Design isolation strategy |
| Escrow state machine | Core Doctrine | Ensure all transitions are covered |

---

## Execution Steps

### Step 1: Technology Selection
**Actor:** SYSTEM_ARCHITECT

Select testing libraries with explicit criteria:
- Must support database isolation
- Must support transaction rollback
- Must produce deterministic results
- Must log all state transitions

**Output:** Technology selection document with rationale

### Step 2: Database Isolation Strategy
**Actor:** SYSTEM_ARCHITECT

Define test database naming and isolation:
- Test databases must be isolated from production
- Each test run must start from known state
- No shared state between test suites

**Trust Model Check:** No Asymmetry — test database behavior must match production

**Output:** Database isolation specification

### Step 3: Lifecycle Script Design
**Actor:** SYSTEM_ARCHITECT

Design database lifecycle scripts:
- Reset script (return to clean state)
- Migrate script (apply schema)
- Seed script (insert test data)

**Trust Model Check:** No Silent Transitions — all lifecycle operations must be logged

**Output:** Lifecycle script specifications

### Step 4: Test Run Plan
**Actor:** SYSTEM_ARCHITECT, approved by QA_LEAD

Establish test categorization:
- Unit tests: Isolated logic verification
- Integration tests: State transition verification
- Escrow tests: Financial path verification (critical)

**Trust Model Check:** No Optimism Bias — failure paths must have equal coverage to success paths

**Output:** Test run plan document

### Step 5: QA_LEAD Approval
**Actor:** QA_LEAD

Verify:
- [ ] All escrow transitions are testable
- [ ] All failure paths are testable
- [ ] Test isolation prevents false positives
- [ ] Configuration meets test standards

**Output:** Approval or rejection with required changes

---

## Required Outputs

| Output | Owner | Validates |
|--------|-------|-----------|
| Technology selection document | SYSTEM_ARCHITECT | Tool choices with rationale |
| Database isolation specification | SYSTEM_ARCHITECT | Test environment design |
| Lifecycle script specifications | SYSTEM_ARCHITECT | Reset/migrate/seed design |
| Test run plan | SYSTEM_ARCHITECT | Unit vs integration strategy |
| QA_LEAD approval | QA_LEAD | Standards compliance |

---

## Completion Criteria

This task is complete when:
- [ ] All outputs are produced
- [ ] QA_LEAD has approved the configuration
- [ ] Escrow paths are confirmed testable
- [ ] Failure paths are confirmed testable

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] Test harness logs all state transitions (No Silent Transitions)
- [ ] Test results are deterministic (No Implicit Guarantees)
- [ ] Test environment mirrors production (No Asymmetry)
- [ ] Failure paths have equal test coverage (No Optimism Bias)
- [ ] No untestable critical paths exist (Trust Debt Rule)

---

## Handoff

On completion, control passes to:
- IMPLEMENTER for implement_backend_tests task
- QA_LEAD for setup_test_suites task
