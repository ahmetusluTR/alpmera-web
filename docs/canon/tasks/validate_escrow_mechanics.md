# Task: Validate Escrow Mechanics

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Core Doctrine, Role Authority Matrix

---

## Purpose

Validate that a campaign's escrow mechanics are correct, explainable, and abuse-resistant before the campaign can proceed.

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| ESCROW_FINANCIAL_AUDITOR | **Primary** | Mechanics validation, approval/rejection |
| MARKETPLACE_GATEKEEPER | **Consumer** | Uses output for accept/reject decision |
| RISK_ABUSE_ANALYST | **Input** | Escrow manipulation risk assessment |

### Playbook Dependencies

| Playbook | Invocation |
|----------|------------|
| REFUND_RELEASE | **Must invoke** — refund/release conditions |
| FAILURE_HANDLING | **Must consult** — partial failure scenarios |
| CAMPAIGN_ACCEPTANCE | **Feeds into** — escrow validation required for acceptance |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | All fund movements must be logged and visible |
| No Implicit Guarantees | Release conditions must be explicit |
| No Asymmetry | Users see same fund status as system |
| No Optimism Bias | Partial failure scenarios must be addressed |
| Trust Debt Rule | Unclear money flow invalidates campaign |

---

## Preconditions

- [ ] ESCROW_FINANCIAL_AUDITOR role activated
- [ ] Constitution and Core Doctrine loaded
- [ ] Campaign mechanics documented
- [ ] REFUND_RELEASE playbook available

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| Campaign parameters | Proposal | Lock amount, conditions |
| Escrow flow diagram | Design | Path verification |
| Release conditions | Proposal | Trigger validation |
| Refund conditions | Proposal | Exit path validation |
| Risk assessment | RISK_ABUSE_ANALYST | Manipulation risk |

---

## Execution Steps

### Step 1: Lock Condition Validation
**Actor:** ESCROW_FINANCIAL_AUDITOR

Verify lock mechanics:

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Funds locked at commitment time | | |
| Lock amount matches commitment | | |
| Lock is recorded in ledger | | |
| Lock is visible to user | | |
| Lock explanation is plain language | | |

**Trust Model Check:** No Silent Transitions — lock must be visible and logged

**Output:** Lock condition validation

### Step 2: Release Condition Validation
**Actor:** ESCROW_FINANCIAL_AUDITOR

Verify release mechanics:

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Release requires supplier acceptance | | |
| Release requires fulfillment confirmation | | |
| Release conditions are explicit | | |
| No release without all conditions met | | |
| Release is recorded in ledger | | |
| Release notification sent to user | | |

**Trust Model Check:** No Implicit Guarantees — release conditions must be explicit

**Output:** Release condition validation

### Step 3: Refund Scenario Validation
**Actor:** ESCROW_FINANCIAL_AUDITOR

Per REFUND_RELEASE playbook, verify all refund paths:

| Scenario | Trigger | Amount | Timing | Validated |
|----------|---------|--------|--------|-----------|
| Campaign failure | Target not met | 100% | Immediate | |
| User exit (allowed) | User request + conditions | Per rules | Per rules | |
| Acceptance timeout | No acceptance in window | 100% | Automatic | |
| Supplier rejection | Supplier declines | 100% | Immediate | |
| Fulfillment failure | Supplier fails to deliver | 100% | Per investigation | |

**Trust Model Check:** No Optimism Bias — all failure scenarios must have refund paths

**Output:** Refund scenario validation

### Step 4: Partial Success Handling
**Actor:** ESCROW_FINANCIAL_AUDITOR

Per FAILURE_HANDLING playbook, verify partial scenarios:

| Scenario | Handling | User Consent Required | Calculation Clear |
|----------|----------|----------------------|-------------------|
| Partial fulfillment | | | |
| Partial refund | | | |
| Split delivery | | | |

**Trust Model Check:** No Asymmetry — partial calculations must be transparent to user

**Output:** Partial success validation

### Step 5: Explainability Test
**Actor:** ESCROW_FINANCIAL_AUDITOR

For each money movement, verify plain language explanation:

| Movement | Can Non-Expert Understand? | Explanation |
|----------|---------------------------|-------------|
| Lock | | |
| Release | | |
| Refund (each type) | | |
| Partial (if applicable) | | |

Per Core Doctrine Explainability Rule:
> If an action requires legal, financial, or technical expertise to understand, it is not allowed.

**Trust Model Check:** Explainability Rule — all movements must be understandable

**Output:** Explainability assessment

### Step 6: Abuse Resistance Review
**Actor:** ESCROW_FINANCIAL_AUDITOR with RISK_ABUSE_ANALYST input

Review escrow manipulation risks from red_team_campaign output:

| Risk | Mitigation | Sufficient |
|------|------------|------------|
| Premature release | | |
| Blocked refund | | |
| Partial confusion | | |
| Timing attack | | |

**Trust Model Check:** Trust Debt Rule — unmitigated escrow risk = trust debt

**Output:** Abuse resistance assessment

### Step 7: Final Determination
**Actor:** ESCROW_FINANCIAL_AUDITOR

Based on all validations:

| Determination | Criteria |
|---------------|----------|
| **Approved** | All checks pass, all scenarios covered |
| **Approved with Conditions** | Minor gaps, conditions specified |
| **Rejected** | Failed checks or unclear money flow |

---

## Required Output

Every validation must produce:

| Element | Content |
|---------|---------|
| **1. Money State Flow** | Complete flow diagram with all paths |
| **2. Risk Points** | Identified vulnerabilities |
| **3. User Explanation Summary** | Plain language for each movement |
| **4. Determination** | Approved / Approved with Conditions / Rejected |

---

## Output Format

```markdown
## Escrow Validation: [Campaign Name]

### Money State Flow
[Diagram or description of all fund movements]

### Validation Results
| Check | Status | Notes |
|-------|--------|-------|
| Lock conditions | | |
| Release conditions | | |
| Refund scenarios | | |
| Partial handling | | |
| Explainability | | |
| Abuse resistance | | |

### Risk Points
| Risk | Severity | Mitigation |
|------|----------|------------|

### User Explanations
| Movement | Plain Language Explanation |
|----------|---------------------------|

### Determination
- Status: Approved / Approved with Conditions / Rejected
- Conditions (if applicable): [List]
- Rationale: [Why this protects users]
```

---

## Completion Criteria

This task is complete when:
- [ ] Lock conditions validated
- [ ] Release conditions validated
- [ ] All refund scenarios validated
- [ ] Partial success handling validated
- [ ] Explainability confirmed
- [ ] Abuse resistance reviewed
- [ ] Final determination recorded

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] All fund movements are logged (No Silent Transitions)
- [ ] Release conditions are explicit (No Implicit Guarantees)
- [ ] User sees same fund status as system (No Asymmetry)
- [ ] All failure scenarios have refund paths (No Optimism Bias)
- [ ] No unclear money flow exists (Trust Debt Rule)

---

## Handoff

On Approved:
- MARKETPLACE_GATEKEEPER may proceed with campaign acceptance
- Escrow mechanics documented for operational use

On Approved with Conditions:
- Conditions must be implemented before campaign launch
- Re-validation required after implementation

On Rejected:
- Campaign cannot proceed
- Specific failures documented for redesign
