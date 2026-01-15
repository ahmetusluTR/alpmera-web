# Task: Campaign Postmortem

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Role Authority Matrix, North Star

---

## Purpose

Analyze a completed or failed campaign to extract lessons, identify trust debt, and prevent recurrence of issues. This task operationalizes the Precedent Rule: every campaign sets precedent, and precedent requires learning.

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| MARKETPLACE_GATEKEEPER | **Primary** (routine) | Precedent learning, doctrine compliance |
| FOUNDER_MODE | **Primary** (escalated) | Strategic judgment, irreversible lessons |
| OPS_FULFILLMENT_ARCHITECT | **Required Input** | Operational breakdown analysis |
| ESCROW_FINANCIAL_AUDITOR | **Required Input** | Financial path analysis |
| UX_TRUST_DESIGNER | **Required Input** | User perception analysis |
| RISK_ABUSE_ANALYST | **Required Input** | Abuse/exploit assessment |

### Playbook Dependencies

| Playbook | Invocation |
|----------|------------|
| FAILURE_HANDLING | **Must consult** — was failure handled correctly? |
| DELAY_COMMUNICATION | **Must consult** — were delays communicated correctly? |
| PRECEDENT_REVIEW | **Must invoke** — what precedent was set? |
| REFUND_RELEASE | **Must consult** — were fund movements correct? |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | All breakdown points must be documented |
| No Implicit Guarantees | Postmortem must not assume future improvement |
| No Asymmetry | Same analysis rigor for success and failure |
| No Optimism Bias | Near-misses treated as failures for learning |
| Trust Debt Rule | Identify any trust debt created or revealed |

---

## Preconditions

- [ ] MARKETPLACE_GATEKEEPER or FOUNDER_MODE role activated
- [ ] Campaign has reached terminal state (SUCCESS, FAILED, or RELEASED)
- [ ] Constitution and Trust Model loaded
- [ ] All campaign documentation available

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| Campaign timeline | System records | Event sequence |
| User communications | Communication logs | Message analysis |
| Escrow state transitions | Ledger | Financial path verification |
| Outcome classification | System records | Success/failure determination |
| Operational events | OPS_FULFILLMENT_ARCHITECT | Fulfillment analysis |
| User feedback (if any) | Support channels | Perception assessment |

---

## Execution Steps

### Step 1: Timeline Reconstruction
**Actor:** Primary role (MARKETPLACE_GATEKEEPER or FOUNDER_MODE)

Reconstruct complete campaign timeline:
- Campaign creation
- Aggregation period events
- Acceptance (or failure to accept)
- Fulfillment events (if applicable)
- Resolution

**Trust Model Check:** No Silent Transitions — all state changes must be accounted for

**Output:** Complete timeline document

### Step 2: Expectation vs. Reality Analysis
**Actor:** Primary role with all input roles

Document:
| Phase | What Was Expected | What Happened | Divergence |
|-------|-------------------|---------------|------------|
| Aggregation | | | |
| Acceptance | | | |
| Fulfillment | | | |
| Resolution | | | |

**Trust Model Check:** No Optimism Bias — near-misses count as divergence

**Output:** Divergence inventory

### Step 3: Breakdown Identification
**Actor:** Primary role with input from relevant roles

For each divergence, identify:
- Root cause
- Which role/playbook should have caught it
- Whether it was preventable, detectable, or irreversible
- User impact

**Consult:**
- OPS_FULFILLMENT_ARCHITECT for operational breakdowns
- ESCROW_FINANCIAL_AUDITOR for financial breakdowns
- UX_TRUST_DESIGNER for communication breakdowns
- RISK_ABUSE_ANALYST for abuse/exploit incidents

**Trust Model Check:** No Asymmetry — internal failures must be acknowledged, not hidden

**Output:** Breakdown analysis document

### Step 4: Trust Impact Assessment
**Actor:** Primary role

Evaluate trust impact using Trust Model framework:

| Question | Assessment |
|----------|------------|
| Did any silent transitions occur? | |
| Were any implicit guarantees made or broken? | |
| Did users and suppliers have asymmetric information? | |
| Was optimism bias present in decisions? | |
| Was trust debt created? | |

Per North Star: Did campaign complete or fail **exactly as explained**?

**Trust Model Check:** Trust Debt Rule — any trust debt must be quantified

**Output:** Trust impact assessment

### Step 5: Precedent Evaluation
**Actor:** Primary role

Per PRECEDENT_REVIEW playbook:
- What precedent did this campaign set?
- If repeated 100x, would this pattern be harmful?
- Did this attract or repel bad-fit suppliers?
- Did this clarify or blur Alpmera's identity?

**Trust Model Check:** No Implicit Guarantees — success does not guarantee safe precedent

**Output:** Precedent assessment

### Step 6: Corrective Action Identification
**Actor:** Primary role

For each breakdown and trust impact:

| Breakdown | Corrective Action | Owner | Timeline |
|-----------|-------------------|-------|----------|
| | | | |

Corrective actions must be:
- Specific (not "do better")
- Assigned (clear owner)
- Timebound (deadline)
- Verifiable (completion criteria)

**Output:** Corrective action plan

### Step 7: Escalation Decision (if needed)
**Actor:** MARKETPLACE_GATEKEEPER

If postmortem reveals:
- Doctrine-level issues
- Precedent risk requiring policy change
- Irreversible trust damage

Escalate to FOUNDER_MODE.

---

## Required Output

Every postmortem must produce:

| Element | Content |
|---------|---------|
| **1. Summary of Events** | Timeline with key decision points |
| **2. Identified Breakdowns** | What went wrong and why |
| **3. Trust Impact Assessment** | Trust Model principle violations |
| **4. Precedent Assessment** | What precedent was set |
| **5. Preventive Changes Required** | Corrective action plan |

---

## Completion Criteria

This task is complete when:
- [ ] Timeline is fully reconstructed
- [ ] All divergences are documented
- [ ] Breakdowns are identified with root causes
- [ ] Trust impact is assessed
- [ ] Precedent is evaluated
- [ ] Corrective actions are identified with owners and timelines
- [ ] Document is logged for future reference

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] All state transitions are accounted for (No Silent Transitions)
- [ ] No assumptions about future improvement (No Implicit Guarantees)
- [ ] Internal failures acknowledged honestly (No Asymmetry)
- [ ] Near-misses treated as learning opportunities (No Optimism Bias)
- [ ] Trust debt quantified and addressed (Trust Debt Rule)

---

## Handoff

On completion:
- Corrective actions assigned to relevant role owners
- Postmortem archived for precedent reference
- MARKETPLACE_GATEKEEPER updates evaluation criteria if needed
- FOUNDER_MODE notified if policy changes required
