# Task: Stress-Test UI Copy

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Language Law, Role Authority Matrix

---

## Purpose

Evaluate user-facing copy for trust risk and misinterpretation, ensuring compliance with Language Law and preventing trust debt from confusing UX.

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| UX_TRUST_DESIGNER | **Primary** | Copy evaluation, confusion identification |
| OPS_FULFILLMENT_ARCHITECT | **Input** | Operational context for accuracy |
| ESCROW_FINANCIAL_AUDITOR | **Input** | Escrow explanation accuracy |

### Playbook Dependencies

| Playbook | Invocation |
|----------|------------|
| DELAY_COMMUNICATION | **Must consult** — delay messaging standards |
| FAILURE_HANDLING | **Must consult** — failure messaging standards |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | Copy must make all state changes visible to users |
| No Implicit Guarantees | Copy must not imply guarantees that don't exist |
| No Asymmetry | Copy must reflect true system state |
| No Optimism Bias | Copy must acknowledge failure possibilities |
| Trust Debt Rule | Confusing copy = trust debt; must not ship |

### Language Law Enforcement

| Rule | Application |
|------|-------------|
| Forbidden Verbs | buy, order, checkout, purchase, pay for, sell, deal, discount |
| Required Verbs | join, lock, accept, release, cancel, refund |
| Copy Integrity | User must not conclude "I just bought something" |

---

## Preconditions

- [ ] UX_TRUST_DESIGNER role activated
- [ ] Language Law loaded
- [ ] Constitution and Trust Model loaded
- [ ] Copy to evaluate is documented

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| UI copy text | Design/development | Evaluation target |
| Associated user flow | UX documentation | Context understanding |
| Campaign state context | System documentation | State accuracy |
| Escrow mechanics | ESCROW_FINANCIAL_AUDITOR | Financial accuracy |

---

## Execution Steps

### Step 1: Language Law Compliance Check
**Actor:** UX_TRUST_DESIGNER

Scan all copy for forbidden terms:

| Forbidden Term | Found? | Location | Replacement |
|----------------|--------|----------|-------------|
| buy | | | join |
| order | | | commitment |
| checkout | | | confirm commitment |
| purchase | | | join campaign |
| pay for | | | lock funds |
| sell | | | (remove or reframe) |
| deal | | | campaign |
| discount | | | (remove or reframe) |

**Trust Model Check:** Language violations are trust bugs (Trust Debt Rule)

**Output:** Language Law compliance report

**Gate:** If forbidden terms found, copy fails. Do not proceed to further evaluation until corrected.

### Step 2: First-Time User Simulation
**Actor:** UX_TRUST_DESIGNER

Read all copy as if you are a first-time user who:
- Has never used Alpmera
- Has no context about escrow or campaigns
- Expects typical e-commerce behavior

For each piece of copy, answer:

| Question | Yes/No | Evidence |
|----------|--------|----------|
| Could user believe they are buying something? | | |
| Could user expect immediate fulfillment? | | |
| Could user misunderstand escrow behavior? | | |
| Could user misinterpret failure conditions? | | |
| Could user misinterpret delay conditions? | | |

**Trust Model Check:** No Implicit Guarantees — any "yes" answer is a failure

**Output:** First-time user simulation report

### Step 3: Copy Integrity Test
**Actor:** UX_TRUST_DESIGNER

Apply the Copy Integrity Rule from Language Law:

> If a reasonable first-time user could conclude "I just bought something," the language is invalid.

Evaluate:
- Button text
- Confirmation messages
- Status indicators
- Email/notification copy
- Error messages

For each element:

| Element | Could Imply Purchase? | Correction Needed |
|---------|----------------------|-------------------|
| | | |

**Trust Model Check:** No Asymmetry — user understanding must match system reality

**Output:** Copy integrity assessment

### Step 4: State Visibility Verification
**Actor:** UX_TRUST_DESIGNER

Verify all state transitions are visible in copy:

| State Transition | User-Visible? | Copy That Explains |
|------------------|---------------|-------------------|
| Commitment created | | |
| Funds locked | | |
| Campaign aggregating | | |
| Campaign succeeded | | |
| Campaign failed | | |
| Supplier accepted | | |
| Fulfillment in progress | | |
| Funds released | | |
| Refund processed | | |

**Trust Model Check:** No Silent Transitions — all transitions must have visible copy

**Output:** State visibility report

### Step 5: Failure and Delay Messaging Evaluation
**Actor:** UX_TRUST_DESIGNER

Per DELAY_COMMUNICATION and FAILURE_HANDLING playbooks, evaluate:

**Delay Messaging:**
| Requirement | Met? | Evidence |
|-------------|------|----------|
| Delays communicated immediately | | |
| Messaging is explicit and factual | | |
| No optimistic framing | | |
| User options are clear | | |

**Failure Messaging:**
| Requirement | Met? | Evidence |
|-------------|------|----------|
| Failure explicitly declared | | |
| Not reframed as delay or success | | |
| Explanation understandable to non-experts | | |
| Refund path is clear | | |

**Trust Model Check:** No Optimism Bias — failure/delay must be acknowledged honestly

**Output:** Failure/delay messaging assessment

### Step 6: Confusion Risk Inventory
**Actor:** UX_TRUST_DESIGNER

Document all identified confusion risks:

| Risk | Scenario | User Harm | Severity |
|------|----------|-----------|----------|
| | | | Critical/High/Medium/Low |

**Trust Model Check:** Trust Debt Rule — any confusion risk is potential trust debt

**Output:** Confusion risk inventory

### Step 7: Correction Requirements
**Actor:** UX_TRUST_DESIGNER

For each identified issue, specify:

| Issue | Current Copy | Required Change | Trust Principle |
|-------|--------------|-----------------|-----------------|
| | | | |

**Output:** Correction requirements document

---

## Required Output

Every stress-test must produce:

| Element | Content |
|---------|---------|
| **1. Language Law Compliance** | Pass/Fail with specific violations |
| **2. Confusion Risks** | Identified scenarios where users could misunderstand |
| **3. Misinterpretation Scenarios** | Specific ways copy could mislead |
| **4. Required Changes** | Specific copy corrections |
| **5. Trust Impact Summary** | Assessment of trust debt risk |

---

## Output Format

```markdown
## UI Copy Stress-Test: [Flow/Feature Name]

### Language Law Compliance
- Status: PASS / FAIL
- Violations: [List or "None"]

### Confusion Risks
| Risk | Scenario | Severity |
|------|----------|----------|

### Misinterpretation Scenarios
| Current Copy | Misinterpretation | Correction |
|--------------|-------------------|------------|

### Required Changes
| Location | Current | Required | Rationale |
|----------|---------|----------|-----------|

### Trust Impact Summary
- Trust Debt Risk: High / Medium / Low / None
- Ship Decision: Approved / Blocked / Approved with Changes
```

---

## Completion Criteria

This task is complete when:
- [ ] Language Law compliance is verified
- [ ] First-time user simulation is complete
- [ ] Copy integrity test is complete
- [ ] State visibility is verified
- [ ] Failure/delay messaging is evaluated
- [ ] All confusion risks are documented
- [ ] Required changes are specified
- [ ] Ship decision is made

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] All state transitions have visible copy (No Silent Transitions)
- [ ] No copy implies non-existent guarantees (No Implicit Guarantees)
- [ ] User understanding matches system reality (No Asymmetry)
- [ ] Failure/delay possibilities acknowledged (No Optimism Bias)
- [ ] No confusing copy will ship (Trust Debt Rule)

---

## Ship Decision

| Decision | Criteria |
|----------|----------|
| **Approved** | No Language Law violations, no confusion risks |
| **Approved with Changes** | Minor issues, corrections specified and accepted |
| **Blocked** | Language Law violations OR high-severity confusion risks |

Copy that creates trust debt must not ship.

---

## Handoff

On Approved:
- Copy proceeds to implementation
- UX_TRUST_DESIGNER sign-off recorded

On Approved with Changes:
- Changes implemented
- Re-evaluation required before ship

On Blocked:
- Copy returned to author with correction requirements
- Full re-evaluation required after revision
