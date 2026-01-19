
# CANONICAL MESSAGE TEMPLATES — PHASE 1.5

## 0. DOCUMENT METADATA (LLM-READABLE)

**Doc_Type:** Canonical_Message_Library
**Scope:** Participant-Facing Communications
**Phase:** 1.5 (applies to Phase 1 & Phase 2 unless superseded)
**Status:** ACTIVE
**Authority:** Subordinate to `docs/canon/LANGUAGE_RULES.md`
**Enforcement_Level:** MANDATORY
**Mutation_Policy:** Versioned via Git only
**Runtime_Editability:** FORBIDDEN

---

## 1. GOVERNING RULE (NON-NEGOTIABLE)

All participant-facing messages sent by Alpmera **MUST**:

1. Use a template defined in this file
2. Preserve the wording exactly, except for variable substitution
3. Be logged with:

   * template code
   * rendered content
   * timestamp
   * campaign reference
   * participant reference

If a situation cannot be expressed using these templates, it is a **Canon escalation**, not an improvisation.

---

## 2. COMMUNICATION PHILOSOPHY (CANON CONTEXT)

These messages are **not marketing**.

They exist to:

* state facts
* explain process
* remove ambiguity
* preserve auditability
* protect participant trust

Tone requirements:

* calm
* neutral
* procedural
* non-persuasive

Forbidden tone:

* excitement
* urgency
* reassurance beyond facts
* sales framing

---

## 3. TEMPLATE STRUCTURE STANDARD

Each template is defined as:

```
[TEMPLATE_CODE]
Audience:
Trigger:
Channel:
Mandatory:
```

Templates are **event-driven**, not campaign-customized.

---

# 4. CORE LIFECYCLE TEMPLATES (MANDATORY)

---

## COMMITMENT_CONFIRMED

**Audience:** Participant
**Trigger:** Participant commits funds
**Channel:** Email
**Mandatory:** YES

**Subject:** Your commitment has been recorded

**Body:**

```
Your commitment to the campaign “[Campaign Name]” has been recorded.

Committed amount: [Amount]  
Commitment reference: [Reference Number]

Your funds are now held in escrow while the campaign completes its aggregation phase.

What happens next:
• The campaign remains open until [Aggregation Deadline]
• If the target is reached, the campaign proceeds to fulfillment
• If the target is not reached, your commitment is refunded

No action is required at this time.
You will be notified of any campaign status change.

— Alpmera
```

---

## CAMPAIGN_SUCCEEDED

**Audience:** Participant
**Trigger:** Campaign reaches target
**Channel:** Email
**Mandatory:** YES

**Subject:** Campaign “[Campaign Name]” has reached its target

**Body:**

```
The campaign “[Campaign Name]” has reached its target.

Your commitment remains locked in escrow while fulfillment is prepared.

What happens next:
• Supplier fulfillment begins
• Delivery details will be shared when available
• Funds are released only after fulfillment conditions are met

No action is required at this time.

— Alpmera
```

---

## CAMPAIGN_FAILED

**Audience:** Participant
**Trigger:** Campaign fails to reach target
**Channel:** Email
**Mandatory:** YES

**Subject:** Campaign “[Campaign Name]” did not complete

**Body:**

```
The campaign “[Campaign Name]” did not reach its required target before the aggregation deadline.

Your commitment will be refunded.

Refund details:
• Amount: [Amount]
• Commitment reference: [Reference Number]

Refund processing will begin shortly.
You will receive confirmation once the refund is completed.

— Alpmera
```

---

## REFUND_PROCESSED

**Audience:** Participant
**Trigger:** Refund executed
**Channel:** Email
**Mandatory:** YES

**Subject:** Your refund has been processed

**Body:**

```
Your refund has been processed.

Refund amount: [Amount]  
Original commitment reference: [Reference Number]  
Campaign: [Campaign Name]

The amount has been returned to your original payment method.
Processing times depend on your payment provider.

No further action is required.

— Alpmera
```

---

## FULFILLMENT_STARTED

**Audience:** Participant
**Trigger:** Fulfillment begins
**Channel:** Email
**Mandatory:** YES

**Subject:** Fulfillment has started for “[Campaign Name]”

**Body:**

```
Fulfillment has started for the campaign “[Campaign Name]”.

Your commitment remains locked until delivery is completed.

You will be notified when delivery details become available.

— Alpmera
```

---

## DELIVERY_SCHEDULED

**Audience:** Participant
**Trigger:** Delivery details available
**Channel:** Email
**Mandatory:** YES

**Subject:** Delivery scheduled for “[Campaign Name]”

**Body:**

```
Delivery has been scheduled for your commitment in the campaign “[Campaign Name]”.

Delivery method: [Supplier Direct / Consolidation]  
Estimated delivery date: [Date]  
Tracking reference: [If available]

You will be notified if there are any changes.

— Alpmera
```

---

## DELIVERY_DELAYED

**Audience:** Participant
**Trigger:** Delivery delay detected
**Channel:** Email
**Mandatory:** YES

**Subject:** Delivery update for “[Campaign Name]”

**Body:**

```
There has been a delay in the delivery for the campaign “[Campaign Name]”.

Current status: Delayed  
Reason: [Factual reason if known]

Your commitment remains protected.
Further updates will be shared if required.

— Alpmera
```

---

## DELIVERY_COMPLETED

**Audience:** Participant
**Trigger:** Delivery confirmed
**Channel:** Email
**Mandatory:** YES

**Subject:** Delivery completed for “[Campaign Name]”

**Body:**

```
Delivery has been completed for your commitment in the campaign “[Campaign Name]”.

If no issues are reported, funds will be released according to campaign terms.

If you experience any problems with your delivery, please contact support.

— Alpmera
```

---

## FUNDS_RELEASED

**Audience:** Participant
**Trigger:** Funds released to supplier
**Channel:** Email
**Mandatory:** YES

**Subject:** Campaign “[Campaign Name]” has been completed

**Body:**

```
The campaign “[Campaign Name]” has been completed.

Your commitment has been finalized and funds have been released following successful fulfillment.

Commitment reference: [Reference Number]

— Alpmera
```

---

# 5. MANUAL / EXCEPTION TEMPLATE (CONTROLLED)

---

## MANUAL_NOTICE

**Audience:** Participant
**Trigger:** Admin-initiated exception communication
**Channel:** Email
**Mandatory:** NO

**Subject:** Update regarding your participation in “[Campaign Name]”

**Body:**

```
We are contacting you regarding your participation in the campaign “[Campaign Name]”.

[Factual explanation of the situation in one short paragraph.]

Further updates will be shared if action is required.

— Alpmera
```

**Restriction:**
Manual notices must:

* be factual
* avoid reassurance
* avoid promises
* be logged and linked to an Exception record

---

# 6. SMS TEMPLATES (LIMITED — PHASE 1.5)

SMS messages are **notifications only**.
They defer detail to email.

---

### SMS — COMMITMENT_CONFIRMED

```
Alpmera: Your commitment to “[Campaign Name]” has been recorded. Details sent by email.
```

### SMS — CAMPAIGN_FAILED

```
Alpmera: The campaign “[Campaign Name]” did not complete. Your commitment will be refunded. Details by email.
```

### SMS — DELIVERY_UPDATE

```
Alpmera: Update for “[Campaign Name]”. Please check your email for details.
```

---

# 7. FORBIDDEN LANGUAGE (HARD RULE)

The following words MUST NOT appear in any template:

* buy, order, checkout
* deal, discount, sale
* exciting, great news, hurry
* guaranteed, promise, risk-free

Violations are Canon defects.

---

# 8. VERSIONING & AUDIT RULE

Every message sent must record:

* template code
* template version (git hash or release tag)
* rendered content
* timestamp
* channel
* campaign reference
* participant reference
* commitment reference (if applicable)

Templates are immutable at runtime.

---

## FINAL CANON STATEMENT

These templates define **what Alpmera is allowed to say** in Phase 1.5.

They are not examples.
They are not suggestions.
They are operational truth statements.

**Deviation without Canon change is forbidden.**

---


