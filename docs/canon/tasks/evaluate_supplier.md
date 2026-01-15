# Task: Evaluate Supplier Proposal

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Role Authority Matrix

---

## Purpose

Evaluate whether a supplier proposal may proceed to campaign creation, ensuring doctrine compliance and trust preservation.

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| MARKETPLACE_GATEKEEPER | **Primary** | Final accept/reject decision |
| RISK_ABUSE_ANALYST | **Required Input** | Abuse vector identification |
| OPS_FULFILLMENT_ARCHITECT | **Required Input** | Operability assessment |
| ESCROW_FINANCIAL_AUDITOR | **Required Input** | Escrow mechanics validation |

### Playbook Dependencies

| Playbook | Invocation |
|----------|------------|
| CAMPAIGN_ACCEPTANCE | **Must invoke** — primary playbook for this task |
| PRECEDENT_REVIEW | **Must invoke** — all approvals set precedent |
| SUPPLIER_ONBOARDING | **Must consult** — verify supplier eligibility |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | Decision must be logged with full rationale |
| No Implicit Guarantees | Acceptance ≠ success guarantee; constraints must be explicit |
| No Asymmetry | Same evaluation criteria for all suppliers |
| No Optimism Bias | Must evaluate worst-case failure scenario |
| Trust Debt Rule | Proposals that reduce clarity must be rejected |

---

## Preconditions

- [ ] MARKETPLACE_GATEKEEPER role activated
- [ ] Constitution loaded
- [ ] CAMPAIGN_ACCEPTANCE playbook available
- [ ] PRECEDENT_REVIEW playbook available
- [ ] Supplier has completed onboarding (SUPPLIER_ONBOARDING verified)

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| Supplier identity and background | Supplier | Eligibility verification |
| Product or service description | Supplier | Doctrine fit assessment |
| Proposed campaign parameters | Supplier | Risk evaluation |
| Fulfillment expectations | Supplier | Operability assessment |
| Abuse vector analysis | RISK_ABUSE_ANALYST | Threat identification |
| Operability assessment | OPS_FULFILLMENT_ARCHITECT | Feasibility verification |
| Escrow mechanics review | ESCROW_FINANCIAL_AUDITOR | Financial path validation |

---

## Execution Steps

### Step 1: Gather Required Inputs
**Actor:** MARKETPLACE_GATEKEEPER

Request and collect:
- [ ] Supplier proposal documentation
- [ ] RISK_ABUSE_ANALYST threat assessment (invoke red_team_campaign task if needed)
- [ ] OPS_FULFILLMENT_ARCHITECT operability review
- [ ] ESCROW_FINANCIAL_AUDITOR escrow validation

**Gate:** Do not proceed until all inputs are received

### Step 2: Doctrine Fit Evaluation
**Actor:** MARKETPLACE_GATEKEEPER

Per CAMPAIGN_ACCEPTANCE playbook, evaluate:

| Question | Pass/Fail |
|----------|-----------|
| Does this align with "trust-first demand aggregation clearing house"? | |
| Does this avoid store/retailer/marketplace behavior? | |
| Does demand precede supply commitment? | |
| Is escrow central to the mechanics? | |

**Trust Model Check:** No Asymmetry — criteria must be consistent with all prior evaluations

**Output:** Doctrine Fit determination (Pass/Fail)

**Gate:** If Doctrine Fit = Fail, proceed to Step 6 (Reject)

### Step 3: Risk and Failure Mode Evaluation
**Actor:** MARKETPLACE_GATEKEEPER with RISK_ABUSE_ANALYST input

Identify:
- How could this campaign fail?
- How could users be harmed?
- What abuse vectors exist?
- Are risks preventable, detectable, or irreversible?

**Trust Model Check:** No Optimism Bias — worst-case must be acknowledged

**Output:** Risk inventory with classification

**Gate:** If irreversible user harm is identified without mitigation, proceed to Step 6 (Reject)

### Step 4: Operability and Precedent Evaluation
**Actor:** MARKETPLACE_GATEKEEPER with OPS_FULFILLMENT_ARCHITECT input

Per PRECEDENT_REVIEW playbook, evaluate:

| Question | Assessment |
|----------|------------|
| Can this be fulfilled clearly and predictably? | |
| Is there a clear fulfillment owner? | |
| Are failure recovery paths defined? | |
| Would this be harmful if repeated 100x? | |
| Would this attract bad-fit suppliers? | |
| Would this blur Alpmera into a store? | |

**Trust Model Check:** No Optimism Bias — assume worst-case scaling

**Output:** Operability assessment and precedent risk determination

**Gate:** If precedent risk is unacceptable, proceed to Step 6 (Reject)

### Step 5: Decision Formulation
**Actor:** MARKETPLACE_GATEKEEPER

Based on Steps 2-4, determine outcome:

| Outcome | Criteria |
|---------|----------|
| **Accept** | Doctrine fit, acceptable risk, clear operability, safe precedent |
| **Accept with Constraints** | Acceptable only with enforceable conditions |
| **Defer** | Additional information required |
| **Reject** | Doctrine violation, unacceptable risk, unclear operability, or unsafe precedent |

**Constraint Rule:** Constraints must be:
- Explicit (stated in writing)
- Enforceable (by system or operations, not trust)
- Visible (to users when relevant)

**Trust Model Check:** No Implicit Guarantees — constraints must not assume supplier goodwill

### Step 6: Document Decision
**Actor:** MARKETPLACE_GATEKEEPER

Record decision with required elements:

---

## Required Output

Every evaluation must produce:

| Element | Content |
|---------|---------|
| **1. Decision** | Accept / Accept with Constraints / Defer / Reject |
| **2. Doctrine Fit** | Pass / Fail with explanation |
| **3. Key Risks Identified** | From RISK_ABUSE_ANALYST and own analysis |
| **4. Worst-Case Failure Scenario** | Explicit description |
| **5. Constraints** | If applicable, explicit and enforceable |
| **6. Why This Decision Protects Alpmera** | Trust preservation rationale |

---

## Completion Criteria

This task is complete when:
- [ ] All required inputs have been gathered
- [ ] Doctrine fit has been evaluated
- [ ] Risk and failure modes have been assessed
- [ ] Operability and precedent have been evaluated
- [ ] A clear decision is recorded with all required elements
- [ ] Decision is logged in audit trail

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] Decision is documented with full rationale (No Silent Transitions)
- [ ] No implicit guarantees made to supplier (No Implicit Guarantees)
- [ ] Same criteria applied as to all suppliers (No Asymmetry)
- [ ] Worst-case failure scenario explicitly stated (No Optimism Bias)
- [ ] Decision does not create trust debt (Trust Debt Rule)

---

## Escalation

If decision cannot be made cleanly due to:
- Doctrine ambiguity
- Unprecedented risk profile
- Cross-role conflict

Escalate to FOUNDER_MODE per CONFLICT_RESOLUTION rules.

---

## Handoff

On Accept or Accept with Constraints:
- Campaign proceeds to creation
- ESCROW_FINANCIAL_AUDITOR validates escrow setup
- OPS_FULFILLMENT_ARCHITECT confirms fulfillment plan

On Defer:
- Return to supplier with specific information requirements
- Re-evaluate when information is provided

On Reject:
- Supplier notified with explanation (per future SUPPLIER_COMMUNICATION playbook)
- Decision logged for precedent reference
