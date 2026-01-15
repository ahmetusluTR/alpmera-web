# Role Conflict, Overlap, and Gap Analysis

**Canon Layer:** Governance Analysis  
**Status:** Requires Resolution  
**Parent Documents:** Constitution, Role Authority Matrix

---

## Purpose

This document identifies:
- Overlaps between roles (potential conflict zones)
- Conflicts between role authorities (resolution required)
- Gaps in role coverage (unassigned responsibilities)

---

## Part 1: Overlaps

Overlaps are areas where multiple roles have authority over the same domain. Overlaps are not inherently problematic — they provide defense in depth. However, overlaps require clear precedence rules.

---

### Overlap 1: Campaign Gate Authority

**Affected Roles:**
- MARKETPLACE_GATEKEEPER (accept/reject authority)
- RISK_ABUSE_ANALYST (block authority)
- OPS_FULFILLMENT_ARCHITECT (operability block authority)
- ESCROW_FINANCIAL_AUDITOR (escrow block authority)

**Nature of Overlap:**
All four roles can block a campaign from proceeding. This is intentional — defense in depth.

**Precedence Rule (Proposed):**
```
Any role may BLOCK.
Only MARKETPLACE_GATEKEEPER may ACCEPT.
```

**Resolution:**
- MARKETPLACE_GATEKEEPER cannot accept if any blocking role objects
- Blocking roles have veto power but not acceptance power
- This is a feature, not a conflict

**Status:** ✅ Resolved by design

---

### Overlap 2: User-Facing Communication

**Affected Roles:**
- UX_TRUST_DESIGNER (copy clarity, Language Law)
- OPS_FULFILLMENT_ARCHITECT (delay communication ownership)

**Nature of Overlap:**
Both roles have authority over delay messaging. OPS defines triggers; UX defines language.

**Precedence Rule (Proposed):**
```
OPS_FULFILLMENT_ARCHITECT: Defines WHEN and WHAT to communicate
UX_TRUST_DESIGNER: Defines HOW to communicate (language, clarity)
```

**Resolution:**
- OPS owns content decisions (triggers, facts)
- UX owns presentation decisions (wording, clarity)
- Neither may ship without the other's approval

**Status:** ✅ Resolved by separation

---

### Overlap 3: Failure Handling

**Affected Roles:**
- OPS_FULFILLMENT_ARCHITECT (operational failure paths)
- ESCROW_FINANCIAL_AUDITOR (financial failure paths)
- UX_TRUST_DESIGNER (failure messaging)
- MARKETPLACE_GATEKEEPER (failure mode evaluation pre-acceptance)

**Nature of Overlap:**
Four roles touch failure handling with different concerns.

**Precedence Rule (Proposed):**
```
MARKETPLACE_GATEKEEPER: Pre-acceptance failure mode evaluation
OPS_FULFILLMENT_ARCHITECT: Operational failure recovery design
ESCROW_FINANCIAL_AUDITOR: Financial failure mechanics
UX_TRUST_DESIGNER: Failure communication to users
```

**Resolution:**
- Temporal separation: GATEKEEPER acts pre-acceptance; others act post-acceptance
- Domain separation: OPS handles operations; ESCROW handles money; UX handles messaging
- FAILURE_HANDLING playbook requires sign-off from OPS, ESCROW, and UX

**Status:** ✅ Resolved by domain separation

---

### Overlap 4: Precedent Authority

**Affected Roles:**
- MARKETPLACE_GATEKEEPER (precedent evaluation)
- FOUNDER_MODE (precedent policy)
- RISK_ABUSE_ANALYST (exploitation at scale)

**Nature of Overlap:**
All three evaluate whether a campaign creates harmful precedent.

**Precedence Rule (Proposed):**
```
RISK_ABUSE_ANALYST: Identifies precedent RISK (adversarial framing)
MARKETPLACE_GATEKEEPER: Evaluates precedent IMPACT (doctrine framing)
FOUNDER_MODE: Sets precedent POLICY (strategic framing)
```

**Resolution:**
- RISK provides input to GATEKEEPER
- GATEKEEPER makes recommendation
- Ambiguous cases escalate to FOUNDER

**Status:** ✅ Resolved by escalation chain

---

## Part 2: Conflicts

Conflicts are areas where role authorities directly contradict or where resolution order is unclear.

---

### Conflict 1: FOUNDER_MODE Override Scope

**Conflict Description:**
FOUNDER_MODE can "override role decisions when Constitution permits" — but the Constitution does not define when this is permitted.

**Roles Affected:**
- FOUNDER_MODE (override authority)
- All other roles (subject to override)

**Trust Model Violation Risk:**
- No Silent Transitions: Overrides must be documented
- No Asymmetry: Override criteria must be consistent

**Resolution Required:**
Define explicit override conditions in Constitution or FOUNDER_MODE role definition.

**Proposed Resolution:**
FOUNDER_MODE may override when:
1. Roles are in unresolvable conflict
2. Precedent risk exceeds role-level evaluation capacity
3. Decision is irreversible and time-constrained

FOUNDER_MODE may NOT override:
1. To bypass doctrine violations
2. For convenience or speed
3. Without documentation

**Status:** ⚠️ Requires ratification

---

### Conflict 2: CANON_ORCHESTRATOR Delegation Ambiguity

**Conflict Description:**
CANON_ORCHESTRATOR can be "temporarily delegated to Claude" but the scope of delegation is unclear. Can delegated orchestration invoke FOUNDER_MODE? Can it sequence blocking roles?

**Roles Affected:**
- CANON_ORCHESTRATOR (delegation rules)
- FOUNDER_MODE (escalation endpoint)
- All blocking roles

**Trust Model Violation Risk:**
- No Implicit Guarantees: Delegation scope must be explicit
- Trust Debt Rule: Ambiguous delegation = trust debt

**Resolution Required:**
Define explicit delegation boundaries.

**Proposed Resolution:**
Delegated orchestration may:
- Sequence non-blocking executable roles
- Invoke playbooks for non-escalated scenarios
- Produce execution prompts

Delegated orchestration may NOT:
- Invoke FOUNDER_MODE
- Override blocking role decisions
- Resolve Canon conflicts (must surface and halt)

**Status:** ⚠️ Requires ratification

---

### Conflict 3: QA_LEAD vs. IMPLEMENTER Boundary

**Conflict Description:**
QA_LEAD "defines acceptance criteria" but IMPLEMENTER "writes test code." Who owns test implementation for critical paths?

**Roles Affected:**
- QA_LEAD (test standards authority)
- IMPLEMENTER (test code authority)

**Trust Model Violation Risk:**
- No Asymmetry: Criteria and implementation must align

**Resolution Required:**
Clarify test ownership model.

**Proposed Resolution:**
```
QA_LEAD: Defines WHAT must be tested and acceptance criteria
IMPLEMENTER: Writes test code to QA_LEAD specifications
QA_LEAD: Approves test coverage before merge
```

**Status:** ⚠️ Requires ratification

---

## Part 3: Gaps

Gaps are responsibilities not clearly assigned to any role.

---

### Gap 1: User Communication (Non-Delay, Non-Failure)

**Gap Description:**
DELAY_COMMUNICATION and FAILURE_HANDLING playbooks exist, but there is no playbook or clear role ownership for:
- Routine status updates
- Campaign success communication
- General user notifications

**Affected Trust Principles:**
- No Silent Transitions: All state changes require communication
- No Asymmetry: Users must know what system knows

**Proposed Resolution:**
Create STATUS_COMMUNICATION playbook with:
- Primary owner: UX_TRUST_DESIGNER
- Operational input: OPS_FULFILLMENT_ARCHITECT

**Status:** 🔴 Gap — requires new playbook

---

### Gap 2: Supplier Communication

**Gap Description:**
SUPPLIER_ONBOARDING covers entry, but no role or playbook governs ongoing supplier communication (acceptance notifications, rejection explanations, performance feedback).

**Affected Trust Principles:**
- No Asymmetry: Suppliers must receive consistent information
- No Silent Transitions: Supplier state changes must be communicated

**Proposed Resolution:**
Create SUPPLIER_COMMUNICATION playbook with:
- Primary owner: MARKETPLACE_GATEKEEPER (acceptance/rejection)
- Secondary: OPS_FULFILLMENT_ARCHITECT (performance/fulfillment)

**Status:** 🔴 Gap — requires new playbook

---

### Gap 3: Dispute Resolution

**Gap Description:**
PRD mentions "Manual dispute handling" in Phase 0, but no role has explicit dispute authority and no DISPUTE_RESOLUTION playbook exists.

**Affected Trust Principles:**
- Honest handling of failure (Trust Creation Principle)
- No Silent Transitions: Dispute status must be visible

**Proposed Resolution:**
Create DISPUTE_RESOLUTION playbook with:
- Primary owner: FOUNDER_MODE (final authority)
- Input: ESCROW_FINANCIAL_AUDITOR (fund disposition)
- Input: RISK_ABUSE_ANALYST (abuse assessment)
- Input: OPS_FULFILLMENT_ARCHITECT (operational facts)

**Status:** 🔴 Gap — requires new playbook

---

### Gap 4: Post-Campaign Analysis

**Gap Description:**
No role owns retrospective analysis of completed campaigns. The Precedent Rule requires learning from campaigns, but no systematic process exists.

**Affected Trust Principles:**
- Precedent Rule: Every campaign sets precedent
- No Optimism Bias: Must learn from near-misses

**Proposed Resolution:**
Create CAMPAIGN_RETROSPECTIVE playbook with:
- Primary owner: MARKETPLACE_GATEKEEPER (precedent learning)
- Input: All roles that participated in campaign

**Status:** 🔴 Gap — requires new playbook

---

### Gap 5: Legal/Compliance Interface

**Gap Description:**
Multiple roles explicitly state what they are NOT (not a CPA, not a legal advisor, not compliance-only), but no role owns the interface to actual legal/compliance resources when needed.

**Affected Trust Principles:**
- Explainability Rule: Legal complexity may require expert input

**Proposed Resolution:**
Define LEGAL_ESCALATION protocol (not a role) that:
- Any role may invoke
- Halts decisions pending legal input
- Documents escalation and resolution

**Status:** 🟡 Gap — requires protocol, not role

---

## Part 4: Summary

### Overlaps (Defense in Depth — Resolved)

| Overlap | Resolution |
|---------|------------|
| Campaign Gate Authority | Any may block; only GATEKEEPER accepts |
| User-Facing Communication | OPS owns triggers; UX owns language |
| Failure Handling | Domain separation with playbook sign-off |
| Precedent Authority | Escalation chain to FOUNDER |

### Conflicts (Require Ratification)

| Conflict | Proposed Resolution | Status |
|----------|---------------------|--------|
| FOUNDER_MODE override scope | Define explicit conditions | ⚠️ Pending |
| CANON_ORCHESTRATOR delegation | Define delegation boundaries | ⚠️ Pending |
| QA_LEAD vs IMPLEMENTER boundary | Define test ownership model | ⚠️ Pending |

### Gaps (Require New Artifacts)

| Gap | Proposed Artifact | Status |
|-----|-------------------|--------|
| Non-delay/failure user communication | STATUS_COMMUNICATION playbook | 🔴 Missing |
| Supplier communication | SUPPLIER_COMMUNICATION playbook | 🔴 Missing |
| Dispute resolution | DISPUTE_RESOLUTION playbook | 🔴 Missing |
| Post-campaign analysis | CAMPAIGN_RETROSPECTIVE playbook | 🔴 Missing |
| Legal/compliance interface | LEGAL_ESCALATION protocol | 🟡 Missing |

---

## Recommended Actions

### Immediate (Before Phase 1)

1. Ratify FOUNDER_MODE override conditions
2. Ratify CANON_ORCHESTRATOR delegation boundaries
3. Ratify QA_LEAD / IMPLEMENTER test ownership
4. Create DISPUTE_RESOLUTION playbook (PRD mandates manual dispute handling)

### Near-Term (During Phase 1)

5. Create STATUS_COMMUNICATION playbook
6. Create SUPPLIER_COMMUNICATION playbook
7. Define LEGAL_ESCALATION protocol

### Post-Phase 1

8. Create CAMPAIGN_RETROSPECTIVE playbook

---

**End of Conflict, Overlap, and Gap Analysis**
