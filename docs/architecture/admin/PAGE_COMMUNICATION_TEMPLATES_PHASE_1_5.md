Below is the **Communication Templates Page** written in the same **LLM-law / Canon-compliant format** as your other admin specs.

This is **Phase-disciplined**, **trust-first**, and designed so AI assistants cannot drift into marketing tools or ad-hoc messaging.

You can save this as:

```
docs/architecture/admin/PAGE_COMMUNICATION_TEMPLATES_PHASE_1_5.md
```

---

# ADMIN PAGE SPEC — COMMUNICATION TEMPLATES (PHASE 1.5)

## Document Metadata (Machine-Readable)

**Doc_Type:** Architecture_Spec
**Domain:** Admin_Console
**Page:** Communication_Templates
**Phase:** 1.5
**Status:** ACTIVE
**Authority_Level:** Subordinate
**Parent_Authority:** `docs/canon/*`
**Enforcement:** REQUIRED
**Applies_To:**

* Admin UI (Communication Templates)
* Notification system configuration
* Campaign / Commitment lifecycle messaging
* Audit & dispute workflows

**Rule:**
Any change to participant-facing communication MUST comply with this document unless explicitly overridden by Canon.

---

## Canon Intent

The Communication Templates page defines **what Alpmera is allowed to say**, **when**, and **through which channels**.

It exists to:

* prevent ad-hoc or emotional messaging
* enforce procedural, factual communication
* guarantee auditability
* ensure no participant is left uninformed during trust-critical events

This page is **configuration**, not execution.

---

## PAGE PURPOSE (Normative)

The Communication Templates page provides a **central registry of all allowed system-generated messages** sent to participants.

It defines:

* communication types (enumerated)
* approved channels per type
* required variables
* whether a message is mandatory or optional
* activation status

Messages are sent **only via system triggers**, never manually.

---

## NON-GOALS (Explicit Prohibitions)

This page MUST NOT:

* send messages
* preview campaigns or marketing copy
* allow free-text composition
* allow admin-written one-off messages
* support broadcast or bulk sends
* include engagement or click analytics

Violations create **trust debt**.

---

## TEMPLATE REGISTRY — LIST VIEW (Authoritative)

### Columns (Normative)

| Field         | Type      | Purpose                                         |
| ------------- | --------- | ----------------------------------------------- |
| Template_Type | Enum      | Canonical communication identifier              |
| Category      | Enum      | Commitment / Campaign / Fulfillment / Exception |
| Channels      | Enum[]    | EMAIL, SMS (Phase 1.5)                          |
| Mandatory     | Boolean   | Whether message MUST be sent on trigger         |
| Variables     | List      | Required runtime fields                         |
| Status        | Enum      | ACTIVE / DISABLED                               |
| Last_Updated  | Timestamp | Change tracking                                 |
| Updated_By    | Admin     | Attribution for audit                           |

---

## TEMPLATE CATEGORIES (Phase 1.5)

### A. Commitment Lifecycle (MANDATORY)

| Template_Type        | Mandatory |
| -------------------- | --------- |
| COMMITMENT_CONFIRMED | ✓         |
| COMMITMENT_REFUNDED  | ✓         |
| COMMITMENT_RELEASED  | ✓         |

---

### B. Campaign Lifecycle (MANDATORY)

| Template_Type                 | Mandatory |
| ----------------------------- | --------- |
| CAMPAIGN_JOINED               | ✓         |
| CAMPAIGN_TARGET_REACHED       | ✓         |
| CAMPAIGN_FAILED               | ✓         |
| CAMPAIGN_MOVED_TO_FULFILLMENT | ✓         |
| CAMPAIGN_COMPLETED            | ✓         |

---

### C. Fulfillment (MANDATORY)

| Template_Type      | Mandatory |
| ------------------ | --------- |
| DELIVERY_SCHEDULED | ✓         |
| DELIVERY_DELAYED   | ✓         |
| DELIVERY_COMPLETED | ✓         |

---

### D. Exception Handling (MANDATORY)

| Template_Type       | Mandatory |
| ------------------- | --------- |
| ISSUE_REPORTED      | ✓         |
| ISSUE_RESOLVED      | ✓         |
| REFUND_DELAY_NOTICE | ✓         |

---

## CHANNEL RULES (Phase 1.5)

### Allowed Channels

| Channel | Usage Rule                                             |
| ------- | ------------------------------------------------------ |
| EMAIL   | Default for all templates                              |
| SMS     | Allowed only for time-sensitive or risk-bearing events |

### Forbidden Channels (Phase 1.5)

* WhatsApp
* Telegram
* Slack
* Push notifications

---

## TEMPLATE DETAIL VIEW (Authoritative)

### Section A — Template Identity (Immutable)

| Field         | Description               |
| ------------- | ------------------------- |
| Template_Type | Canonical enum            |
| Category      | Communication category    |
| Mandatory     | true / false              |
| Channels      | Allowed delivery channels |

**Rule:**
Template_Type and Category MUST NOT change after creation.

---

### Section B — Required Variables (Strict)

Each template defines a **required variable set**.

Example:

| Variable             | Description            |
| -------------------- | ---------------------- |
| participant_name     | Display name           |
| campaign_name        | Campaign identifier    |
| commitment_reference | Commitment ID          |
| amount               | Currency               |
| next_step            | Procedural next action |

**Rule:**
If required variables are missing, message MUST NOT be sent and an Exception MUST be raised.

---

### Section C — Content Body (Locked Structure)

Templates MUST follow this structure:

1. **What happened**
2. **What it means**
3. **What happens next**
4. **Participant action required (often: none)**

Tone:

* factual
* calm
* explicit
* no hype
* no emojis
* no urgency inflation

---

### Section D — Status Control

| Status   | Meaning                           |
| -------- | --------------------------------- |
| ACTIVE   | Template is used by triggers      |
| DISABLED | Template exists but will not send |

**Rule:**
Mandatory templates SHOULD NOT be disabled unless Canon explicitly allows.

---

## TRIGGER ENFORCEMENT RULES (Critical)

### Canon Rule

> **Messages are triggered by system state changes, not by admins.**

Examples:

| Event            | Template Triggered   |
| ---------------- | -------------------- |
| Escrow locked    | COMMITMENT_CONFIRMED |
| Campaign failed  | CAMPAIGN_FAILED      |
| Refund processed | COMMITMENT_REFUNDED  |
| Delivery delayed | DELIVERY_DELAYED     |

Admins:

* cannot suppress mandatory messages
* cannot replace messages
* cannot send alternatives

---

## AUDIT REQUIREMENTS

Every message generated MUST create:

* a Communication Log entry
* timestamp
* template type
* channel
* delivery status
* participant / commitment / campaign linkage

Failure to log = system defect.

---

## FORBIDDEN ADMIN ACTIONS (Hard Rules)

Admins MUST NOT:

* send messages manually
* edit message content at send time
* create untyped templates
* bypass mandatory templates
* enable growth/marketing messages in Phase 1.5
* view engagement analytics

---

## PHASE 1.5 BOUNDARY

### Explicitly Deferred to Phase 2

* Growth announcements
* New campaign notifications
* Referral invitations
* Demand-collector messaging
* Community broadcasts

---

## CANON ALIGNMENT CHECK

| Principle                 | Compliance                        |
| ------------------------- | --------------------------------- |
| Trust-First               | ✓ Procedural, factual messaging   |
| No Silent Transitions     | ✓ Mandatory lifecycle messages    |
| Escrow Integrity          | ✓ Commitment-linked communication |
| Failure Strengthens Trust | ✓ Explicit exception notices      |
| Operational Simplicity    | ✓ No send UI                      |
| Language Doctrine         | ✓ Canon terms only                |

---

## FINAL CANON STATEMENT

The Communication Templates page is **not a messaging tool**.
It is a **trust enforcement mechanism**.

It ensures:

* participants are always informed
* messages are consistent and auditable
* no admin can “wing it” during critical moments

**This document is binding for Phase 1.5 admin work.**


