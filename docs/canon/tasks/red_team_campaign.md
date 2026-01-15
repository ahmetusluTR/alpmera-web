# Task: Red-Team Campaign

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Role Authority Matrix

---

## Purpose

Identify how an approved or proposed campaign could fail, be abused, or erode trust through adversarial analysis. This task assumes malicious actors and worst-case scenarios.

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| RISK_ABUSE_ANALYST | **Primary** | Adversarial analysis, abuse vector identification |
| MARKETPLACE_GATEKEEPER | **Consumer** | Uses output for accept/reject decision |
| ESCROW_FINANCIAL_AUDITOR | **Input** | Escrow manipulation scenarios |
| OPS_FULFILLMENT_ARCHITECT | **Input** | Operational exploit scenarios |

### Playbook Dependencies

| Playbook | Invocation |
|----------|------------|
| CAMPAIGN_ACCEPTANCE | **Feeds into** — risk analysis informs acceptance |
| PRECEDENT_REVIEW | **Must consult** — exploitation at scale |
| REFUND_RELEASE | **Must consult** — refund abuse vectors |
| SUPPLIER_ONBOARDING | **Must consult** — first-time supplier risk |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | All abuse vectors must be documented, not assumed away |
| No Implicit Guarantees | Monitoring ≠ prevention; explicit mitigation required |
| No Asymmetry | Analysis must consider supplier AND user abuse |
| No Optimism Bias | Assume adversarial behavior; never rely on goodwill |
| Trust Debt Rule | Unmitigated irreversible risk = trust debt |

---

## Preconditions

- [ ] RISK_ABUSE_ANALYST role activated
- [ ] Constitution loaded
- [ ] Campaign mechanics documented
- [ ] Escrow flow defined

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| Campaign mechanics | Proposal | Attack surface identification |
| Escrow flow | ESCROW_FINANCIAL_AUDITOR | Financial exploitation analysis |
| Supplier details | Proposal | Supplier-side abuse vectors |
| User journey | UX documentation | User-side abuse vectors |
| Fulfillment model | OPS_FULFILLMENT_ARCHITECT | Operational exploitation |

---

## Execution Steps

### Step 1: Attack Surface Mapping
**Actor:** RISK_ABUSE_ANALYST

Identify all points where adversaries interact with the system:
- Commitment flow
- Escrow mechanics
- Acceptance process
- Fulfillment verification
- Refund triggers
- Communication channels

**Trust Model Check:** No Silent Transitions — document all interaction points

**Output:** Attack surface inventory

### Step 2: Supplier Abuse Analysis
**Actor:** RISK_ABUSE_ANALYST

Assume supplier is adversarial. Identify:

| Abuse Vector | Exploit Scenario | User Harm |
|--------------|------------------|-----------|
| Acceptance manipulation | Supplier accepts, delays indefinitely | Funds locked, no product |
| Partial fulfillment exploit | Supplier delivers inferior/partial | User receives less than expected |
| Identity fraud | Supplier misrepresents capability | Campaign fails post-acceptance |
| Escrow timing attack | Supplier exploits release conditions | Premature fund release |
| Repeat offense | Known bad actor re-enters | Pattern of harm |

**Trust Model Check:** No Optimism Bias — assume no goodwill

**Output:** Supplier abuse vector inventory

### Step 3: User Abuse Analysis
**Actor:** RISK_ABUSE_ANALYST

Assume user is adversarial. Identify:

| Abuse Vector | Exploit Scenario | System Harm |
|--------------|------------------|-------------|
| Refund arbitrage | User exploits refund conditions | Financial loss |
| Commitment manipulation | User commits/exits to manipulate campaign | Campaign integrity |
| Identity fraud | User misrepresents identity | Compliance risk |
| Chargeback abuse | User disputes after fulfillment | Financial loss |
| Collusion | User-supplier coordination | System gaming |

**Trust Model Check:** No Asymmetry — analyze both sides equally

**Output:** User abuse vector inventory

### Step 4: Escrow Manipulation Analysis
**Actor:** RISK_ABUSE_ANALYST with ESCROW_FINANCIAL_AUDITOR input

Identify escrow-specific exploits:

| Manipulation | Scenario | Mitigation Status |
|--------------|----------|-------------------|
| Premature release | Trigger release without fulfillment | |
| Blocked refund | Prevent legitimate refund | |
| Partial confusion | Exploit partial fulfillment ambiguity | |
| Timing attack | Exploit deadline edge cases | |

**Trust Model Check:** No Implicit Guarantees — each mitigation must be explicit

**Output:** Escrow manipulation inventory

### Step 5: Scalability Risk Analysis
**Actor:** RISK_ABUSE_ANALYST

Per PRECEDENT_REVIEW playbook, evaluate:
- If this exploit worked once, what happens at 100x scale?
- Would this attract adversarial actors?
- Does success depend on manual intervention that doesn't scale?

**Trust Model Check:** No Optimism Bias — assume exploits will be discovered and repeated

**Output:** Scalability risk assessment

### Step 6: Risk Classification
**Actor:** RISK_ABUSE_ANALYST

Classify all identified risks:

| Risk | Classification | Rationale |
|------|----------------|-----------|
| | **Preventable** | Can be blocked by system design |
| | **Detectable** | Can be identified after occurrence |
| | **Irreversible** | Cannot be recovered from |

**Trust Model Check:** Trust Debt Rule — irreversible risks require rejection or redesign

**Output:** Classified risk inventory

### Step 7: Recommendation Formulation
**Actor:** RISK_ABUSE_ANALYST

Based on analysis, recommend:

| Recommendation | Criteria |
|----------------|----------|
| **Block** | Irreversible user harm without mitigation |
| **Constrain** | Acceptable with explicit, enforceable conditions |
| **Monitor** | Detectable risks with clear response plan |
| **Accept** | Preventable risks with system controls |

**Trust Model Check:** No Implicit Guarantees — "Monitor" requires explicit response plan, not assumption of detection

---

## Required Output

Every red-team analysis must produce:

| Element | Content |
|---------|---------|
| **1. Exploit Scenario Descriptions** | Detailed adversarial scenarios |
| **2. Likelihood and Impact Assessment** | Probability and severity |
| **3. User Harm Analysis** | How users could be damaged |
| **4. Risk Classification** | Preventable / Detectable / Irreversible |
| **5. Recommendation** | Block / Constrain / Monitor / Accept |

---

## Output Format

```
## Red-Team Analysis: [Campaign Name]

### Attack Surface
[Inventory of interaction points]

### Abuse Vectors

#### Supplier-Side
| Vector | Scenario | Harm | Classification | Mitigation |
|--------|----------|------|----------------|------------|

#### User-Side
| Vector | Scenario | Harm | Classification | Mitigation |
|--------|----------|------|----------------|------------|

#### Escrow-Specific
| Vector | Scenario | Harm | Classification | Mitigation |
|--------|----------|------|----------------|------------|

### Scalability Assessment
[What happens at 100x]

### Recommendation
[Block / Constrain / Monitor / Accept]

### Rationale
[Why this recommendation protects Alpmera]
```

---

## Completion Criteria

This task is complete when:
- [ ] Attack surface is mapped
- [ ] Supplier abuse vectors are documented
- [ ] User abuse vectors are documented
- [ ] Escrow manipulation risks are documented
- [ ] All risks are classified
- [ ] Clear recommendation is provided
- [ ] User harm pathways are explicit

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] All abuse vectors documented (No Silent Transitions)
- [ ] Mitigations are explicit, not assumed (No Implicit Guarantees)
- [ ] Both supplier and user abuse analyzed (No Asymmetry)
- [ ] Worst-case scenarios assumed (No Optimism Bias)
- [ ] Irreversible risks flagged for rejection/redesign (Trust Debt Rule)

---

## Handoff

On completion:
- Output provided to MARKETPLACE_GATEKEEPER for evaluate_supplier task
- If Block recommended, campaign cannot proceed
- If Constrain recommended, constraints must be documented in acceptance
- If Monitor recommended, response plan must be documented before acceptance
