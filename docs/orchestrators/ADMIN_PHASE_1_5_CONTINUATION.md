## ✅ CODEX ORCHESTRATOR PROMPT — Alpmera Admin Console Continuation (Credits & Completion Credit Engine)

### 0) Canon & Governance Lock (Read First, then execute)

You are operating inside the Alpmera repository with a **formal Canon system** under `docs/canon/`.

**Absolute constraints:**

* Alpmera is **NOT a store**. Users **join campaigns** and **commit funds to escrow**. Never use retail terms (buy/order/discount/etc.). 
* **No Silent Transitions**: all money/credit state changes must be explainable and auditable via append-only logs. 
* Git governance: work on `dev` only; `main` is protected; no force pushes; changes reach `main` via PR only. 

**Resolution order:** Constitution → Git Governance → Roles → Playbooks → Tasks → convenience. 

---

## 1) Mission for this work (Phase 1.5 Admin)

We already have:

* Admin UI “Credits” page showing **Credit Ledger Entries** (currently empty)
* DB table `credit_ledger_entries` exists (append-only ledger)
* Admin console navigation includes Credits

**Missing (must be added now):**

1. A **participant credit structure** so credits are not just raw ledger rows:

   * “credit account” concept per participant (and optionally per currency/type)
   * fast, explainable **current balance**
2. A **credit amount conversion structure**:

   * define conversion policy (e.g., “credits are denominated in USD cents” OR “credits are units convertible to USD via rate table”)
   * show: **earned, spent, reserved, remaining** credits
3. Admin UX that links:

   * Participant → Credit Account → Ledger Entries
   * Summary card(s): balances + breakdown
4. This must support the upcoming **Completion Credit Engine** page.

**Non-negotiable trust requirements:**

* Credits must remain **auditable** (append-only ledger is source of truth)
* Any derived balance must be reproducible from ledger (or stored with proofs)
* Copy must never imply retail purchasing; use “join/commit/campaign/escrow/refund/release”. 

---

## 2) Role-based agent assignments (do not blend roles)

### Agent A — CANON_ORCHESTRATOR (meta, non-coding)

**Goal:** map roles, sequence steps, ensure Canon compliance, stop on conflicts. 
**Output:** A step plan + checkpoints + definition of “done”.

### Agent B — SYSTEM_ARCHITECT

**Goal:** propose the **minimum schema + API + query approach** to implement credit accounts + balances + conversion with low risk. 
**Constraints:** prefer incremental changes; preserve append-only ledger; no hidden states.

### Agent C — ESCROW_FINANCIAL_AUDITOR

**Goal:** validate money/credit semantics, conversion rules, and explainability.
**Must enforce:** explainability of balances and conversions; avoid ambiguous flows.  

### Agent D — UX_TRUST_DESIGNER

**Goal:** define Admin UX additions (participant linkage, summary widgets, filters) using UX baseline rules + Language Law.
**Must enforce:** boring, consistent list layouts; no confusing terminology.

### Agent E — RISK_ABUSE_ANALYST

**Goal:** identify abuse vectors (credit farming, negative balances, replay/idempotency) and require mitigations. 

### Agent F — QA_LEAD

**Goal:** define acceptance criteria + required tests (API + balance calculation + admin flows). 

### Agent G — IMPLEMENTER (coding)

**Goal:** implement exactly what’s specified, with minimal blast radius, on `dev`.
**Hard requirement for every PR:**

* List files changed
* Verification steps (local + staging)
* Rollback plan (how to revert safely)

---

## 3) Step-by-step execution plan (must follow in order)

### Step 1 — Discovery (Implementer, guided by System Architect)

1. Inspect current schema definitions (Drizzle) and current `credit_ledger_entries` fields.
2. Identify the “participant” entity in DB (likely `users` or `user_profiles`) and how Admin refers to “Participant ID”.
3. Identify any existing “refund” or “clearing” flows that might generate credit entries later.

**Deliverable:** a short “Current State” note:

* current tables/columns relevant to credits
* how participant is identified
* any existing enums/events for credit ledger

### Step 2 — Define Canonical Credit Model (System Architect + Escrow Financial Auditor)

Propose the **minimum** model that supports:

* append-only ledger as source of truth
* current balance derivation
* conversion logic clarity

**Default recommended approach (low risk):**

* Keep `credit_ledger_entries` append-only as the only source of truth.
* Add:

  1. `credit_accounts` table (one per participant, maybe per currency)
  2. optional `credit_policies` / `credit_conversion_rates` (if credits aren’t already USD-cent denominated)
* Provide a deterministic balance query:

  * balance = SUM(ledger.amount) grouped by account
  * plus breakdown by status/type if needed (earned/spent/reserved)

**You must decide one of these and document it clearly:**

* **Option A (simplest):** credits are stored as **USD cents** (integer). Conversion is identity.
* **Option B (flexible):** credits are abstract units; conversion uses rate table.

Pick the option that best fits Phase 1.5 “operational maturity” while minimizing mistakes. The model must be explainable to a non-expert admin.

**Deliverable:** “Credit Model Spec v1” including:

* tables + key columns
* invariants (no negative allowed? or allowed with reason?)
* event types for ledger (EARNED, ADJUSTMENT, SPENT, EXPIRED, REVERSAL, etc.)
* idempotency rule for credit events

### Step 3 — Abuse & Safety Gates (Risk Abuse Analyst + Escrow Financial Auditor)

Threat-model this:

* replay / double-award credits (idempotency keys)
* admin manual adjustments (audit who/why)
* negative balance creation
* conversion rate manipulation (if Option B)
* backdating entries

**Deliverable:** mitigations list that becomes requirements:

* require `idempotency_key` on credit events (or unique composite key)
* require `created_by_admin_id` and `reason` for manual events
* require immutable timestamps (no edits; reversals only)
* require “reversal entry” pattern, never update-in-place

### Step 4 — UX Spec (UX Trust Designer)

Update Admin UX to support real operability:

**Required pages/behaviors:**

1. **Credits Ledger (existing page)**

   * Keep filters (Participant ID, Event Type, Date range)
   * Add link on Participant ID → Participant detail (or a new participant credits view)
2. **Participant Credits View (new)**

   * Header: Participant ID + identity fields (email/name if available)
   * Summary cards:

     * Current Balance
     * Earned (lifetime)
     * Spent (lifetime)
     * Reserved (if your model has it)
   * Table: ledger entries filtered to this participant
   * Copy must be literal: “credit balance”, “ledger”, “adjustment”, never retail language
3. **Completion Credit Engine readiness**

   * Ensure the data model supports computing “completion credits” from campaign outcomes later.

Must comply with Admin list visual contract + boring forms + predictable navigation.

### Step 5 — Implementation (Implementer)

Implement in the smallest safe increments:

**5.1 Database**

* Add migrations for `credit_accounts` (+ optional conversion table)
* Add constraints + indexes for:

  * participant_id
  * event_time
  * idempotency_key uniqueness (if adopted)
* Ensure ledger remains append-only (no updates; reversals only)

**5.2 Backend API**

* Admin endpoints:

  * `GET /api/admin/credits/ledger` (existing or create) with filters
  * `GET /api/admin/credits/accounts?participantId=...` (summary)
  * `GET /api/admin/credits/accounts/:id/balance` OR return balance in accounts response
  * optional `POST /api/admin/credits/adjust` (manual adjustment) **only if required now**; otherwise defer

**5.3 Admin UI**

* Enhance Credits ledger page to show results + linking
* Add Participant Credits page (route + nav if appropriate)
* Keep consistent components and layout with existing admin pages

### Step 6 — QA & Acceptance (QA Lead)

Write acceptance criteria and tests:

**Minimum tests:**

* Balance calculation from ledger (including reversal entries)
* Filtering correctness (participantId, event type, date range)
* Idempotency enforcement (if implemented)
* Admin auth required for all endpoints
* UI renders empty states + error states calmly

**Deliverable:** checklist + test plan.

### Step 7 — Delivery Discipline (Git Governance)

* Work on `dev`
* Provide PR-ready summary:

  * files changed
  * verification steps
  * rollback plan
* No direct edits to `main`. 

---

## 4) “Definition of Done” for this slice

This slice is done when:

1. Admin can search credits by Participant ID and see ledger entries (not just empty UI)
2. Admin can open a participant credits view and see:

   * current balance (derived deterministically)
   * lifetime earned/spent (if implemented)
3. Credit conversion approach is explicitly defined and enforced (Option A or B)
4. All changes are auditable, explainable, and consistent with Canon language rules
5. PR includes: files list, verification steps, rollback plan

---

## 5) Required Output Format from Implementer (strict)

When you finish, output:

1. **Files changed** (explicit list)
2. **API endpoints added/changed** (with example JSON)
3. **DB migrations** (what tables/columns/constraints)
4. **Verification steps**

   * local: commands + endpoints to curl
   * staging: deploy steps + sanity checks
5. **Rollback plan**

   * how to revert DB migration safely (or forward-fix strategy)
   * how to revert API/UI changes

---

## 6) Reminder: Language Law (do not violate)

Never use: buy, order, checkout, purchase, discount, deal, sell.
Always use: join, commit, campaign, escrow, accept, refund, release.

---

### Start now:

Begin with **Step 1 (Discovery)** and do not skip.
