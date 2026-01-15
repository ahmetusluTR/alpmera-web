# Campaign Failure Handling Playbook

**Canon Layer:** Playbook  
**Trust Model Compliance:** Mandatory  
**Parent Documents:** Constitution, Trust Model

---

## Purpose

This playbook defines how campaign failures are handled.

---

## Scope

Applies to all campaign failures, partial or full.

---

## Trust Model Integration

This playbook enforces the following Trust Model commitments:

| Trust Model Principle | Application in This Playbook |
|-----------------------|------------------------------|
| No Silent Transitions | Failure must be explicitly declared as a state change |
| No Implicit Guarantees | Failure messaging must not imply future recovery |
| No Asymmetry | Users receive the same failure information as suppliers |
| No Optimism Bias | Failure must not be reframed as delay or partial success |
| Trust Debt Rule | Minimizing failure or assuming forgiveness creates trust debt |

Failure handling is where the Trust Model is most tested. The Trust Creation Principle states that trust is created through **honest handling of failure**. This playbook operationalizes that principle.

---

## Failure Definition

A failure occurs when a campaign cannot proceed as explained.

Per the Trust Model's **No Silent Transitions** principle, failure is a first-class state transition. It must be:
- Explicitly declared
- Logged in the audit trail
- Communicated to all affected parties

---

## Failure Disclosure Rules

| Rule | Trust Model Basis |
|------|-------------------|
| Failure must be explicitly declared | No Silent Transitions |
| Failure must not be reframed as delay or success | No Optimism Bias |
| Failure explanation must be understandable to non-experts | Trust Creation: Predictable behavior requires clarity |

### Prohibited Reframings

The following reframings violate **No Optimism Bias** and create trust debt:

- "Delayed indefinitely" → Must say "Failed"
- "Partially successful" (when core promise unmet) → Must say "Failed"
- "We're working on it" (when resolution is uncertain) → Must acknowledge failure state

---

## User Protection Rules

When failure occurs:

| Protection | Trust Model Basis |
|------------|-------------------|
| Escrow funds must not be misused | Core Doctrine: Escrow Centrality |
| Refund paths must be clear | No Silent Transitions |
| Users must not bear operational burden | No Asymmetry — users don't absorb internal failures |

Per the **No Asymmetry** rule, the operational cost of failure is Alpmera's responsibility, not the user's.

---

## Partial Failure Rule

Partial fulfillment is a complex state that risks trust debt. It requires:

| Requirement | Trust Model Basis |
|-------------|-------------------|
| Explicit user consent | No Silent Transitions — user must acknowledge new state |
| Clear refund mechanics | No Implicit Guarantees — partial refund terms must be explicit |
| Clear explanation of remaining obligations | No Asymmetry — user knows what Alpmera knows |

Partial failure defaults to full failure unless the user explicitly opts into partial fulfillment.

---

## Language Rules

| Prohibited | Required | Trust Model Basis |
|------------|----------|-------------------|
| Minimization ("minor issue") | Factual severity | Trust Debt Rule |
| Retrospective justification | Forward-looking options | Honest handling of failure |
| Blame shifting | Ownership of outcome | No Asymmetry |
| Optimistic hedging ("should be fine") | Explicit uncertainty | No Optimism Bias |

---

## Trust Model Enforcement Checklist

Before finalizing any failure handling, confirm:

- [ ] Failure is explicitly declared, not reframed (No Silent Transitions)
- [ ] Messaging does not imply recovery that isn't certain (No Implicit Guarantees)
- [ ] Users receive the same information as internal teams and suppliers (No Asymmetry)
- [ ] Worst-case is acknowledged; best-case framing is not used alone (No Optimism Bias)
- [ ] Language does not minimize, hide risk, or assume forgiveness (Trust Debt Rule)
- [ ] Failure handling demonstrates honest handling of failure (Trust Creation Principle)

---

## Enforcement

Failure mishandling is treated as a critical trust breach.

Per the Trust Model, trust debt is a critical system failure. Mishandled failures trigger immediate escalation to the Founder.
