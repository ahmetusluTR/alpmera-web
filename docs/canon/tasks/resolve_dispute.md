# Task: Resolve Dispute

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Role Authority Matrix

---

## Purpose

Resolve a dispute between user and supplier (or user and Alpmera) while preserving trust and maintaining doctrine compliance. This task operationalizes the PRD's Phase 0 requirement for "Manual dispute handling."

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| FOUNDER_MODE | **Primary** | Final dispute authority |
| ESCROW_FINANCIAL_AUDITOR | **Required Input** | Fund disposition determination |
| OPS_FULFILLMENT_ARCHITECT | **Required Input** | Operational facts |
| RISK_ABUSE_ANALYST | **Required Input** | Abuse assessment |
| UX_TRUST_DESIGNER | **Required Input** | Communication review |

### Playbook Dependencies

| Playbook | Invocation |
|----------|------------|
| FAILURE_HANDLING | **Must invoke** — dispute may constitute failure |
| REFUND_RELEASE | **Must invoke** — fund disposition |
| DELAY_COMMUNICATION | **Must consult** — if resolution involves delay |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | Dispute status must be visible to all parties |
| No Implicit Guarantees | Resolution does not set automatic precedent |
| No Asymmetry | Both parties receive same information |
| No Optimism Bias | Worst-case user harm must be considered |
| Trust Debt Rule | Resolution must not create future trust debt |

---

## Preconditions

- [ ] FOUNDER_MODE role activated
- [ ] Constitution and Trust Model loaded
- [ ] Dispute is formally raised (not informal complaint)
- [ ] All relevant documentation available

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| Dispute description | Disputing party | Understand claim |
| Campaign documentation | System records | Context |
| Escrow state | Ledger | Fund status |
| Communication history | Records | What was said |
| Supplier response | Supplier | Counter-claim |
| Operational timeline | OPS_FULFILLMENT_ARCHITECT | What happened |

---

## Execution Steps

### Step 1: Dispute Classification
**Actor:** FOUNDER_MODE

Classify the dispute:

| Type | Definition | Primary Concern |
|------|------------|-----------------|
| Fulfillment dispute | Product/service not as expected | User harm |
| Timeline dispute | Delivery timing contested | User expectation |
| Refund dispute | Disagreement on refund eligibility | Fund disposition |
| Communication dispute | Information asymmetry claimed | Trust damage |
| Abuse allegation | Party accuses other of bad faith | System integrity |

**Trust Model Check:** No Silent Transitions — classification must be documented

**Output:** Dispute classification with rationale

### Step 2: Fact Gathering
**Actor:** FOUNDER_MODE with all input roles

Gather objective facts:

**From OPS_FULFILLMENT_ARCHITECT:**
- What was the operational timeline?
- Were there documented delays?
- What was communicated when?

**From ESCROW_FINANCIAL_AUDITOR:**
- What is the current fund state?
- What were the stated release/refund conditions?
- Were conditions met?

**From RISK_ABUSE_ANALYST:**
- Is there evidence of abuse by either party?
- Does this match known abuse patterns?

**Trust Model Check:** No Asymmetry — gather facts from all perspectives

**Output:** Fact summary document

### Step 3: Doctrine Compliance Check
**Actor:** FOUNDER_MODE

Evaluate whether Alpmera's actions complied with doctrine:

| Question | Yes/No | Evidence |
|----------|--------|----------|
| Were Language Law terms used correctly? | | |
| Were state transitions visible? | | |
| Were guarantees explicit (not implicit)? | | |
| Was failure handled per playbook? | | |
| Was user treated same as supplier? | | |

**Trust Model Check:** If Alpmera violated doctrine, resolution must favor harmed party

**Output:** Doctrine compliance assessment

### Step 4: User Harm Assessment
**Actor:** FOUNDER_MODE

Evaluate user harm:

| Harm Type | Present? | Severity | Reversible? |
|-----------|----------|----------|-------------|
| Financial loss | | | |
| Time loss | | | |
| Expectation violation | | | |
| Trust damage | | | |

**Trust Model Check:** No Optimism Bias — assume harm is real unless proven otherwise

**Output:** User harm assessment

### Step 5: Resolution Options
**Actor:** FOUNDER_MODE

Identify possible resolutions:

| Option | Description | User Impact | Supplier Impact | Precedent Risk |
|--------|-------------|-------------|-----------------|----------------|
| Full refund | Return all locked funds | | | |
| Partial refund | Return portion of funds | | | |
| Fulfillment completion | Require supplier to deliver | | | |
| Compensation | Additional remedy | | | |
| No action | Dismiss dispute | | | |

**Trust Model Check:** Trust Debt Rule — resolution must not create future trust debt

**Output:** Resolution options with analysis

### Step 6: Precedent Evaluation
**Actor:** FOUNDER_MODE

For each resolution option:

| Question | Assessment |
|----------|------------|
| If repeated 100x, would this resolution be harmful? | |
| Would this attract bad-faith disputes? | |
| Would this discourage legitimate suppliers? | |
| Does this clarify or blur Alpmera's role? | |

**Trust Model Check:** No Implicit Guarantees — resolution must not create entitlements

**Output:** Precedent risk assessment

### Step 7: Resolution Decision
**Actor:** FOUNDER_MODE

Select resolution based on:
1. Doctrine compliance (Alpmera errors favor user)
2. User harm severity (higher harm → stronger remedy)
3. Precedent safety (avoid harmful patterns)
4. Trust preservation (prioritize long-term trust)

**Resolution must include:**
- Specific action to be taken
- Timeline for action
- Communication to both parties
- Precedent guidance (is this a one-time exception?)

**Trust Model Check:** Decision must be explainable to both parties (No Asymmetry)

**Output:** Resolution decision document

### Step 8: Communication Preparation
**Actor:** FOUNDER_MODE with UX_TRUST_DESIGNER input

Prepare communications:

**To User:**
- What was decided
- Why (factual, not defensive)
- What happens next
- Timeline

**To Supplier:**
- What was decided
- Why (factual, not accusatory)
- What happens next
- Timeline

**Trust Model Check:** No Asymmetry — both parties receive consistent information

**Output:** Communication drafts

### Step 9: Execution
**Actor:** FOUNDER_MODE coordinates

Execute resolution:
- [ ] ESCROW_FINANCIAL_AUDITOR executes fund movement (if applicable)
- [ ] Communications sent to both parties
- [ ] Resolution logged in system
- [ ] Postmortem triggered (if systemic issue identified)

**Trust Model Check:** No Silent Transitions — execution must be documented

**Output:** Execution confirmation

---

## Required Output

Every dispute resolution must produce:

| Element | Content |
|---------|---------|
| **1. Dispute Summary** | Classification and facts |
| **2. Doctrine Compliance Assessment** | Did Alpmera follow rules? |
| **3. Resolution Decision** | What action is taken |
| **4. Precedent Guidance** | Is this repeatable or exceptional? |
| **5. Communication Record** | What was told to each party |

---

## Output Format

```markdown
## Dispute Resolution: [Dispute ID]

### Classification
- Type: [Type]
- Parties: [User] vs [Supplier/Alpmera]
- Campaign: [Campaign ID]

### Fact Summary
[Objective timeline and facts]

### Doctrine Compliance
- Alpmera Compliance: Compliant / Non-Compliant
- Violations (if any): [List]

### User Harm
| Harm | Severity | Reversible |
|------|----------|------------|

### Resolution
- Decision: [Specific action]
- Rationale: [Why]
- Timeline: [When]
- Precedent: Repeatable / One-time exception

### Communications
- User notified: [Date/Time]
- Supplier notified: [Date/Time]

### Execution
- Fund movement: [If applicable]
- Status: Complete / Pending
```

---

## Completion Criteria

This task is complete when:
- [ ] Dispute is classified
- [ ] Facts are gathered from all parties
- [ ] Doctrine compliance is assessed
- [ ] User harm is evaluated
- [ ] Resolution is decided
- [ ] Precedent is evaluated
- [ ] Communications are sent
- [ ] Resolution is executed
- [ ] Documentation is complete

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] Dispute status visible to all parties (No Silent Transitions)
- [ ] Resolution does not create entitlements (No Implicit Guarantees)
- [ ] Both parties received same information (No Asymmetry)
- [ ] User harm given full weight (No Optimism Bias)
- [ ] Resolution does not create future trust debt (Trust Debt Rule)

---

## Escalation

This task is already at FOUNDER_MODE level. If resolution requires:
- Legal consultation → Invoke LEGAL_ESCALATION protocol
- Policy change → Document and implement via Canon update process

---

## Handoff

On completion:
- Resolution logged for precedent reference
- If systemic issue identified → trigger postmortem_campaign task
- If policy gap identified → document for Canon update
- If abuse confirmed → RISK_ABUSE_ANALYST updates patterns
