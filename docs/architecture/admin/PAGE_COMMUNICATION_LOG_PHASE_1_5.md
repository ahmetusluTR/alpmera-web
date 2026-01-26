Below is the **Communication Log Dashboard** spec in **LLM-law format**, Phase 1.5, trust-first, and consistent with your existing Admin architecture docs.

Save as:

```
docs/architecture/admin/PAGE_COMMUNICATION_LOG_PHASE_1_5.md
```

---

# ADMIN PAGE SPEC — COMMUNICATION LOG (PHASE 1.5)

## Document Metadata (Machine-Readable)

**Doc_Type:** Architecture_Spec
**Domain:** Admin_Console
**Page:** Communication_Log
**Phase:** 1.5
**Status:** ACTIVE
**Authority_Level:** Subordinate
**Parent_Authority:** `docs/canon/*`
**Enforcement:** REQUIRED
**Applies_To:**

* Admin UI (Communication Log Dashboard)
* Notification auditability and dispute workflows
* Support investigation tooling
* Exception detection for undelivered notices

**Rule:**
Any change to participant-facing communications MUST remain auditable via this page unless explicitly overridden by Canon.

---

## Canon Intent

The Communication Log is a **truth surface**.

It exists to prove:

* what was communicated
* to whom
* when
* through which channel
* whether it was delivered

This page is required to enforce:

* **No Silent Transitions**
* **procedural and factual communication**
* dispute resolution readiness

---

## PAGE PURPOSE (Normative)

The Communication Log Dashboard provides a **global, cross-campaign, cross-participant** view of all platform-to-participant communications.

Operational goals:

* detect failed / bounced communications quickly
* prove notification delivery for disputes
* investigate campaign incidents with evidence
* confirm lifecycle messages were sent for trust-critical transitions

---

## NON-GOALS (Explicit Prohibitions)

This page MUST NOT:

* compose or send messages
* edit message content
* provide engagement analytics (opens/clicks)
* function as a CRM
* enable exports in Phase 1.5
* allow free-text internal notes

This page is **read-only**.

---

## DATA MODEL REQUIREMENTS (Normative Interface)

Each log entry MUST contain:

### Identity & Linking (Required)

* `log_id` (unique)
* `timestamp_sent`
* `template_type` (enum; must match Templates registry)
* `category` (Commitment / Campaign / Fulfillment / Exception)
* `participant_id`
* `campaign_id` (nullable only if truly not applicable)
* `commitment_reference` (nullable only if not applicable)

### Delivery (Required)

* `channel` (EMAIL / SMS in Phase 1.5)
* `delivery_status` (QUEUED / SENT / DELIVERED / FAILED / BOUNCED)
* `provider_message_id` (nullable)
* `failure_reason_code` (nullable)

### Content (Required, with safeguards)

* `subject_or_title`
* `content_preview` (first N characters)
* `content_full` (read-only; access controlled)

### Attribution (Required)

* `trigger_event` (enum or string identifier)
* `actor_type` (SYSTEM / ADMIN_ACTION)
* `actor_id` (nullable for SYSTEM)

**Invariant:**
Every lifecycle-critical trigger MUST produce at least one log entry, or a system defect is present.

---

## LIST VIEW — GLOBAL LOG (Authoritative)

### Default Ordering

* `timestamp_sent DESC`

### Default Landing View (Phase 1.5)

**MUST default to “Needs Attention”:**

* delivery_status ∈ {FAILED, BOUNCED}
* plus optionally: SENT but not DELIVERED for a time threshold

Reason: operational safety.

---

### Columns (Normative)

| Field                | Type       | Purpose                        |
| -------------------- | ---------- | ------------------------------ |
| Sent_At              | Timestamp  | Time evidence                  |
| Template_Type        | Enum       | What was sent (canonical type) |
| Category             | Enum       | Operational bucket             |
| Participant          | Link       | Who received (or should have)  |
| Campaign             | Link       | Context                        |
| Commitment_Reference | Text       | Financial linkage              |
| Channel              | Enum       | EMAIL / SMS                    |
| Delivery_Status      | Enum badge | Operational triage             |
| Subject/Title        | Text       | Quick identification           |
| Provider_ID          | Text       | Cross-reference with provider  |
| Failure_Reason       | Text       | Only when failed/bounced       |

---

## FILTERS (Authoritative)

### Primary Filters (Required)

* Delivery_Status: All / Failed / Bounced / Sent / Delivered / Queued
* Channel: Email / SMS / All
* Template_Type: multi-select
* Category: multi-select
* Campaign: select
* Participant: search/select (name/email/phone)
* Commitment_Reference: exact search
* Date_Range: sent_at range

### Secondary Filters (Optional but recommended)

* Trigger_Event: select
* Actor_Type: SYSTEM / ADMIN_ACTION
* Failure_Reason_Code: select
* “Only lifecycle-critical templates” toggle

---

## SAVED VIEWS (Required Presets)

| View Name                | Filter Set                          | Purpose                       |
| ------------------------ | ----------------------------------- | ----------------------------- |
| Needs_Attention          | FAILED or BOUNCED                   | Immediate operational triage  |
| Recently_Sent            | sent_at last 24h                    | Verify recent waves           |
| Campaign_Failure_Notices | template_type = CAMPAIGN_FAILED     | Ensure failure comms coverage |
| Refund_Notices           | template_type = COMMITMENT_REFUNDED | Refund dispute readiness      |
| Delivery_Delayed         | template_type = DELIVERY_DELAYED    | Exception candidates          |
| Participant_Lookup       | participant filter only             | Support workflow              |
| Commitment_Lookup        | commitment_reference filter only    | Financial support workflow    |

---

## DETAIL VIEW — SINGLE LOG ENTRY (Authoritative)

Accessed from list. Read-only.

### Section A — Evidence Header

* log_id
* sent_at
* template_type + category
* channel
* delivery_status
* provider_message_id
* failure_reason (if any)

### Section B — Entity Links

* Participant link
* Campaign link
* Commitment link (if applicable)
* “View in Audit” link filtered by log_id / actor / timestamp
* “View related communications” (same participant + campaign + time window)

### Section C — Content View

* subject/title
* full content (read-only)
* variables used (resolved values) (read-only)

**Privacy Guardrail:**
Full content visibility MUST be limited to admin-only and must never expose sensitive tokens/secrets.

---

## BEHAVIOR RULES (Phase 1.5)

### Read-only Guarantee

No actions that change state. No resend button. No edit.

### Refresh

* Refresh on load and filter change
* Manual refresh available
* No real-time streaming required

### Pagination

Required for large volume.

### Back-navigation

Return to list with filters preserved.

---

## EXCEPTION INTEGRATION (Critical)

### Exception Auto-Creation Rules (Normative)

A communication failure MAY create an Exception when:

* template_type is lifecycle-critical (Mandatory = true)
* delivery_status is FAILED/Bounced
* and the related event is trust-critical (campaign failed, refund processed, escrow locked)

The Communication Log MUST support:

* “Create Exception” link (optional in Phase 1.5)
* OR automatic linking if Exception already exists

**Rule:**
A failed lifecycle-critical message MUST be visible and investigable. Silence is not allowed.

---

## RELATIONSHIP TO OTHER ADMIN PAGES (Authoritative)

### Communication Templates

* Communication Log entries MUST reference template_type from Templates registry.
* Unrecognized template_type is a system defect.

### Participants Page

* Participant detail includes a participant-scoped log subset.
* This page is the global version.

### Commitments Page

* Commitment detail includes commitment-scoped log subset.
* This page enables cross-campaign audit.

### Audit Page

* Every send attempt MUST also be reflected as an audit event.
* Log links to filtered Audit view.

### Campaigns Page

* Campaign-level communication verification uses campaign filter.

---

## FORBIDDEN ADMIN ACTIONS (Hard Rules)

Admins MUST NOT:

* compose messages
* resend from this page
* edit templates from this page
* export logs in Phase 1.5
* track engagement analytics
* add free-text notes

---

## PHASE 2 DELTA (Not Implemented in Phase 1.5)

Phase 2 may introduce:

* opt-in growth notifications (new campaigns, referrals)
* frequency controls per participant

**Rule:**
Phase 2 additions MUST remain event-driven and auditable and MUST NOT introduce hype or ad-hoc messaging.

---

## CANON ALIGNMENT CHECK

| Principle                 | Compliance                   |
| ------------------------- | ---------------------------- |
| Trust-First               | ✓ Evidence-based messaging   |
| No Silent Transitions     | ✓ Verifiable lifecycle comms |
| Failure Strengthens Trust | ✓ Failed delivery detection  |
| Operational Simplicity    | ✓ Read-only dashboard        |
| Language Doctrine         | ✓ Canon terms only           |

---

## FINAL CANON STATEMENT

The Communication Log Dashboard is **not a marketing system**.
It is **evidence infrastructure**.

It ensures Alpmera can prove:

* what was said
* when it was said
* and whether it reached the participant

If a lifecycle-critical communication is missing or undelivered, Alpmera must treat it as a **trust defect** until resolved.

**This document is binding for Phase 1.5 admin work.**
