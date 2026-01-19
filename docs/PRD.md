# ALPMERA

## PHASE 0–1 PRODUCT REQUIREMENTS DOCUMENT (PRD – REVISED)

**Status:** Canonical
**Owner:** Architect & Execution Brain
**Audience:** Engineering, Product, Risk, Legal, Operations
**Scope:** Phase 0 (Foundations) + Phase 1 (Controlled Launch)

---

## 1. EXECUTIVE INTENT

Alpmera is a **structured collective buying operator** that transforms dispersed individual intent into coordinated purchasing outcomes — responsibly and predictably.

In Phase 0–1, Alpmera is **not a marketplace, not a connector, and not a broker.**

It is an organization that:

* designs campaigns
* collects and manages funds
* purchases directly from suppliers
* manages fulfillment
* issues refunds when campaigns fail

This document defines:

* the **minimum system required to earn trust**
* the **constraints that protect users and Alpmera**
* the **conditions under which Alpmera deserves to continue**

This is not a growth document.
It is a **credibility and operational discipline document.**

> **Trust before price.
> Rules before growth.
> Completion before scale.**

---

## 2. DOCTRINE & NON-NEGOTIABLE PRINCIPLES

### 2.1 What Alpmera Is (Phase 1–2 Reality)

Alpmera is:

* an **end-to-end controlled collective buying OPERATOR**
* the **owner of campaigns**
* the **collector of funds**
* the **purchasing and logistics coordinator**
* the **issuer of refunds**

Alpmera does not merely organize intent.
Alpmera **executes outcomes.**

---

### 2.2 What Alpmera Is Not

Alpmera is not:

* a marketplace
* a reseller marketplace
* a listing platform
* a negotiation venue
* a discount engine
* a deal site
* a peer-to-peer system

If any design decision implies these, it is misaligned.

---

### 2.3 Trust Doctrine (Operational Form)

* Trust is finite and fragile
* One ambiguous failure outweighs many successes
* Any unclear money flow is a system defect

Alpmera favors:

* restraint over persuasion
* process over promises
* clarity over excitement

---

## 3. TARGET USER & PROBLEM

### 3.1 Primary User

* U.S.-based professionals
* Comfortable committing **$500–$3,000**
* Skeptical of retail pricing games
* Willing to wait when rules are explicit
* Values process clarity over hype

They are not bargain hunters.
They are people who value **structured outcomes.**

---

### 3.2 Problem Alpmera Solves

Individuals lack a **credible mechanism** to achieve manufacturer-level outcomes without:

* opaque intermediaries
* unclear fund handling
* unreliable fulfillment
* chaotic coordination

Alpmera provides structure where:

* participation creates leverage
* rules enforce discipline
* responsibility is centralized
* outcomes are predictable

---

## 4. PHASE 0 — FOUNDATIONS

### 4.1 Purpose

Phase 0 exists to validate three truths:

1. Users understand and accept commitment-based participation
2. Suppliers respect explicit acceptance rules
3. Failures can be handled without trust erosion

If any of these fail, Alpmera stops.

---

### 4.2 Explicit Non-Goals

Phase 0 does **not** optimize for:

* scale
* automation
* virality
* engagement mechanics
* rapid growth

This phase proves **worthiness**, not momentum.

---

### 4.3 System Boundaries

**Included**

* Admin-created campaigns
* User participation commitments
* Fund collection, release, and refund
* Manual supplier coordination
* Manual dispute handling

**Excluded**

* Supplier self-service
* Public campaign discovery
* Automated payouts
* Growth features
* Referral systems

---

### 4.4 Campaign State Machine (Immutable)

```
DESIGN → AGGREGATION → SUCCESS → PROCUREMENT → FULFILLMENT → COMPLETED
            ↓
          FAILED
```

* No state skips
* All transitions logged
* All outcomes auditable

**No Silent Transitions. Ever.**

---

### 4.5 Money Flow (Protocol Level)

* Funds are collected at participation
* Funds are held by Alpmera
* Suppliers are paid only after success
* Refunds issued automatically on failure

**No third-party escrow is used in Phase 0–1.**
Money handling is treated as **core infrastructure**, not a feature.

---

### 4.6 Supplier Rules

* Suppliers do not create campaigns
* Alpmera initiates campaigns
* Suppliers respond to verified demand
* Acceptance is explicit and binding
* Performance history is recorded

Suppliers are partners in execution, not platform owners.

---

### 4.7 Transparency With Guardrails

**Visible to Users**

* Campaign rules
* Responsibilities
* Status progression
* Refund guarantees
* Outcome explanations

**Never Exposed**

* Supplier pricing tiers
* Alpmera margins
* Internal costs
* Total funds collected
* Per-campaign economics

**Competitive Safety Rule**

No UX or copy may allow competitors to reverse-engineer Alpmera’s unit economics.

---

### 4.8 Phase 0 Stop Conditions

Alpmera halts if any occur:

* Refunds fail or delay
* Supplier breaches after acceptance
* Money flow becomes unclear
* Users misunderstand core process
* Trust ambiguity emerges

There is no iteration through trust loss.

---

## 5. PHASE 1 — CONTROLLED OPERATION

### 5.1 Purpose

Phase 1 validates:

* repeatable execution
* operational discipline
* trust preservation under light scale

---

### 5.2 Core Journey

1. Doctrine-first landing
2. Campaign explanation
3. Participation decision
4. Commitment confirmation
5. Outcome resolution
6. Transparent closure

Users join campaigns Alpmera runs — nothing more, nothing less.

---

### 5.3 UX Philosophy

* Calm, restrained design
* Minimal options
* Clear responsibilities
* Rules before buttons

The interface must feel:

> **confident and accountable — not persuasive.**

---

### 5.4 Language Doctrine (Mandatory)

**Required Terms**

* join
* participate
* commit
* campaign
* fulfill
* refund

**Forbidden Terms**

* buy
* order
* checkout
* purchase
* sell
* deal
* discount
* marketplace

**Copy Integrity Test**

If a reasonable first-time user could think “I just bought something,” the language is invalid.

---

### 5.5 Admin Authority

Admins may:

* pause campaigns
* cancel campaigns
* issue refunds
* annotate decisions
* manage supplier coordination

Admin power exists to **protect trust**, not optimize revenue.

---

### 5.6 Metrics That Matter

**North Star**

* Campaigns completed correctly

**Supporting**

* Refund execution time
* Supplier reliability
* Post-resolution user confidence
* Support ticket resolution quality

**Ignored in Phase 1**

* GMV
* DAU
* raw conversion rates
* growth vanity metrics

---

## 6. FAILURE CONTAINMENT

* Campaigns are isolated
* No shared user balances
* Supplier failures quarantined
* Communication procedural and factual

Failure handling must strengthen trust, not test it.

---

## 7. EXIT CONDITIONS (PHASE 1)

Phase 1 ends only when:

* multiple campaigns complete cleanly
* at least one failure handled correctly
* users express confidence after resolution
* suppliers respect acceptance consequences
* operations remain predictable

Only after these are true may any scaling be discussed.

---

## 8. COMPETITIVE SAFETY REQUIREMENTS

All product design must ensure:

* No exposure of internal economics
* No display of total funds collected
* No price comparison logic
* No supplier tier visibility
* No margin inference

Transparency is limited to:

* process
* status
* responsibilities
* outcomes

Economics remain intentionally opaque.

---

## 9. FINAL NOTE

Alpmera is not fast.
It is not loud.
It is not everywhere.

It is **deliberate and responsible.**

> **Alpmera exists for people who understand that collective power
> is not negotiated — it is organized and executed.**

---

**End of PRD – Phase 1–2 Operator Edition**

