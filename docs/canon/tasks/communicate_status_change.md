# Task: Communicate Status Change

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Language Law, Role Authority Matrix

---

## Purpose

Communicate a campaign status change to users, ensuring visibility of all state transitions per the Trust Model's "No Silent Transitions" principle. This task fills the gap between DELAY_COMMUNICATION and FAILURE_HANDLING for routine status updates.

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| UX_TRUST_DESIGNER | **Primary** | Communication design and approval |
| OPS_FULFILLMENT_ARCHITECT | **Input** | Operational context and triggers |
| ESCROW_FINANCIAL_AUDITOR | **Input** | Fund state context (if applicable) |

### Playbook Dependencies

| Playbook | Invocation |
|----------|------------|
| DELAY_COMMUNICATION | **Invoke if** — status change involves delay |
| FAILURE_HANDLING | **Invoke if** — status change is failure |
| REFUND_RELEASE | **Consult if** — status affects funds |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | Every status change must be communicated |
| No Implicit Guarantees | Status updates must not imply new guarantees |
| No Asymmetry | Users receive same information as internal systems |
| No Optimism Bias | Uncertain outcomes must be acknowledged |
| Trust Debt Rule | Delayed or unclear communication = trust debt |

---

## Preconditions

- [ ] UX_TRUST_DESIGNER role activated
- [ ] Language Law loaded
- [ ] Status change has occurred or is imminent
- [ ] Communication channel is available

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| Previous status | System | What user knew before |
| New status | System | What user needs to know |
| Transition trigger | OPS_FULFILLMENT_ARCHITECT | Why change occurred |
| User options (if any) | Business rules | What user can do |
| Fund impact (if any) | ESCROW_FINANCIAL_AUDITOR | Financial implications |

---

## Execution Steps

### Step 1: Status Change Classification
**Actor:** UX_TRUST_DESIGNER

Classify the status change:

| Type | Definition | Playbook Required |
|------|------------|-------------------|
| Progression | Normal forward movement | None (this task) |
| Delay | Timeline deviation | DELAY_COMMUNICATION |
| Failure | Campaign cannot proceed | FAILURE_HANDLING |
| Success milestone | Target or condition met | None (this task) |
| Fund movement | Lock/release/refund | REFUND_RELEASE |

**Gate:** If Delay or Failure, hand off to appropriate playbook

**Output:** Status change classification

### Step 2: Language Law Compliance
**Actor:** UX_TRUST_DESIGNER

Verify communication uses correct terminology:

| Check | Status |
|-------|--------|
| No forbidden verbs (buy, order, checkout, purchase, etc.) | |
| Uses required verbs (join, lock, accept, release, etc.) | |
| Does not imply purchase completed | |
| Does not imply immediate fulfillment | |

**Trust Model Check:** Language violations are trust bugs (Trust Debt Rule)

**Output:** Language compliance verification

### Step 3: Communication Content Design
**Actor:** UX_TRUST_DESIGNER

Design communication with required elements:

| Element | Content | Trust Model Check |
|---------|---------|-------------------|
| **What changed** | [Previous → New status] | No Silent Transitions |
| **Why it changed** | [Trigger explanation] | No Asymmetry |
| **What happens next** | [Next expected event] | No Implicit Guarantees |
| **User options** | [Actions available] | No Asymmetry |
| **Timeline** | [If applicable, conditional] | No Optimism Bias |

**Trust Model Check:** Communication must not assume user remembers previous state

**Output:** Communication content draft

### Step 4: Uncertainty Acknowledgment
**Actor:** UX_TRUST_DESIGNER

If any uncertainty exists:

| Uncertain Element | How Acknowledged |
|-------------------|------------------|
| Timeline | "Expected by [date], subject to [condition]" |
| Outcome | "Pending [event], possible outcomes include..." |
| Next steps | "We will update you when [trigger]" |

**Trust Model Check:** No Optimism Bias — uncertainty must be explicit

**Output:** Uncertainty acknowledgment verification

### Step 5: Consistency Check
**Actor:** UX_TRUST_DESIGNER

Verify communication is consistent with:
- Previous communications to this user
- Communications to other users in same campaign
- Public campaign information
- Internal system state

**Trust Model Check:** No Asymmetry — no user should have different information

**Output:** Consistency verification

### Step 6: Review and Approval
**Actor:** UX_TRUST_DESIGNER

Final review checklist:

| Check | Pass |
|-------|------|
| Language Law compliant | |
| All required elements present | |
| Uncertainty acknowledged | |
| Consistent with prior communications | |
| Would not confuse first-time user | |
| Does not create implicit guarantees | |

**Output:** Approval or revision requirements

### Step 7: Distribution
**Actor:** UX_TRUST_DESIGNER coordinates

Send communication via appropriate channel:
- [ ] In-app notification
- [ ] Email (if applicable)
- [ ] Status page update (if applicable)

**Trust Model Check:** No Silent Transitions — communication must reach user

**Output:** Distribution confirmation

### Step 8: Documentation
**Actor:** UX_TRUST_DESIGNER

Record communication:
- Timestamp
- Content sent
- Recipients
- Channel used

**Output:** Communication log entry

---

## Required Output

Every status communication must produce:

| Element | Content |
|---------|---------|
| **1. Status Change Summary** | What changed and why |
| **2. Communication Content** | Exact text sent |
| **3. Distribution Record** | When, to whom, via what channel |
| **4. Compliance Verification** | Language Law and Trust Model checks |

---

## Output Format

```markdown
## Status Communication: [Campaign ID] - [Change Type]

### Status Change
- Previous: [Status]
- New: [Status]
- Trigger: [Why]

### Communication Sent
```
[Exact text of communication]
```

### Distribution
- Channel: [In-app / Email / etc.]
- Recipients: [Count or list]
- Timestamp: [When]

### Compliance
- Language Law: Compliant
- Trust Model: Compliant
```

---

## Communication Templates

### Progression: Aggregation → Success

```
Your campaign has reached its target.

What changed: The campaign "[Name]" has met its commitment target.

What happens next: We are now awaiting supplier acceptance. You will be notified when the supplier responds.

Your funds: Your [amount] remains locked in escrow. No action is required from you.

Timeline: Supplier acceptance is expected within [X days]. We will notify you of the outcome.
```

### Progression: Success → Fulfillment

```
Supplier has accepted your campaign.

What changed: The supplier has accepted the campaign "[Name]" and will begin fulfillment.

What happens next: The supplier will prepare and ship your [product/service]. You will receive tracking information when available.

Your funds: Your [amount] remains locked in escrow until fulfillment is confirmed.

Expected delivery: [Conditional timeline]
```

### Progression: Fulfillment → Released

```
Your campaign is complete.

What changed: Fulfillment has been confirmed for campaign "[Name]".

What happened: Your funds have been released to the supplier.

Thank you for participating. If you have any issues with your [product/service], please contact support within [X days].
```

---

## Completion Criteria

This task is complete when:
- [ ] Status change is classified
- [ ] Language Law compliance is verified
- [ ] Communication content is designed
- [ ] Uncertainty is acknowledged
- [ ] Consistency is verified
- [ ] Communication is approved
- [ ] Communication is distributed
- [ ] Communication is documented

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] Status change is communicated, not silent (No Silent Transitions)
- [ ] No new guarantees implied (No Implicit Guarantees)
- [ ] User has same information as system (No Asymmetry)
- [ ] Uncertainty is explicit (No Optimism Bias)
- [ ] Communication is timely (Trust Debt Rule)

---

## Handoff

On completion:
- Communication logged for audit trail
- If user responds with questions → support process
- If user disputes → trigger resolve_dispute task
