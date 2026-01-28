# Alpmera — Payment Architecture

**Status:** Proposed for Ratification  
**Authority Level:** Layer 1 (Canon)  
**Subordinate To:** Constitution  
**Last Updated:** January 2025

---

## Preamble

This document defines Alpmera's payment architecture, fund protection mechanisms, risk management framework, and legal positioning. It governs all money flows, supplier payment terms, participant protections, and dispute handling.

Payment architecture is trust architecture. Every decision in this document exists to preserve trust while enabling Alpmera to operate sustainably as a campaign operator.

---

## Article I — Core Payment Philosophy

### §1.1 Alpmera is the Operator

Alpmera is the principal in all campaign transactions. We are not a marketplace, payment intermediary, or escrow agent.

```
OPERATOR MODEL (Correct)          MARKETPLACE MODEL (Wrong)
─────────────────────────         ─────────────────────────
Alpmera sets campaign price       Supplier sets price
Alpmera negotiates with supplier  Platform takes visible fee
Margin is internal business       Fee is disclosed to all parties
Alpmera is the counterparty       Platform is intermediary
```

### §1.2 Escrow-Style Protection

Alpmera provides "escrow-style protection" to participants. This means:

- Funds are charged at commitment and held in Alpmera's payment processor balance
- Funds are not released to suppliers until fulfillment is confirmed
- Participants receive full refunds if campaigns fail

Alpmera is NOT a licensed escrow agent. We do not maintain segregated escrow accounts. Our payment processor (Stripe) holds funds on our behalf.

### §1.3 Constitutional Alignment

This architecture implements Constitution Article IV (Operating Model):

| Constitutional Requirement | Implementation |
|---------------------------|----------------|
| Funds locked at join time | Immediate charge via Stripe Payment Intent |
| Funds not spent at join time | Held in Stripe platform balance |
| No supplier access before acceptance | Transfers only after fulfillment |
| Release only after fulfillment | Inspection window before supplier payment |
| Refunds automatic on failure | Automated refund triggers |

---

## Article II — Fund Flow Architecture

### §2.1 Participant Commitment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 PARTICIPANT COMMITMENT FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PARTICIPANT JOINS CAMPAIGN                                     │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Stripe Payment Intent Created                            │  │
│  │  Amount: Campaign Price                                   │  │
│  │  Capture: Immediate                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Funds Location: Alpmera Stripe Platform Balance          │  │
│  │  Status: COMMITTED                                        │  │
│  │  Participant View: "Funds protected"                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                       │
│         ├─────────────────┬─────────────────┐                  │
│         ▼                 ▼                 ▼                  │
│                                                                 │
│   CAMPAIGN            CAMPAIGN         PARTICIPANT             │
│   SUCCEEDS            FAILS            WITHDRAWS               │
│      │                   │                  │                  │
│      ▼                   ▼                  ▼                  │
│   Fulfillment        Full Refund       Full Refund             │
│   Process            (Automatic)       (On Request)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### §2.2 Supplier Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   SUPPLIER PAYMENT FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CAMPAIGN SUCCEEDS                                              │
│         │                                                       │
│         ▼                                                       │
│  Supplier Ships Products                                        │
│  ─ Provides tracking                                            │
│  ─ Provides packing documentation                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  INSPECTION WINDOW (7 calendar days from delivery)        │  │
│  │  ─ Participants may report issues                         │  │
│  │  ─ Payment to supplier is HELD                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                       │
│         ├─────────────────┬─────────────────┐                  │
│         ▼                 ▼                 ▼                  │
│                                                                 │
│   NO ISSUES           MINOR ISSUES      MAJOR ISSUES           │
│   REPORTED            (<5% rate)        (≥5% rate)             │
│      │                   │                  │                  │
│      ▼                   ▼                  ▼                  │
│   Full Payment       Payment with       Payment Held           │
│   Released           Issue Reserve      Pending Resolution     │
│   (2 business days)  Held                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### §2.3 Money Flow Summary

| Stage | Funds Location | Participant Status | Supplier Status |
|-------|---------------|-------------------|-----------------|
| Pre-commitment | Participant's bank | — | — |
| Committed | Stripe platform balance | "Funds protected" | No visibility |
| Campaign failed | Returned to participant | "Refunded" | — |
| Campaign succeeded | Stripe platform balance | "Awaiting fulfillment" | "Preparing shipment" |
| Shipped | Stripe platform balance | "In transit" | "Awaiting payment" |
| Inspection window | Stripe platform balance | "Inspecting" | "Awaiting payment" |
| Fulfilled | Released to supplier | "Complete" | "Paid" |

---

## Article III — Pricing Architecture

### §3.1 Operator Pricing Model

Alpmera operates on margin, not fees. The pricing structure is:

```
Campaign Price (what participants commit)     $100
  └── Procurement Price (what supplier receives)  $70
  └── Operating Margin (Alpmera retains)          $30
      └── Payment Processing (~3%)                 $3
      └── Operational Costs                       $12
      └── Gross Margin                            $15
```

### §3.2 Pricing Visibility Rules

| Information | Visible To Participants | Visible To Suppliers |
|-------------|------------------------|---------------------|
| Campaign price | Yes | No |
| Procurement price | No | Yes |
| Operating margin | No | No |
| Quantity committed | Abstracted (stages) | Yes (after goal) |

### §3.3 Pricing Integrity

- Campaign price is set by Alpmera based on procurement negotiations
- Procurement price is negotiated directly with suppliers
- No "platform fee" language to participants or suppliers
- Margin is internal business information

---

## Article IV — Refund Architecture

### §4.1 Refund Triggers

| Trigger | Timing | Automation |
|---------|--------|------------|
| Voluntary withdrawal | Anytime before campaign close | Manual request → Automatic processing |
| Campaign failure | Campaign close date | Fully automatic |
| Supplier non-acceptance | 7 days after goal reached | Fully automatic |
| Fulfillment failure | After investigation | Manual trigger |
| Product issues | After investigation | Manual trigger |

### §4.2 Refund Processing

```
REFUND INITIATED
      │
      ▼
┌─────────────────────────────────────────┐
│  Stripe Refund API Called               │
│  ─ Full amount of original charge       │
│  ─ Reason code logged                   │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  Commitment Status Updated              │
│  ─ Status: REFUNDED or WITHDRAWN        │
│  ─ Timestamp recorded                   │
│  ─ Refund ID stored                     │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  Participant Notified                   │
│  ─ Email confirmation                   │
│  ─ Expected timeline: 5-7 business days │
└─────────────────────────────────────────┘
```

### §4.3 Refund Costs

| Scenario | Stripe Fee Impact | Cost to Alpmera |
|----------|------------------|-----------------|
| Original charge | 2.9% + $0.30 | Paid |
| Refund issued | ~2.9% returned, $0.30 retained | ~$0.30 per refund |

Refund costs are an operational expense. They are not passed to participants.

---

## Article V — Risk Management

### §5.1 Risk Categories

| Risk | Source | Mitigation |
|------|--------|------------|
| Supplier ships wrong product | Supplier error | Inspection window, holdback |
| Supplier ships damaged product | Supplier/carrier | Inspection window, documentation |
| Supplier ships partial quantity | Supplier error | Packing verification, holdback |
| Supplier never ships | Supplier failure | Milestone tracking, certification |
| Participant false claim | Fraud attempt | Photo evidence requirement |
| Chargeback during campaign | Participant | Clear consent, easy withdrawal |
| Chargeback post-fulfillment | Participant | Evidence trail, fulfillment proof |

### §5.2 Supplier Risk Mitigation

#### Pre-Campaign (Prevention)

| Requirement | Purpose |
|-------------|---------|
| Business verification | Confirm legal entity |
| Product samples | Verify quality before launch |
| Specifications document | Define acceptance criteria |
| References/track record | Assess reliability |
| Smaller initial quantities | Limit exposure for new suppliers |

#### Campaign Agreement Requirements

| Element | Purpose |
|---------|---------|
| Exact product specifications | Objective acceptance criteria |
| Quality standards | Measurable benchmarks |
| Delivery timeline | Enforceable milestones |
| Photo documentation | Pre-shipment verification |
| Remedy obligations | Clear resolution path |

### §5.3 Inspection Window Protocol

```
DAY 0:   Supplier ships, provides tracking + documentation
DAY 1-7: Delivery window (varies by shipping method)
DAY 7:   Delivery confirmed → Inspection window begins
DAY 7-14: Participant inspection period
         ─ Participants may report issues
         ─ Issues require photos and description
DAY 14:  Inspection window closes
         ─ If no issues: Payment released within 2 business days
         ─ If issues reported: Payment held pending resolution
```

### §5.4 Issue Resolution Flow

```
PARTICIPANT REPORTS ISSUE
         │
         ▼
┌─────────────────────────────────────────┐
│  ALPMERA REVIEWS                        │
│  ─ Photos provided                      │
│  ─ Description matches photos           │
│  ─ Issue categorized                    │
└─────────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┬─────────────────┐
         ▼                  ▼                  ▼                 ▼
                                                                
   CLEARLY              UNCLEAR/            PARTICIPANT       FRAUDULENT
   SUPPLIER FAULT       DISPUTED            ERROR             CLAIM
         │                  │                  │                 │
         ▼                  ▼                  ▼                 ▼
   Supplier must       Investigation      No remedy          Claim denied
   remedy              period             provided           Account flagged
         │                  │                                    
         ├────────┬─────────┤                                    
         ▼        ▼         ▼                                    
                                                                
   REPLACEMENT   REPAIR    REFUND                               
   ─ Supplier    ─ At      ─ Supplier                           
     ships new     supplier   refunds                           
     product       expense    Alpmera                           
         │           │           │                               
         ▼           ▼           ▼                               
   Payment        Payment    Alpmera                            
   releases on    releases   refunds                            
   acceptance     on fix     participant                        
```

### §5.5 Risk Budget

For financial planning, anticipate:

| Issue Type | Expected Rate | Resolution Cost |
|------------|---------------|-----------------|
| Shipping damage | 1-3% | Supplier remedy |
| Wrong items | <1% | Supplier remedy |
| Quality disputes | 2-5% | Case-by-case |
| False claims | <1% | Investigation time |
| **Total expected loss** | **3-5%** | **Build into margin** |

---

## Article VI — Chargeback Management

### §6.1 Chargeback Definition

A chargeback occurs when a participant contacts their bank to dispute a charge, bypassing Alpmera's refund process. The bank forcibly reverses the charge.

Chargebacks are NOT:
- Voluntary withdrawals (use our refund process)
- Refund requests (use our support process)
- Product complaints (use our issue process)

### §6.2 Chargeback Risk Scenarios

| Scenario | Risk Level | Primary Defense |
|----------|------------|-----------------|
| Campaign succeeds, product delivered | Low | Delivery confirmation, quality |
| Campaign succeeds, fulfillment delayed | Medium | Communication trail |
| Campaign fails, refund issued | Very Low | Refund already processed |
| Campaign active, participant forgets | Medium | Clear billing descriptor |
| Campaign active, participant regrets | Medium-High | Easy withdrawal option |

### §6.3 Chargeback Prevention

#### At Commitment Time (Critical)

- [ ] Clear statement: "Your card will be charged immediately"
- [ ] Explicit consent: "I understand funds are committed to this campaign"
- [ ] Recognizable billing descriptor: `ALPMERA *[CAMPAIGN]`
- [ ] Confirmation email with campaign details

#### During Campaign

- [ ] Regular status emails (weekly minimum)
- [ ] Campaign name and committed amount in every communication
- [ ] Prominent "Withdraw and receive full refund" option
- [ ] Easy-to-find support contact

#### If Chargeback Occurs

Evidence package for Stripe dispute response:
1. Commitment confirmation with timestamp
2. Terms of Service acceptance record
3. Email communication history
4. Withdrawal option availability proof
5. For fulfilled campaigns: delivery confirmation, product photos

### §6.4 Chargeback Monitoring

| Metric | Threshold | Action |
|--------|-----------|--------|
| Dispute rate | <0.75% | Normal operations |
| Dispute rate | 0.75-1.0% | Review commitment flow, increase communication |
| Dispute rate | >1.0% | Visa/MC monitoring risk, immediate investigation |

---

## Article VII — Stripe Implementation

### §7.1 Stripe Products Required

| Component | Stripe Product | Purpose |
|-----------|---------------|---------|
| Participant payments | Payment Intents | Charge at commitment |
| Fund holding | Platform Balance | Hold until fulfillment |
| Supplier payouts | Connect Transfers | Pay on fulfillment |
| Refunds | Refunds API | Return funds to participants |
| Supplier onboarding | Connect Express | KYC, bank account verification |

### §7.2 Stripe Connect Configuration

```
Account Type: Express (recommended for Phase 1)
─ Stripe handles KYC and compliance
─ Suppliers connect bank accounts through Stripe
─ Simplest onboarding experience

Charge Type: Separate Charges and Transfers
─ Participant charged to platform account
─ Funds held in platform balance
─ Transfers initiated separately to suppliers
```

### §7.3 Webhook Requirements

| Event | Handler Action |
|-------|---------------|
| `payment_intent.succeeded` | Mark commitment as ACTIVE |
| `payment_intent.payment_failed` | Mark commitment as FAILED, notify participant |
| `charge.refunded` | Mark commitment as REFUNDED, notify participant |
| `charge.dispute.created` | Mark commitment as DISPUTED, alert operations |
| `transfer.created` | Log supplier payment |
| `transfer.failed` | Alert operations, retry logic |

### §7.4 Billing Descriptor

```
Format: ALPMERA *CAMPAIGN_NAME (truncated to 22 chars)
Example: ALPMERA *DYSON-AIRBLA

Requirements:
─ Must include "ALPMERA" for recognition
─ Campaign identifier for support lookup
─ Recognizable on bank statements
```

---

## Article VIII — Data Architecture

### §8.1 Core Entities

**Note:** Updated 2026-01-28 to reflect actual implementation schema.

```sql
-- Campaign (see shared/schema.ts for full definition)
campaigns {
  id                        VARCHAR PRIMARY KEY
  title                     TEXT
  description               TEXT
  unit_price                DECIMAL(12,2)      -- What participants commit per unit
  target_units              INTEGER            -- Goal for campaign success
  min_threshold_units       INTEGER            -- Admin-only: Breakeven threshold (NULL = use target_units)
  state                     campaign_state     -- AGGREGATION, SUCCESS, PROCUREMENT, FULFILLMENT, COMPLETED, FAILED
  aggregation_deadline      TIMESTAMP          -- Campaign close date
  admin_publish_status      admin_publish_status  -- DRAFT, PUBLISHED, HIDDEN
  supplier_id               VARCHAR REFERENCES suppliers(id)  -- [INTERNAL]
  processing_lock           TIMESTAMP          -- For background job coordination
  created_at                TIMESTAMP
  ...
}

-- Commitment (participant's pledge to campaign)
commitments {
  id                        VARCHAR PRIMARY KEY
  campaign_id               VARCHAR REFERENCES campaigns(id)
  user_id                   VARCHAR REFERENCES users(id)
  participant_name          TEXT
  participant_email         TEXT
  quantity                  INTEGER            -- Number of units committed
  amount                    DECIMAL(12,2)      -- quantity × campaign.unit_price
  status                    commitment_status  -- LOCKED, REFUNDED, RELEASED
  reference_number          TEXT UNIQUE        -- Public-facing commitment code
  created_at                TIMESTAMP
  ...
}

-- Escrow Ledger (append-only audit trail of fund movements)
escrow_ledger {
  id                    VARCHAR PRIMARY KEY
  campaign_id           VARCHAR REFERENCES campaigns(id)
  commitment_id         VARCHAR REFERENCES commitments(id)
  entry_type            escrow_entry_type  -- LOCK, REFUND, RELEASE
  amount                DECIMAL(12,2)
  reason                TEXT
  actor                 TEXT              -- Admin username or "SYSTEM_DEADLINE_AUTOMATION"
  created_at            TIMESTAMP
}

-- Admin Action Logs (state transition audit trail)
admin_action_logs {
  id                    VARCHAR PRIMARY KEY
  campaign_id           VARCHAR REFERENCES campaigns(id)
  commitment_id         VARCHAR REFERENCES commitments(id)
  admin_username        TEXT
  action                TEXT
  previous_state        TEXT
  new_state             TEXT
  reason                TEXT
  created_at            TIMESTAMP
}

-- Refund Alerts (failed refund processing tracking)
refund_alerts {
  id                            VARCHAR PRIMARY KEY
  campaign_id                   VARCHAR REFERENCES campaigns(id)
  commitment_id                 VARCHAR REFERENCES commitments(id)
  error_message                 TEXT
  requires_manual_intervention  BOOLEAN DEFAULT true
  resolved_at                   TIMESTAMP
  resolved_by                   TEXT
  created_at                    TIMESTAMP
}
```

**Note on Stripe Integration:**
Stripe payment processing fields (payment_intent_id, refund_id) are tracked in the escrow_ledger's metadata. The escrow ledger serves as the canonical source of truth for all fund movements.

### §8.2 Status Enumerations

**Note:** Updated 2026-01-28 to reflect actual implementation state names.

```sql
-- Commitment status (escrow ledger entry types)
CREATE TYPE commitment_status AS ENUM (
  'LOCKED',         -- Funds committed and locked in escrow
  'REFUNDED',       -- Funds returned to participant (campaign failed)
  'RELEASED'        -- Funds released to supplier (campaign completed)
);

-- Campaign state machine (reflects PRD-aligned lifecycle)
CREATE TYPE campaign_state AS ENUM (
  'AGGREGATION',    -- Open for commitments (maps to "active" in payment flow)
  'SUCCESS',        -- Target met, order processing starting (maps to "goal_reached")
  'PROCUREMENT',    -- Admin coordinating with supplier (maps to "accepted")
  'FULFILLMENT',    -- Supplier fulfilling orders (maps to "fulfilling")
  'COMPLETED',      -- All fulfilled successfully
  'FAILED'          -- Did not reach goal or cancelled
);

-- Campaign publish status (separate from state machine)
CREATE TYPE admin_publish_status AS ENUM (
  'DRAFT',          -- Not yet published (maps to "draft" in payment flow)
  'PUBLISHED',      -- Live and visible to participants
  'HIDDEN'          -- Temporarily hidden from public view
);

-- Supplier payment status
CREATE TYPE payment_status AS ENUM (
  'pending',        -- Transfer initiated
  'processing',     -- In Stripe processing
  'completed',      -- Funds delivered
  'failed',         -- Transfer failed
  'held'            -- Held pending issue resolution
);
```

**State Mapping to Payment Flow Terminology:**
| Database State | Payment Architecture Term | Participant View |
|----------------|---------------------------|------------------|
| DRAFT (publish status) | draft | Not visible |
| AGGREGATION | active | "Campaign is accepting participants" |
| SUCCESS | goal_reached | "Campaign funded!" |
| PROCUREMENT | accepted | "Order being placed" |
| FULFILLMENT | fulfilling | "Supplier is fulfilling" |
| COMPLETED | completed | "Campaign completed successfully" |
| FAILED | failed/cancelled | "Campaign did not succeed" |

---

## Article IX — Legal Framework

### §9.1 Alpmera's Legal Position

| Alpmera IS | Alpmera IS NOT |
|------------|----------------|
| Campaign operator | Seller or retailer |
| Principal in transactions | Payment intermediary |
| Procurement coordinator | Licensed escrow agent |
| Fulfillment overseer | Bank or money transmitter |

### §9.2 Terms of Service Requirements

The Terms of Service MUST include:

#### Fund Commitment Section

```
FUND COMMITMENT AND PROTECTION

When you join a campaign on Alpmera, you commit funds to that campaign.
Your payment method is charged at the time of commitment. This is not
a purchase of goods—it is a commitment to participate in a collective
buying campaign.

Your committed funds are:
- Processed by our payment processor, Stripe, Inc.
- Held in Alpmera's platform balance
- Protected until campaign outcome is determined

Alpmera does not maintain an escrow account. We refer to this
arrangement as "escrow-style protection" because your funds are
not released to any supplier until campaign conditions are satisfied.
```

#### Conditional Release Section

```
CONDITIONAL FUND RELEASE

Committed funds are released to suppliers ONLY when ALL conditions are met:
(a) The campaign reaches its goal within the campaign period
(b) A certified supplier accepts the campaign
(c) Fulfillment is confirmed by Alpmera

If any condition is not met, you receive a full refund.
```

#### Refund Conditions Section

```
REFUND CONDITIONS

You are entitled to a full refund in these circumstances:

(a) VOLUNTARY WITHDRAWAL: You may withdraw from any campaign before
    the campaign closes. Full refund within 5-7 business days.

(b) CAMPAIGN FAILURE: If a campaign does not reach its goal, all
    committed funds are automatically refunded within 5-7 business days.

(c) SUPPLIER NON-ACCEPTANCE: If no certified supplier accepts a
    successful campaign, all committed funds are automatically refunded.

(d) FULFILLMENT FAILURE: If Alpmera determines that a supplier has
    failed to fulfill commitments, affected participants receive
    full refunds.
```

#### Dispute Prevention Section

```
DISPUTES AND CHARGEBACKS

If you believe there is an error with your commitment, contact
support@alpmera.com before disputing the charge with your bank.
We can resolve most issues—including full refunds—within 24-48 hours.

Initiating a chargeback while a campaign is active or while a refund
is being processed may:
- Delay resolution of your concern
- Result in fees that reduce any refund amount
- Affect your ability to participate in future campaigns
```

### §9.3 Supplier Agreement Requirements

#### Payment Terms Section

```
PAYMENT TERMS

1. PAYMENT AMOUNT
Upon successful campaign completion and fulfillment confirmation,
Supplier will receive the procurement price as specified in the
Campaign Agreement. The procurement price is independent of
participant commitment amounts.

2. PAYMENT TIMING
Payment will be initiated within 2 business days after the earlier of:
(a) Expiration of the Inspection Period with no reported issues; or
(b) Alpmera's written confirmation of acceptance.

3. INSPECTION PERIOD
Alpmera shall have 7 calendar days from confirmed delivery to
inspect products and report non-conformance. Products are deemed
accepted if no issues are reported within this period.
```

#### Quality and Remedy Section

```
FULFILLMENT REQUIREMENTS

Supplier shall deliver products that:
(a) Match specifications in Exhibit A
(b) Are free from defects in materials and workmanship
(c) Are properly packaged to prevent shipping damage
(d) Include all required documentation and accessories

NON-CONFORMANCE REMEDY

If products are non-conforming, Supplier shall, at Alpmera's option:
(a) REPLACEMENT: Ship conforming products within [X] days at
    Supplier's expense
(b) REFUND: Refund Alpmera for non-conforming units

Supplier bears all costs of remedy including shipping and
operational costs incurred by Alpmera.
```

---

## Article X — Operational Procedures

### §10.1 Pre-Campaign Checklist

- [ ] Product samples received and reviewed
- [ ] Specifications documented with photos
- [ ] Procurement price negotiated and agreed
- [ ] Campaign price set (procurement + margin)
- [ ] Supplier agreement signed
- [ ] Inspection criteria defined
- [ ] Campaign configured in system

### §10.2 Active Campaign Monitoring

- [ ] Commitment velocity tracking
- [ ] Payment failure rate monitoring
- [ ] Participant communication schedule
- [ ] Goal progress notifications

### §10.3 Post-Goal Checklist

- [ ] Supplier notified of acceptance requirement
- [ ] Fulfillment timeline confirmed
- [ ] Tracking number collection process ready
- [ ] Inspection window communication prepared

### §10.4 Fulfillment Monitoring

- [ ] Shipping confirmation received
- [ ] Tracking monitored for delivery
- [ ] Delivery confirmation logged
- [ ] Inspection window countdown started
- [ ] Issue intake monitored

### §10.5 Payment Release Checklist

- [ ] Inspection window expired
- [ ] Issue rate calculated
- [ ] If <5% issues: Release full payment
- [ ] If ≥5% issues: Hold reserve, initiate resolution
- [ ] Transfer initiated via Stripe Connect
- [ ] Supplier notified of payment

---

## Article XI — Compliance Requirements

### §11.1 Regulatory Considerations

| Requirement | Status | Notes |
|-------------|--------|-------|
| Money Transmitter License | Not required | Stripe is payment processor |
| Escrow License | Not required | Not operating as escrow agent |
| Consumer Protection | Compliance required | Clear terms, refund rights |
| Washington State | Home jurisdiction | ToS governed by WA law |

### §11.2 Recommended Legal Review

Before launch, obtain legal review of:

1. Terms of Service — payment and refund language
2. Supplier Agreement — payment terms and remedy provisions
3. Privacy Policy — payment data handling
4. Fund flow structure — confirm no licensing triggers

### §11.3 Ongoing Compliance

- [ ] Monitor Stripe dispute rate (stay below 0.75%)
- [ ] Maintain clear refund processing (<7 business days)
- [ ] Document all fund movements
- [ ] Preserve communication records for dispute defense

---

## Summary Tables

### Payment Flow Quick Reference

| Event | Participant Impact | Supplier Impact | Alpmera Action |
|-------|-------------------|-----------------|----------------|
| Commitment | Card charged | None | Funds to Stripe balance |
| Withdrawal | Full refund | None | Process refund |
| Campaign fails | Full refund | None | Auto-refund all |
| Campaign succeeds | Status update | Prepare to ship | Notify supplier |
| Shipped | Status update | Awaiting payment | Start inspection window |
| Inspection passes | Complete | Payment released | Transfer to supplier |
| Issue reported | Resolution pending | Payment held | Investigate |

### Risk Mitigation Quick Reference

| Risk | Prevention | Detection | Resolution |
|------|------------|-----------|------------|
| Bad supplier | Certification | Sample review | Don't launch |
| Damaged shipment | Packaging requirements | Inspection window | Supplier remedy |
| Wrong product | Specifications document | Inspection window | Supplier remedy |
| Participant fraud | Photo evidence requirement | Claim review | Deny false claims |
| Chargeback | Clear consent, easy withdrawal | Stripe alerts | Evidence response |

### Fee Structure Quick Reference

| Transaction | Stripe Fee | Alpmera Cost |
|-------------|-----------|--------------|
| Commitment ($100) | $3.20 | $3.20 |
| Successful campaign | Included above | $0 |
| Refund (campaign failed) | ~$0.30 retained | ~$0.30 |
| Refund (voluntary withdrawal) | ~$0.30 retained | ~$0.30 |
| Transfer to supplier | $0.25 + 0.25% | ~$0.43 on $70 |
| Chargeback (lost) | $15 + full amount | $118.20 on $100 |

---

## Enforcement

### Rejection Criteria

Any payment flow, feature, or communication that:

- Exposes procurement pricing to participants
- Exposes campaign pricing to suppliers
- Uses "platform fee" or "commission" language
- Releases funds to suppliers before fulfillment verification
- Bypasses the inspection window
- Makes guarantees that expose Alpmera to unlimited liability

**Must be rejected.**

### Audit Requirements

All payment-related code changes require review against this document.

Payment flow changes require explicit approval from Founder.

---

**End of Payment Architecture**
