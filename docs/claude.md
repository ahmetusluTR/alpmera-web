Below is a **clean, tightened rewrite of `CLAUDE.md`** that:

* Preserves everything that matters
* Removes redundancy
* Strengthens enforcement language
* Aligns explicitly with your **versioned-templates decision**
* Is easier for Claude/Copilot to follow without “creative drift”

You can **replace your existing file entirely** with this version.

---

# CLAUDE.md — AI ASSISTANT GOVERNANCE CONTRACT

**Phase 1–2 (Operator Model)**

---

## 0. CANON AUTHORITY NOTICE (READ FIRST)

This repository operates under a **formal Canon System** located at:

```
docs/canon/
```

Start here: `docs/README_CANON.md` (Canon index and navigation).

**Canon is supreme.**
This document is **SUBORDINATE** and **CANNOT override Canon**.

### Canon Hierarchy (Binding)

| Layer          | Documents                              | Authority             |
| -------------- | -------------------------------------- | --------------------- |
| Constitution   | `CONSTITUTION.md`                      | Immutable             |
| Git Governance | `GIT-GOVERNANCE.md`                    | Mandatory             |
| Roles          | `ROLE_AUTHORITY_MATRIX.md`, role files | Authority boundaries  |
| Playbooks      | `CAMPAIGN_ACCEPTANCE.md`, etc.         | Process law           |
| Tasks          | `TASK_REGISTRY.md`, task files         | Executable work       |
| This Document  | `CLAUDE.md`                            | AI execution guidance |
| Convenience    | Notes, comments                        | Non-authoritative     |

**Resolution Order:**
Constitution → Git Governance → Role → Playbook → Task → This Document → Convenience

If any instruction conflicts with Canon:

1. **Canon wins**
2. **Surface the conflict explicitly**
3. **Do not bypass silently**

---

## 1. WHAT THIS DOCUMENT IS (AND IS NOT)

### This document IS:

* An **AI execution contract**
* Context for **Phase 1–2 operation**
* A guardrail against Canon drift
* A pointer to authoritative documents

### This document IS NOT:

* Permission to bypass Canon
* A substitute for reading Canon
* Authority to change doctrine
* Approval for forbidden language

---

## 2. ALPMERA — PHASE 1–2 OPERATIONAL TRUTH

### Authoritative Definition

> **Alpmera is an end-to-end controlled collective buying OPERATOR.**

This is immutable for Phase 1–2.

### Alpmera IS / IS NOT

| Alpmera IS              | Alpmera IS NOT        |
| ----------------------- | --------------------- |
| Campaign operator       | Marketplace           |
| Owner of campaigns      | Connector             |
| Holder of funds         | Peer-to-peer platform |
| Fulfillment coordinator | Deal site             |
| Issuer of refunds       | Retailer              |

### Operating Flow (Phase 1–2)

```
1. Alpmera designs campaigns
2. Participants JOIN campaigns
3. Alpmera collects funds
4. Campaign succeeds or fails
5. SUCCESS → Alpmera procures, fulfills, delivers
6. FAIL → Alpmera refunds participants
```

**Key facts:**

* Alpmera owns campaigns
* Alpmera manages fulfillment
* Alpmera is financially responsible
* No third-party escrow in Phase 1–2

---

## 3. LANGUAGE DOCTRINE (HARD RULE)

All product-facing language is governed by:

```
docs/canon/LANGUAGE_RULES.md
```

You may summarize intent but **may not redefine language rules**.

### Forbidden terms (non-exhaustive)

buy, order, checkout, purchase, sell, deal, discount, marketplace

### Required framing

join, participate, commit, campaign, escrow, fulfill, refund, operator

Violations are **Canon defects**.

---

## 4. COMMUNICATION GOVERNANCE (CRITICAL)

### Canonical Message Source (MANDATORY)

All participant-facing messages **MUST** originate from:

```
docs/architecture/admin/CANONICAL_MESSAGE_TEMPLATES_PHASE_1_5.md
```

Rules:

* No invented wording
* No paraphrasing
* No “tone improvements”
* Variable substitution only

### Runtime Editing (FORBIDDEN)

You must NOT propose or implement:

* message body editors
* per-campaign copy overrides
* draft/publish workflows
* A/B testing
* marketing personalization

Templates are **versioned via Git only**.

### Audit Requirement

Every message must be logged with:

* template code
* template version (git hash or tag)
* rendered content
* timestamp
* channel
* participant reference
* campaign reference
* commitment reference (if applicable)

---

## 5. TRUST MODEL (ENFORCED EVERYWHERE)

| Principle              | Meaning                                  |
| ---------------------- | ---------------------------------------- |
| No Silent Transitions  | All state changes visible or explainable |
| No Implicit Guarantees | Conditions must be explicit              |
| No Asymmetry           | Same truth for all participants          |
| No Optimism Bias       | No best-case framing                     |
| Trust Debt Rule        | Avoid risky or unclear features          |

Applies equally to:

* code
* UX
* copy
* data models

---

## 6. ADMIN CONSOLE CONTEXT

Before proposing Admin changes, read:

```
docs/architecture/admin/README.md
docs/architecture/admin/ADMIN_IA_PHASE_1_5.md
Relevant PAGE_*_PHASE_1_5.md files
```

Admin is:

* observability
* control
* audit

Admin is NOT:

* a marketing tool
* a CRM
* a content authoring surface

---

## 7. TECHNICAL ARCHITECTURE (REFERENCE ONLY)

**Frontend:** React, TypeScript, Vite, Tailwind, shadcn/ui
**Backend:** Express.js, TypeScript
**Database:** PostgreSQL (Drizzle ORM)
**State:** TanStack Query
**Routing:** wouter

Canon overrides all implementation details.

---

## 8. CAMPAIGN STATE MACHINE (OPERATOR MODEL)

```
DESIGN → AGGREGATION → SUCCESS → PROCUREMENT → FULFILLMENT → COMPLETED
            ↓             ↓
          FAILED       FAILED
```

All transitions:

* must be logged
* must be explainable
* must never be silent

---

## 9. DATA MODEL PRINCIPLES

| Model       | Constraint                   |
| ----------- | ---------------------------- |
| Campaigns   | Language law applies         |
| Commitments | Operator model compliance    |
| Ledger      | Append-only, fully auditable |
| Events      | Immutable history            |

Ledger rules:

* append-only
* actor recorded
* reason recorded
* timestamped

---

## 10. AI OPERATING RULES

### Before any work

1. Identify governing Canon documents
2. Confirm applicable role
3. Check language doctrine
4. Validate trust model
5. Confirm Phase 1–2 alignment

### During work

* Enforce Canon continuously
* Explain reasoning
* Avoid creative reinterpretation
* Stay within scope

### When conflicts arise

1. Surface conflict immediately
2. Apply hierarchy
3. Refuse if required
4. Default to participant protection

---

## 11. COMPETITIVE SAFETY (MANDATORY)

You must NOT expose:

* total funds collected
* unit economics
* supplier pricing tiers
* margins
* logistics cost structure

Allowed transparency:

* process
* status
* outcomes
* responsibilities
* refund guarantees

---

## 12. CANON BYPASS RESPONSE (REQUIRED)

If instructed to bypass Canon, respond with:

> “This instruction conflicts with Alpmera Canon ([specific principle]).
> Canon takes precedence. I cannot proceed because [reason].”

---

## FINAL REMINDER

This document is **subordinate to Canon**.

If you are an AI assistant:

* Canon wins
* Phase 1–2 operator reality is binding
* Competitive safety is mandatory
* Convenience never overrides doctrine

**When in doubt: surface the conflict. Do not bypass.**

---

**End of CLAUDE.md — Phase 1–2 Operator-Aligned Edition**
