# Refund and Release Playbook

**Canon Layer:** Playbook  
**Trust Model Compliance:** Mandatory  
**Parent Documents:** Constitution, Trust Model, Core Doctrine

---

## Purpose

This playbook governs escrow refund and release behavior.

---

## Scope

Applies to all escrow fund movements.

---

## Trust Model Integration

This playbook enforces the following Trust Model commitments:

| Trust Model Principle | Application in This Playbook |
|-----------------------|------------------------------|
| No Silent Transitions | All fund movements must be visible and logged |
| No Implicit Guarantees | Release conditions must be explicit, not assumed |
| No Asymmetry | Users see the same fund status as internal systems |
| No Optimism Bias | Refund/release timing must be realistic, not best-case |
| Trust Debt Rule | Delayed or unclear fund movements create trust debt |

Money movement is the highest-trust operation in Alpmera. Per the Core Doctrine's Explainability Rule, every money change must be explainable to a non-expert user.

---

## Refund Conditions

Refunds must occur when:

| Condition | Trust Model Basis |
|-----------|-------------------|
| Campaign fails | No Silent Transitions — failure triggers refund state |
| User exits under allowed conditions | No Asymmetry — exit rules apply as documented |
| Acceptance does not occur within defined time | No Implicit Guarantees — timeline was conditional |

Refunds are not discretionary. When conditions are met, refund is mandatory.

---

## Release Conditions

Funds may be released **only** when:

| Condition | Trust Model Basis |
|-----------|-------------------|
| Supplier has accepted the campaign | Core Doctrine: Escrow Centrality |
| Release conditions are met | No Implicit Guarantees — conditions were explicit |
| Users have been informed | No Silent Transitions — state change must be visible |

Release is a terminal state. It is irreversible. Per the Trust Model's **No Optimism Bias** principle, release must never occur based on assumed future fulfillment.

---

## Explainability Rule

Every refund or release must be explainable in plain language.

Per the Core Doctrine:
> If an action requires legal, financial, or technical expertise to understand, it is not allowed.

The user must be able to answer:
- Why did my funds move?
- Where did they go?
- What triggered this?

If any of these answers require expertise, the fund movement is invalid.

---

## Partial Refund Rule

Partial refunds are complex and high-risk for trust debt. They require:

| Requirement | Trust Model Basis |
|-------------|-------------------|
| Clear reasoning | No Silent Transitions — user knows why |
| Transparent calculation | No Asymmetry — user sees the math |
| User-visible explanation | Explainability Rule |

Per the Trust Debt Rule, partial refunds that assume user forgiveness are prohibited. The user must understand and accept the partial amount before it is processed.

---

## Timing Rules

| Rule | Trust Model Basis |
|------|-------------------|
| Refunds must not be delayed without cause | Trust Debt Rule — delay assumes forgiveness |
| Administrative convenience is not valid cause | No Asymmetry — internal constraints don't burden users |
| Realistic timing must be communicated | No Optimism Bias — no best-case-only estimates |

### Prohibited Delay Justifications

The following are **not** valid reasons to delay refunds:

- Batch processing schedules (internal convenience)
- Supplier negotiation (user is not party to this)
- "We're looking into it" (silent transition)
- Awaiting unlikely recovery (optimism bias)

---

## Trust Model Enforcement Checklist

Before processing any fund movement, confirm:

- [ ] Movement is logged and visible to user (No Silent Transitions)
- [ ] Conditions were explicit and are now met (No Implicit Guarantees)
- [ ] User sees the same fund status as internal systems (No Asymmetry)
- [ ] Timing estimate is realistic, not best-case (No Optimism Bias)
- [ ] No delay assumes user forgiveness (Trust Debt Rule)
- [ ] Movement is explainable to a non-expert (Explainability Rule)

---

## Enforcement

Any ambiguous or delayed fund movement invalidates the campaign.

Per the Trust Model, unclear money flow is a system defect. Per the Trust Debt Rule, delayed or hidden fund movements are critical system failures.

Fund movement errors trigger immediate escalation to the Founder.
