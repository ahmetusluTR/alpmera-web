# Alpmera Brand Voice

> Reference for all UI copy, labels, and messaging. Follow these rules exactly.

---

## Core Identity

Alpmera is a **consumer-focused collective buying operator**.

- We run campaigns end-to-end
- We hold participant funds in escrow-style protection
- We manage procurement and fulfillment
- We issue full refunds if campaigns fail

**We are NOT:** a marketplace, a deal site, a B2B buying group, or a middleman.

---

## Terminology Rules

### Required Terms (Always Use)

| Concept | Use This | Never Use |
|---------|----------|-----------|
| The offering | **campaign** | deal, offer, product, listing |
| Taking action | **join campaign** | buy, order, purchase, shop |
| Paying | **commit funds** | pay, checkout, add to cart |
| The person | **participant** | customer, buyer, user, shopper |
| Money protection | **escrow-style protection** | secure payment, safe checkout |
| Campaign progress | **stage + milestone %** | X of Y, X% complete, X needed |
| Campaign succeeds | **campaign completion** | order confirmed, purchase complete |
| Delivery | **fulfillment** | shipping, delivery, dispatch |
| Campaign fails | **campaign did not reach goal** | cancelled, unsuccessful, failed |
| Money return | **full refund** | money back, reimbursement |
| Supplier trust | **Alpmera Certified** | verified, approved, trusted seller |

### Forbidden Words (Never Use)

```
buy, order, purchase, checkout, cart, shop, store
deal, discount, offer, sale, bargain, savings
customer, buyer, shopper, user
seller, vendor, merchant, marketplace
wholesale, procurement, B2B
limited time, act now, don't miss, hurry
X of Y participants, X more needed, target amount
```

---

## Progress Stage Display

**CRITICAL: Never expose participant counts or thresholds.**

```typescript
// Copy these exact strings
const PROGRESS_DISPLAYS = {
  'gathering': 'Gathering (approaching 20%)',
  'gathering-reached': 'Gathering (20% reached)',
  'building': 'Building (approaching 50%)',
  'building-reached': 'Building (50% reached)',
  'momentum': 'Gaining Momentum (approaching 75%)',
  'momentum-reached': 'Gaining Momentum (75% reached)',
  'almost': 'Almost There (approaching 100%)',
  'reached': 'Goal Reached ✓'
};
```

| Actual % | Display |
|----------|---------|
| 0-19% | Gathering (approaching 20%) |
| 20% | Gathering (20% reached) |
| 21-49% | Building (approaching 50%) |
| 50% | Building (50% reached) |
| 51-74% | Gaining Momentum (approaching 75%) |
| 75% | Gaining Momentum (75% reached) |
| 76-99% | Almost There (approaching 100%) |
| 100% | Goal Reached ✓ |

---

## Button Labels

| Action | Label | Never Use |
|--------|-------|-----------|
| Primary CTA | **Join Campaign** | Buy Now, Order Now |
| Commit funds | **Commit $X.XX** | Pay Now, Checkout |
| View details | **View Campaign** | See Deal, View Offer |
| Check status | **Track Progress** | Check Order Status |
| Cancel | **Withdraw from Campaign** | Cancel Order |

---

## Status Messages

```typescript
const STATUS_MESSAGES = {
  // Campaign states
  open: 'Campaign open · {stage} · Closes {date}',
  committed: 'Your funds are protected · Waiting for campaign completion',
  success: 'Goal Reached ✓ · Fulfillment in progress',
  fulfilling: 'Fulfillment underway · Expected arrival: {date_range}',
  failed: 'Campaign did not reach goal · Full refund processing',
  refunded: 'Full refund of ${amount} issued · Allow 5 business days',
  
  // Empty states
  noCampaigns: 'No campaigns are open right now. We'll notify you when new campaigns launch.',
  
  // Errors
  paymentFailed: 'We couldn't process your commitment. Please check your payment details and try again.',
  campaignClosed: 'This campaign has closed. Your funds were never charged.',
  networkError: 'Something went wrong on our end. Your funds are safe. Please try again.'
};
```

---

## Alpmera Certified Badge

Always display on campaign pages:

```
✓ Alpmera Certified Manufacturer
```

- Color: #3A6B5A (Forest Light)
- Placement: Above campaign title

---

## Page Copy Templates

### Campaign Page Hero

```
[✓ Alpmera Certified Manufacturer]

{Campaign Title}

Status: {Progress Stage} · Campaign closes {Date}

Your funds are held in escrow-style protection until this campaign 
reaches its goal and fulfillment begins. If we don't reach our goal, 
you receive a full refund.

[Join Campaign]
```

### Commitment Confirmation

```
You've joined the campaign.

Your commitment of ${amount} is now held in escrow-style protection.

Current status: {Progress Stage}

What happens next:
• Campaign closes {date}
• If successful: We procure and fulfill within {timeframe}
• If unsuccessful: Full refund within 5 business days
```

### Campaign Failure

```
This campaign did not reach its goal.

The campaign closed at {Stage} ({milestone}% reached). 
We needed to reach Goal Reached to proceed with fulfillment.

Your full refund of ${amount} is being processed now. 
You'll see it in your account within 5 business days.

Thank you for being part of this campaign. 
We'll let you know if we run a similar one in the future.
```

---

## FAQ Answers

### "Is my money safe?"

```
Yes. When you commit funds to a campaign, that money is held in 
escrow-style protection. It's not released to anyone—including us—until 
the campaign successfully reaches Goal Reached status and fulfillment 
begins. If the campaign doesn't reach its goal, you receive a full 
refund. Your funds are never at risk.
```

### "What does Alpmera Certified mean?"

```
Every manufacturer on Alpmera goes through our certification process 
before any campaign launches. Alpmera Certified means we've evaluated 
the manufacturer and determined they meet our standards for product 
quality, fulfillment reliability, and consumer protection. We only run 
campaigns with certified manufacturers.
```

### "What happens if a campaign fails?"

```
We issue a full refund. No partial refunds, no credits, no complications. 
If we can't deliver what we promised, you get your money back within 
5 business days.
```

---

## Voice Principles (For Reference)

When writing any copy, follow these principles:

1. **Protective, not promotional** — inform and protect, don't excite or persuade
2. **Explicit, not clever** — clarity over wordplay, no ambiguity
3. **Collective, not transactional** — emphasize group achievement
4. **Accountable, not evasive** — own outcomes, no passive voice
5. **Patient, not urgent** — real deadlines only, no manufactured pressure

---

## Anti-Patterns (Never Do)

| Pattern | Why It's Forbidden |
|---------|-------------------|
| "47 of 50 participants" | Exposes MOQ threshold |
| "Only 3 more needed!" | Reveals threshold gap |
| "94% complete" | Allows reverse calculation |
| "Limited time offer!" | Manufactured urgency |
| "Don't miss out!" | Pressure tactics |
| "Amazing deal!" | Promotional language |
| "Order confirmed" | Retail language |
| Passive voice in failures | Evasive accountability |
