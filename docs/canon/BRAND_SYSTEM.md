# Alpmera — Brand Canon

> **Single source of truth for all Alpmera UI, copy, and design decisions.**
> Claude Code: Read this file before building any component or writing any copy.

---

## 1. Brand Identity

Alpmera is a **trust-first collective buying operator**.

```
WE ARE:                     WE ARE NOT:
─────────────────────────────────────────
Operator                    Marketplace
Protective                  Promotional
Explicit                    Clever
Collective-focused          Transactional
Accountable                 Evasive
Patient                     Urgent
Consumer-first              Growth-first
```

**Core rule:** If it feels like e-commerce, it violates canon.

---

## 2. Visual Pillars

All design decisions must pass these filters:

1. Trust before attraction
2. Clarity before persuasion
3. Process before promise
4. Calm before excitement
5. Durability before trendiness

Design reduces anxiety. It never creates conversion pressure.

---

## 3. Color System

### 3.1 Palette

```css
:root {
  /* Primary */
  --color-primary: #1B4D3E;        /* Deep Forest - headers, CTAs, authority */
  --color-secondary: #E8DED1;      /* Warm Stone - backgrounds, cards, canvas */
  
  /* Accent */
  --color-accent: #C9A962;         /* Muted Gold - highlights, key actions */
  --color-success: #3A6B5A;        /* Forest Light - success, completion */
  --color-danger: #8B3A3A;         /* Muted Burgundy - errors, failures */
  
  /* Neutral */
  --color-text: #2D2D2D;           /* Soft Black - body text */
  --color-text-light: #5A5A5A;     /* Secondary text */
  --color-background: #FAFAF8;     /* Off-white warm */
  --color-border: #D4CFC7;         /* Warm gray */
  --color-table-alt: #F5F2ED;      /* Alternating rows */
}
```

### 3.2 Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'alpmera': {
          'primary': '#1B4D3E',
          'secondary': '#E8DED1',
          'accent': '#C9A962',
          'success': '#3A6B5A',
          'danger': '#8B3A3A',
          'text': '#2D2D2D',
          'text-light': '#5A5A5A',
          'background': '#FAFAF8',
          'border': '#D4CFC7',
          'table-alt': '#F5F2ED',
        }
      },
      fontFamily: {
        'display': ['Libre Baskerville', 'Georgia', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  }
}
```

### 3.3 Color Rules

**Allowed:**
- Primary (#1B4D3E) for authority, headers, primary actions
- Accent (#C9A962) for highlights, sparingly
- Success (#3A6B5A) for completion states only

**Forbidden:**
- Red for urgency
- Green for profit/savings
- Any color implying discounts
- Harsh whites or neon accents

---

## 4. Typography

### 4.1 Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| H1 | Libre Baskerville | 400 | 48px (3rem) | 1.2 |
| H2 | Libre Baskerville | 400 | 32px (2rem) | 1.25 |
| H3 | Libre Baskerville | 400 | 24px (1.5rem) | 1.3 |
| Body | Inter | 400 | 16px (1rem) | 1.5 |
| Body Small | Inter | 400 | 14px (0.875rem) | 1.5 |
| UI/Labels | Inter | 500 | 14px (0.875rem) | 1.4 |
| Caption | Inter | 400 | 12px (0.75rem) | 1.4 |

### 4.2 Typography Rules

- Minimum body size: **16px** (enforced)
- Use tabular numbers for data
- Typography must reduce cognitive load
- Feel: financial, editorial, calm, serious
- Never: playful, trendy, casual

---

## 5. Terminology

### 5.1 Required Terms

| Concept | Always Use | Never Use |
|---------|------------|-----------|
| Offering | **campaign** | deal, offer, product |
| Action | **join campaign** | buy, order, purchase |
| Payment | **commit funds** | pay, checkout, cart |
| Person | **participant** | customer, buyer, user |
| Protection | **escrow-style protection** | secure payment |
| Progress | **stage + milestone %** | X of Y, X% complete |
| Success | **campaign completion** | order confirmed |
| Delivery | **fulfillment** | shipping, delivery |
| Failure | **campaign did not reach goal** | cancelled, failed |
| Refund | **full refund** | money back |
| Trust | **Alpmera Certified** | verified, approved |

### 5.2 Forbidden Words

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

## 6. Progress Stage System

### 6.1 Core Rule

**Never expose participant counts, thresholds, or precise percentages.**

Progress shows state, not hype. It answers "Where am I?" not "How excited should I be?"

### 6.2 Stage Logic

```typescript
function getProgressDisplay(percentage: number): string {
  if (percentage === 100) return "Goal Reached ✓";
  if (percentage >= 76) return "Almost There (approaching 100%)";
  if (percentage === 75) return "Gaining Momentum (75% reached)";
  if (percentage >= 51) return "Gaining Momentum (approaching 75%)";
  if (percentage === 50) return "Building (50% reached)";
  if (percentage >= 21) return "Building (approaching 50%)";
  if (percentage === 20) return "Gathering (20% reached)";
  return "Gathering (approaching 20%)";
}
```

### 6.3 Stage Reference

| Range | Stage | Display |
|-------|-------|---------|
| 0-19% | Gathering | "Gathering (approaching 20%)" |
| 20% | Gathering | "Gathering (20% reached)" |
| 21-49% | Building | "Building (approaching 50%)" |
| 50% | Building | "Building (50% reached)" |
| 51-74% | Gaining Momentum | "Gaining Momentum (approaching 75%)" |
| 75% | Gaining Momentum | "Gaining Momentum (75% reached)" |
| 76-99% | Almost There | "Almost There (approaching 100%)" |
| 100% | Goal Reached | "Goal Reached ✓" |

---

## 7. Components

### 7.1 Button

Buttons represent **commitment**, not impulse.

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
```

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| primary | #1B4D3E | white | none |
| secondary | transparent | #1B4D3E | 1px #1B4D3E |
| ghost | transparent | #1B4D3E | none |

**Specs:** `padding: 12px 24px`, `border-radius: 6px`, `font: Inter 500 14px`

**Labels:**

| Action | Use | Never Use |
|--------|-----|-----------|
| Primary CTA | Join Campaign | Buy Now |
| Commit | Commit $X.XX | Pay Now |
| View | View Campaign | See Deal |
| Status | Track Progress | Check Order |
| Cancel | Withdraw from Campaign | Cancel Order |

**Forbidden:** flashing, bouncing, urgency animation

### 7.2 Card

```typescript
// bg-alpmera-secondary border border-alpmera-border rounded-lg p-6 shadow-sm
```

| Property | Value |
|----------|-------|
| Background | #E8DED1 |
| Border | 1px solid #D4CFC7 |
| Border Radius | 8px |
| Padding | 24px |
| Shadow | 0 1px 3px rgba(45, 45, 45, 0.08) |

### 7.3 Badge

```typescript
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'outline';
```

| Variant | Background | Text |
|---------|------------|------|
| default | #1B4D3E | white |
| success | #3A6B5A | white |
| warning | #C9A962 | #2D2D2D |
| danger | #8B3A3A | white |
| outline | transparent | #1B4D3E |

**Specs:** `padding: 4px 12px`, `border-radius: 9999px`, `font: Inter 500 12px`

### 7.4 Status Tag

```typescript
type StatusTagVariant = 'info' | 'success' | 'progress' | 'danger';
```

| Variant | Background | Text | Use |
|---------|------------|------|-----|
| info | #1B4D3E/10 | #1B4D3E | Neutral info |
| success | #3A6B5A/10 | #3A6B5A | Goal reached |
| progress | #C9A962/10 | #C9A962 | In progress |
| danger | #8B3A3A/10 | #8B3A3A | Failed, error |

### 7.5 Alpmera Certified Badge

```typescript
// Fixed component — displays on all campaign pages
// ✓ Alpmera Certified Manufacturer
// Color: #3A6B5A, Font: Inter SemiBold 14px
// Placement: Above campaign title
```

### 7.6 Form Inputs

| Property | Value |
|----------|-------|
| Background | white |
| Border | 1px solid #D4CFC7 |
| Border (focus) | 1px solid #1B4D3E |
| Border Radius | 6px |
| Padding | 12px 16px |
| Font | Inter 400 16px |

### 7.7 Toast / Banner

| Type | Background | Border Left | Icon |
|------|------------|-------------|------|
| success | #3A6B5A/10 | 4px #3A6B5A | #3A6B5A |
| error | #8B3A3A/10 | 4px #8B3A3A | #8B3A3A |
| info | #1B4D3E/10 | 4px #1B4D3E | #1B4D3E |
| warning | #C9A962/10 | 4px #C9A962 | #C9A962 |

---

## 8. Status Messages

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

## 9. Page Templates

### 9.1 Campaign Hero

```
[✓ Alpmera Certified Manufacturer]

{Campaign Title}

Status: {Progress Stage} · Campaign closes {Date}

Your funds are held in escrow-style protection until this campaign 
reaches its goal and fulfillment begins. If we don't reach our goal, 
you receive a full refund.

[Join Campaign]
```

### 9.2 Commitment Confirmation

```
You've joined the campaign.

Your commitment of ${amount} is now held in escrow-style protection.

Current status: {Progress Stage}

What happens next:
• Campaign closes {date}
• If successful: We procure and fulfill within {timeframe}
• If unsuccessful: Full refund within 5 business days
```

### 9.3 Campaign Failure

```
This campaign did not reach its goal.

The campaign closed at {Stage} ({milestone}% reached). 
We needed to reach Goal Reached to proceed with fulfillment.

Your full refund of ${amount} is being processed now. 
You'll see it in your account within 5 business days.
```

---

## 10. Imagery Rules

### Allowed

- Materials, textures
- Products under inspection
- Manufacturing environments
- Neutral, natural lighting
- Abstract textures

### Forbidden

- Smiling people
- Lifestyle marketing
- Handshakes
- Celebration imagery
- Stock collaboration photos

Imagery must feel **quiet, precise, real**.

---

## 11. Iconography

- Simple line icons only
- Rounded geometry
- Functional meaning only
- Icons explain — they do not decorate

---

## 12. Spacing & Layout

### Spacing Scale (4px base)

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

### Border Radius

| Token | Value | Use |
|-------|-------|-----|
| sm | 4px | Small elements |
| md | 6px | Buttons, inputs |
| lg | 8px | Cards |
| xl | 12px | Modals |
| full | 9999px | Badges, pills |

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(45, 45, 45, 0.05);
--shadow-md: 0 1px 3px rgba(45, 45, 45, 0.08);
--shadow-lg: 0 4px 12px rgba(45, 45, 45, 0.1);
```

### Z-Index

| Token | Value | Use |
|-------|-------|-----|
| dropdown | 10 | Dropdowns |
| sticky | 20 | Sticky headers |
| modal | 30 | Modals |
| toast | 40 | Toasts |

---

## 13. Logo Rules

### Mark Requirements

- Geometric, restrained, non-literal
- Must work in monochrome
- Suggests: containment, aggregation, completion

### Forbidden

- Shopping metaphors
- Arrows, carts, price tags, badges, flames
- Speed or growth imagery

### Usage

- Minimum digital size: 24px height
- Minimum print size: 10mm height
- Always allow generous whitespace
- Never place on busy imagery
- Animation only for state change, never excitement

---

## 14. Enforcement

### Rejection Criteria

Any asset that:

- Feels salesy
- Creates urgency
- Looks like e-commerce
- Optimizes for excitement
- Uses forbidden terminology
- Exposes participant counts or thresholds

**Must be rejected.**

### Validation Checklist

Before shipping any UI:

```
[ ] Uses only approved terminology
[ ] No forbidden words present
[ ] Progress shows stages, not counts
[ ] Colors match palette exactly
[ ] Typography follows specs
[ ] No urgency or promotional tone
[ ] Feels like institution, not startup
```

---

## 15. FAQ Copy

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
quality, fulfillment reliability, and consumer protection.
```

### "What happens if a campaign fails?"

```
We issue a full refund. No partial refunds, no credits, no complications. 
If we can't deliver what we promised, you get your money back within 
5 business days.
```

---

**Canon Authority:** This file is the single source of truth.
**Last Updated:** January 2025
