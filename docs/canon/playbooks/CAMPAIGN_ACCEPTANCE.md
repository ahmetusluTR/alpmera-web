# Campaign Acceptance Playbook

**Canon Layer:** Playbook  
**Trust Model Compliance:** Mandatory  
**Parent Documents:** Constitution, Trust Model

---

## Purpose

This playbook defines the standard procedure for accepting or rejecting campaigns.

---

## Scope

Applies to all supplier-proposed campaigns without exception.

---

## Trust Model Integration

This playbook enforces the following Trust Model commitments:

| Trust Model Principle | Application in This Playbook |
|-----------------------|------------------------------|
| No Silent Transitions | All acceptance decisions must be visible and logged |
| No Implicit Guarantees | Campaign parameters are conditional until formal acceptance |
| No Asymmetry | Acceptance criteria apply equally; no privileged supplier expectations |
| No Optimism Bias | Risk and failure modes must be evaluated, not assumed away |
| Trust Debt Rule | Campaigns that reduce clarity or hide risk must be rejected |

---

## Preconditions

Before evaluation:
- A supplier proposal exists
- Campaign parameters are defined
- Escrow mechanics are available

---

## Acceptance Procedure

Campaigns must be evaluated using the Marketplace Gatekeeper framework.

The following must be explicitly confirmed:

1. **Doctrine Fit** — Does the campaign align with Alpmera's identity as a trust-first demand aggregation clearing house?

2. **Risk Identification** — What are the identified risks and failure modes? *(Trust Model: No Optimism Bias — worst-case outcomes must be acknowledged)*

3. **Operability Clarity** — Can the campaign be operated without ambiguity? *(Trust Model: No Silent Transitions — all state changes must be explainable)*

4. **Precedent Impact** — Would this campaign create harmful patterns if repeated at scale?

---

## Allowed Outcomes

| Outcome | Definition |
|---------|------------|
| Accept | Campaign proceeds without modification |
| Accept with Constraints | Campaign proceeds with explicit, enforceable conditions |
| Defer | Decision delayed pending additional information |
| Reject | Campaign does not proceed |

No other outcomes are valid.

---

## Constraint Rule

Constraints must be:
- **Explicit** — Stated clearly in writing
- **Enforceable** — By system or operations, not trust
- **Visible** — To users when relevant *(Trust Model: No Asymmetry — users and suppliers share the same reality)*

Soft or trust-based constraints are invalid. A constraint that assumes supplier goodwill without enforcement creates trust debt.

---

## Rejection Rule

Campaigns must be rejected if:
- Doctrine is violated
- User harm is irreversible
- Operability is unclear *(Trust Model: No Silent Transitions)*
- Precedent risk is unacceptable
- The campaign would create trust debt *(Trust Model: Trust Debt Rule)*

---

## Trust Model Enforcement Checklist

Before finalizing any acceptance decision, confirm:

- [ ] Decision is logged and visible (No Silent Transitions)
- [ ] No implicit guarantees have been made to the supplier (No Implicit Guarantees)
- [ ] Supplier expectations match user-visible terms (No Asymmetry)
- [ ] Failure modes are documented, not assumed away (No Optimism Bias)
- [ ] The decision does not reduce clarity or hide risk (Trust Debt Rule)

---

## Enforcement

Campaigns may not proceed without a valid acceptance decision.

Acceptance decisions that violate the Trust Model are invalid and must be reversed.
