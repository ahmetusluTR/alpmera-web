# Task: Implement Backend Tests

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Role Authority Matrix

---

## Purpose

Write the code for backend automated tests and lifecycle scripts, ensuring all critical paths—especially escrow transitions—are verifiable.

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| IMPLEMENTER | **Primary** | Code writing and configuration |
| QA_LEAD | **Specification** | Test requirements and acceptance criteria |
| SYSTEM_ARCHITECT | **Specification** | Technical configuration requirements |

### Playbook Dependencies

| Playbook | Relationship |
|----------|--------------|
| REFUND_RELEASE | Tests must cover all refund/release paths |
| FAILURE_HANDLING | Tests must cover all failure transitions |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | Tests must verify all state transitions are logged |
| No Implicit Guarantees | Tests must verify explicit behavior, not assumptions |
| No Asymmetry | Tests must verify user-visible state matches internal state |
| No Optimism Bias | Failure path tests must equal success path tests |
| Trust Debt Rule | Untested escrow paths = critical trust debt |

---

## Preconditions

- [ ] IMPLEMENTER role activated
- [ ] configure_test_harness task completed
- [ ] QA_LEAD specifications available
- [ ] SYSTEM_ARCHITECT configuration specs available

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| Technology selection document | SYSTEM_ARCHITECT | Tool configuration |
| Database isolation specification | SYSTEM_ARCHITECT | Environment setup |
| Lifecycle script specifications | SYSTEM_ARCHITECT | Script implementation |
| Test coverage requirements | QA_LEAD | What must be tested |
| Escrow state machine | Core Doctrine | Critical path identification |

---

## Execution Steps

### Step 1: Package Configuration
**Actor:** IMPLEMENTER

Add test packages to `package.json`:
- Testing framework (per SYSTEM_ARCHITECT selection)
- Database test utilities
- Assertion libraries

**Trust Model Check:** Packages must support deterministic, isolated tests (No Implicit Guarantees)

**Output:** Updated `package.json` with test dependencies

### Step 2: Test Runner Configuration
**Actor:** IMPLEMENTER

Configure the test runner per SYSTEM_ARCHITECT specifications:
- Test discovery patterns
- Isolation settings
- Logging configuration

**Trust Model Check:** Runner must log all state transitions during tests (No Silent Transitions)

**Output:** Test runner configuration files

### Step 3: Database Lifecycle Scripts
**Actor:** IMPLEMENTER

Write scripts per SYSTEM_ARCHITECT specifications:

| Script | Purpose | Trust Model Check |
|--------|---------|-------------------|
| Reset | Return to clean state | Must be deterministic |
| Migrate | Apply schema | Must match production |
| Seed | Insert test data | Must not assume success |

**Trust Model Check:** No Asymmetry — test database behavior must mirror production

**Output:** Executable lifecycle scripts

### Step 4: Unit Tests
**Actor:** IMPLEMENTER per QA_LEAD specifications

Write unit tests for isolated logic:
- Input validation
- Business logic functions
- State derivation

**Trust Model Check:** No Implicit Guarantees — tests must verify explicit behavior

**Output:** Unit test suite

### Step 5: API Integration Tests
**Actor:** IMPLEMENTER per QA_LEAD specifications

Write integration tests for API endpoints:
- Request/response verification
- State transition verification
- Error handling verification

**Trust Model Check:** No Silent Transitions — tests must verify logging occurs

**Output:** Integration test suite

### Step 6: Escrow Path Tests (Critical)
**Actor:** IMPLEMENTER per QA_LEAD specifications

Write tests for all escrow transitions:

| Transition | Test Coverage Required |
|------------|------------------------|
| LOCK | Funds locked on commitment |
| RELEASE | Funds released only after fulfillment confirmation |
| REFUND (failure) | Automatic refund on campaign failure |
| REFUND (exit) | Refund on user exit under allowed conditions |
| REFUND (timeout) | Refund when acceptance timeout expires |
| Partial REFUND | Correct calculation and user notification |

**Trust Model Check:** No Optimism Bias — failure paths must have equal coverage

**Output:** Escrow test suite (critical path)

### Step 7: QA_LEAD Review
**Actor:** QA_LEAD

Verify:
- [ ] All QA_LEAD specifications are implemented
- [ ] Escrow paths have complete coverage
- [ ] Failure paths have equal coverage to success paths
- [ ] Tests are deterministic and isolated

**Output:** Approval or rejection with required changes

---

## Required Outputs

| Output | Owner | Validates |
|--------|-------|-----------|
| Updated `package.json` | IMPLEMENTER | Dependencies configured |
| Test runner configuration | IMPLEMENTER | Runner properly configured |
| Lifecycle scripts | IMPLEMENTER | Reset/migrate/seed working |
| Unit test suite | IMPLEMENTER | Logic verification |
| Integration test suite | IMPLEMENTER | API verification |
| Escrow test suite | IMPLEMENTER | Critical path verification |
| QA_LEAD approval | QA_LEAD | Coverage meets standards |

---

## Completion Criteria

This task is complete when:
- [ ] All outputs are produced
- [ ] All tests pass
- [ ] QA_LEAD has approved coverage
- [ ] Escrow paths are fully tested
- [ ] Failure paths are fully tested

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] Tests verify state transition logging (No Silent Transitions)
- [ ] Tests verify explicit behavior only (No Implicit Guarantees)
- [ ] Test environment mirrors production (No Asymmetry)
- [ ] Failure path coverage equals success path coverage (No Optimism Bias)
- [ ] No critical escrow paths are untested (Trust Debt Rule)

---

## Handoff

On completion:
- QA_LEAD takes ownership of test maintenance
- SYSTEM_ARCHITECT validates CI/CD integration (future)
- Tests become gate for all future IMPLEMENTER work
