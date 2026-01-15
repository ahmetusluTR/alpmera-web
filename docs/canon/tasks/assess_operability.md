# Task: Assess Operability

**Canon Layer:** Task  
**Status:** Executable  
**Parent Documents:** Constitution, Trust Model, Role Authority Matrix

---

## Purpose

Assess whether a campaign can be fulfilled clearly, predictably, and recoverably before the campaign can proceed.

---

## Governance Mapping

### Role Assignment

| Role | Authority | Responsibility |
|------|-----------|----------------|
| OPS_FULFILLMENT_ARCHITECT | **Primary** | Operability assessment, approval/rejection |
| MARKETPLACE_GATEKEEPER | **Consumer** | Uses output for accept/reject decision |
| RISK_ABUSE_ANALYST | **Input** | Operational exploit scenarios |

### Playbook Dependencies

| Playbook | Invocation |
|----------|------------|
| CAMPAIGN_ACCEPTANCE | **Feeds into** — operability required for acceptance |
| DELAY_COMMUNICATION | **Must define** — delay triggers for this campaign |
| FAILURE_HANDLING | **Must define** — failure recovery paths |

### Trust Model Enforcement

| Principle | Application |
|-----------|-------------|
| No Silent Transitions | Fulfillment status must be trackable |
| No Implicit Guarantees | Timelines are conditional, not promised |
| No Asymmetry | Users know same fulfillment status as ops |
| No Optimism Bias | Assume delays happen; assume suppliers miss deadlines |
| Trust Debt Rule | Ops burden may not leak to users |

---

## Preconditions

- [ ] OPS_FULFILLMENT_ARCHITECT role activated
- [ ] Constitution and Trust Model loaded
- [ ] Campaign mechanics documented
- [ ] Supplier capabilities documented

---

## Required Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| Campaign parameters | Proposal | Scope understanding |
| Supplier capabilities | Supplier | Capacity verification |
| Fulfillment expectations | Proposal | Timeline assessment |
| Product/service details | Proposal | Complexity assessment |
| Geographic scope | Proposal | Logistics evaluation |

---

## Execution Steps

### Step 1: Fulfillment Ownership Definition
**Actor:** OPS_FULFILLMENT_ARCHITECT

Define clear ownership for each fulfillment phase:

| Phase | Owner | Backup | Escalation Path |
|-------|-------|--------|-----------------|
| Aggregation monitoring | | | |
| Acceptance coordination | | | |
| Supplier communication | | | |
| Delivery tracking | | | |
| Issue resolution | | | |

**Trust Model Check:** No Silent Transitions — every phase must have clear ownership

**Output:** Fulfillment ownership map

**Gate:** If any phase lacks clear owner, campaign is inoperable

### Step 2: Timeline Realism Assessment
**Actor:** OPS_FULFILLMENT_ARCHITECT

Evaluate proposed timelines assuming worst-case:

| Phase | Proposed Timeline | Realistic Timeline | Risk |
|-------|-------------------|-------------------|------|
| Aggregation period | | | |
| Acceptance window | | | |
| Production/fulfillment | | | |
| Delivery | | | |
| Total end-to-end | | | |

**Trust Model Check:** No Optimism Bias — assume suppliers miss deadlines

Apply the rule: If supplier says X days, plan for 1.5X days.

**Output:** Timeline assessment with buffer recommendations

### Step 3: Complexity Evaluation
**Actor:** OPS_FULFILLMENT_ARCHITECT

Assess operational complexity:

| Factor | Complexity | Mitigation |
|--------|------------|------------|
| Product type | Simple / Moderate / Complex | |
| Customization required | None / Limited / Extensive | |
| Geographic scope | Single region / Multi-region / International | |
| Regulatory requirements | None / Standard / Complex | |
| Supplier experience | Proven / Limited / First-time | |

**Trust Model Check:** No Optimism Bias — complex campaigns need more buffer

**Output:** Complexity assessment

### Step 4: Failure Path Definition
**Actor:** OPS_FULFILLMENT_ARCHITECT

Per FAILURE_HANDLING playbook, define all failure scenarios:

| Failure Scenario | Detection Method | Recovery Path | User Impact |
|------------------|------------------|---------------|-------------|
| Supplier misses deadline | | | |
| Partial fulfillment | | | |
| Quality issues | | | |
| Supplier communication failure | | | |
| Logistics failure | | | |
| Complete supplier failure | | | |

**Trust Model Check:** Trust Debt Rule — undefined failure paths = trust debt

**Output:** Failure path documentation

**Gate:** Every failure scenario must have a defined recovery path

### Step 5: Delay Trigger Definition
**Actor:** OPS_FULFILLMENT_ARCHITECT

Per DELAY_COMMUNICATION playbook, define delay triggers:

| Trigger | Detection Point | Communication Timing | User Options |
|---------|-----------------|---------------------|--------------|
| Aggregation extension | | | |
| Acceptance delay | | | |
| Production delay | | | |
| Shipping delay | | | |

**Trust Model Check:** No Silent Transitions — all delays must trigger communication

**Output:** Delay trigger specification

### Step 6: Manual Heroics Assessment
**Actor:** OPS_FULFILLMENT_ARCHITECT

Identify any operations that depend on exceptional effort:

| Operation | Depends on Heroics? | Sustainable Alternative |
|-----------|---------------------|------------------------|
| | | |

Per OPS_FULFILLMENT_ARCHITECT role definition:
> Manual heroics are not acceptable.

**Trust Model Check:** Trust Debt Rule — heroics-dependent operations = trust debt

**Output:** Heroics assessment

**Gate:** If any operation depends on heroics without sustainable alternative, campaign is inoperable

### Step 7: Operational Red Flags
**Actor:** OPS_FULFILLMENT_ARCHITECT

Identify operational concerns:

| Red Flag | Severity | Mitigation | Acceptable? |
|----------|----------|------------|-------------|
| Undefined ownership | Critical | | |
| Timeline optimism | High | | |
| Ops burden on users | Critical | | |
| Single point of failure | High | | |
| No backup supplier | Medium | | |

**Output:** Red flag inventory

### Step 8: Final Determination
**Actor:** OPS_FULFILLMENT_ARCHITECT

Based on all assessments:

| Determination | Criteria |
|---------------|----------|
| **Operable** | Clear ownership, realistic timelines, defined failure paths |
| **Operable with Conditions** | Acceptable with specified constraints |
| **Inoperable** | Unclear ownership, unrealistic timelines, or undefined failures |

---

## Required Output

Every assessment must produce:

| Element | Content |
|---------|---------|
| **1. Fulfillment Model** | Ownership map and process flow |
| **2. Timeline Risks** | Realistic vs. proposed with buffers |
| **3. Failure Handling Strategy** | All scenarios with recovery paths |
| **4. Operational Red Flags** | Concerns and mitigations |
| **5. Determination** | Operable / Operable with Conditions / Inoperable |

---

## Output Format

```markdown
## Operability Assessment: [Campaign Name]

### Fulfillment Model
| Phase | Owner | Process |
|-------|-------|---------|

### Timeline Assessment
| Phase | Proposed | Realistic | Buffer |
|-------|----------|-----------|--------|

### Failure Handling
| Scenario | Detection | Recovery | User Impact |
|----------|-----------|----------|-------------|

### Delay Triggers
| Trigger | Detection | Communication | Options |
|---------|-----------|---------------|---------|

### Red Flags
| Flag | Severity | Mitigation | Status |
|------|----------|------------|--------|

### Determination
- Status: Operable / Operable with Conditions / Inoperable
- Conditions (if applicable): [List]
- Rationale: [Why this assessment]
```

---

## Completion Criteria

This task is complete when:
- [ ] Fulfillment ownership is defined
- [ ] Timelines are realistically assessed
- [ ] Complexity is evaluated
- [ ] All failure paths are defined
- [ ] Delay triggers are specified
- [ ] Heroics dependency is assessed
- [ ] Red flags are documented
- [ ] Final determination is recorded

---

## Trust Model Enforcement Checklist

Before marking complete:
- [ ] All phases have clear ownership (No Silent Transitions)
- [ ] Timelines are conditional, not promised (No Implicit Guarantees)
- [ ] User will know fulfillment status (No Asymmetry)
- [ ] Worst-case timelines are planned (No Optimism Bias)
- [ ] No ops burden leaks to users (Trust Debt Rule)

---

## Handoff

On Operable:
- MARKETPLACE_GATEKEEPER may proceed with campaign acceptance
- Delay triggers documented for UX_TRUST_DESIGNER
- Failure paths documented for operational use

On Operable with Conditions:
- Conditions must be implemented before campaign launch
- Re-assessment required after implementation

On Inoperable:
- Campaign cannot proceed
- Specific failures documented for redesign
