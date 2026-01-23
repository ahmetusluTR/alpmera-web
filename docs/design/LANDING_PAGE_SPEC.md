# Alpmera Landing Page Spec

> **For Claude Code:** Use this spec with BRAND_SYSTEM.md to build the landing page.
> **Components:** Use existing components from `src/components/brand/`

---

## Tech Stack

- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Forms:** Google Sheets API (Apps Script)
- **Video:** YouTube embed (placeholder until ready)
- **Icons:** Lucide React

---

## File Structure

```
src/
├── pages/
│   ├── Landing.tsx          # Main landing page
│   ├── Demand.tsx           # Demand collector page
│   ├── Privacy.tsx          # Privacy policy
│   └── Terms.tsx            # Terms of service
├── components/
│   ├── brand/               # Existing Figma components
│   ├── landing/
│   │   ├── Nav.tsx
│   │   ├── Hero.tsx
│   │   ├── WhatAlpmeraIs.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Safety.tsx
│   │   ├── VideoSection.tsx
│   │   ├── DemandCTA.tsx
│   │   ├── EarlyAccessForm.tsx
│   │   ├── FAQ.tsx
│   │   └── Footer.tsx
│   └── demand/
│       └── DemandForm.tsx
├── lib/
│   └── googleSheets.ts      # Google Sheets integration
└── data/
    └── faqData.ts           # FAQ content for Schema.org
```

---

## Page: Landing (`/`)

### Section 1: Navigation

```tsx
// Nav.tsx
// Fixed top, transparent on scroll, solid on scroll down

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Safety', href: '#safety' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Suggest a Product', href: '/demand' },
];

// Primary CTA in nav: "Join Early List" → scrolls to #early-access
```

**Specs:**
- Logo: `ALPMERA` wordmark, Deep Forest (#1B4D3E)
- Background: Warm Stone (#E8DED1) with 95% opacity on scroll
- Height: 64px
- Padding: `px-6 lg:px-12`

---

### Section 2: Hero

```tsx
// Hero.tsx
// Two-column layout: Left = content, Right = video + trust model
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Nav                                                             │
├─────────────────────────────────┬───────────────────────────────┤
│                                 │                               │
│ ALPMERA                         │  ┌─────────────────────────┐  │
│                                 │  │                         │  │
│ Collective buying, built for    │  │    VIDEO PLACEHOLDER    │  │
│ people—not pressure.            │  │                         │  │
│                                 │  │    [Play button]        │  │
│ Join campaigns, commit funds    │  │                         │  │
│ to escrow, and move forward     │  └─────────────────────────┘  │
│ together only when it's fair    │                               │
│ for everyone.                   │  Trust-First Model            │
│                                 │  ├─ Escrow-protected          │
│ [Join Early List]               │  ├─ Rules-first participation │
│ [Suggest a Product]             │  └─ Clear outcomes            │
│                                 │                               │
└─────────────────────────────────┴───────────────────────────────┘
```

**Copy:**
```
Eyebrow: ALPMERA
Headline: Collective buying, built for people—not pressure.
Subhead: Join campaigns, commit funds to escrow, and move forward together only when it's fair for everyone.
CTA Primary: Join Early List (scrolls to #early-access)
CTA Secondary: Suggest a Product (links to /demand)

Trust Model Card:
- Title: Trust-First Model
- Item 1: Escrow-protected commitments — Funds remain held until the campaign resolves.
- Item 2: Rules-first participation — Explicit conditions before funds are committed.
- Item 3: Clear outcomes — Campaigns complete or refunds follow the rules.
```

**Video Placeholder:**
```tsx
// Until video is ready, show:
// - Warm Stone background
// - Play button icon (centered)
// - Text: "Video coming soon"
// When ready: YouTube embed with lazy loading

const VIDEO_ID = 'PLACEHOLDER'; // Replace with actual YouTube ID

<div className="aspect-video bg-alpmera-secondary rounded-lg flex items-center justify-center">
  {VIDEO_ID === 'PLACEHOLDER' ? (
    <div className="text-center">
      <PlayCircle className="w-16 h-16 text-alpmera-primary mx-auto mb-2" />
      <p className="text-alpmera-text-light">Video coming soon</p>
    </div>
  ) : (
    <iframe 
      src={`https://www.youtube.com/embed/${VIDEO_ID}`}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full rounded-lg"
    />
  )}
</div>
```

---

### Section 3: What Alpmera Is/Not

```tsx
// WhatAlpmeraIs.tsx
// Two-column comparison cards
```

**Copy:**
```
Section Title: What Alpmera is — and what it is not

Left Card - "Alpmera is:"
• A trust-first campaign operator
• A way to pool real demand
• Escrow-protected commitments
• Clear outcomes: completion or refund

Right Card - "Alpmera is not:"
• A store
• A marketplace
• A deal site
• A system built on urgency or hype
```

**Specs:**
- Section padding: `py-24`
- Cards: `bg-white rounded-lg p-8`
- Bullet color: Deep Forest (#1B4D3E) for "is", Muted Burgundy (#8B3A3A) for "is not"

---

### Section 4: How It Works

```tsx
// HowItWorks.tsx
// 5-step grid with visual flow connector
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ How it works                                                    │
│                                                                 │
│ ┌─────────────┐ ──→ ┌─────────────┐                            │
│ │   STEP 1    │     │   STEP 2    │                            │
│ │  Campaign   │     │ Participants│                            │
│ │   opens     │     │    join     │                            │
│ └─────────────┘     └─────────────┘                            │
│                           │                                     │
│                           ▼                                     │
│ ┌─────────────┐     ┌─────────────┐                            │
│ │   STEP 3    │ ←── │   STEP 4    │                            │
│ │  Progress   │     │  Campaign   │                            │
│ │  visible    │     │ completes   │                            │
│ └─────────────┘     └─────────────┘                            │
│       │                                                         │
│       ▼                                                         │
│ ┌─────────────────────────────────┐                            │
│ │            STEP 5               │                            │
│ │  Fulfillment OR Full Refund     │                            │
│ └─────────────────────────────────┘                            │
│                                                                 │
│ Timelines are conditional. If anything changes, it's            │
│ communicated explicitly.                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Copy:**
```
Section Title: How it works

Step 1: A campaign opens with clear rules and participation requirements.
Step 2: Participants join and commit funds to escrow.
Step 3: Progress is visible as the campaign fills.
Step 4: If the campaign completes, Alpmera coordinates procurement and fulfillment.
Step 5: If it doesn't complete, participants receive a full refund from escrow.

Footer note: Timelines are conditional. If anything changes, it's communicated explicitly.
```

**Visual Connector (SVG):**
```tsx
// Create subtle dashed lines connecting the steps
// Color: Deep Forest (#1B4D3E) at 30% opacity
// Style: Dashed, 2px stroke
```

---

### Section 5: Safety

```tsx
// Safety.tsx
// Three-column feature cards with icons
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Safety is the product                                           │
│ ─────────────────────                                           │
│ Every campaign operates under explicit protection               │
│                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│ │     [icon]      │ │     [icon]      │ │     [icon]      │    │
│ │                 │ │                 │ │                 │    │
│ │    Escrow       │ │   Explicit      │ │   Clear exit    │    │
│ │   protection    │ │ state changes   │ │    paths        │    │
│ │                 │ │                 │ │                 │    │
│ │ All committed   │ │ Every campaign  │ │ If a campaign   │    │
│ │ funds remain    │ │ transition is   │ │ doesn't         │    │
│ │ in escrow...    │ │ visible and...  │ │ complete...     │    │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Copy:**
```
Section Title: Safety is the product
Subtitle: Every campaign operates under explicit protection

Card 1:
- Icon: Shield (Lucide)
- Title: Escrow protection
- Body: All committed funds remain in escrow until campaign conditions are met. No exceptions.

Card 2:
- Icon: Eye (Lucide)
- Title: Explicit state changes
- Body: Every campaign transition is visible and communicated. No silent changes.

Card 3:
- Icon: RotateCcw (Lucide)
- Title: Clear exit paths with refunds
- Body: If a campaign doesn't complete, participants receive their full commitment back. No penalties.
```

**Icon Specs:**
- Size: 24px
- Color: Forest Light (#3A6B5A)
- Background: 40px circle, Forest Light at 10% opacity

---

### Section 6: Demand Collector CTA

```tsx
// DemandCTA.tsx
// Simple CTA banner linking to /demand page
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   What should we unlock next?                                   │
│                                                                 │
│   Tell us what products you'd like to see on Alpmera.           │
│   Your suggestions shape our first campaigns.                   │
│                                                                 │
│   [Suggest a Product →]                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Background: Deep Forest (#1B4D3E)
- Text: White
- Button: Muted Gold (#C9A962) background, Deep Forest text
- Padding: `py-16`

---

### Section 7: Early Access Form

```tsx
// EarlyAccessForm.tsx
// Form submits to Google Sheet
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ Join the early list                                             │
│                                                                 │
│ We're launching campaigns in the Seattle area first.            │
│ Sign up to receive notifications when campaigns become          │
│ available.                                                      │
│                                                                 │
│ Email address *                                                 │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ your@email.com                                          │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│ Interest tags (optional)                                        │
│ ☐ Electronics  ☐ Home      ☐ Kitchen                           │
│ ☐ Outdoors     ☐ Fitness   ☐ Kids                              │
│ ☐ Office       ☐ Tools     ☐ Pets                              │
│ ☐ Other                                                         │
│                                                                 │
│ Notes (optional)                                                │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Optional context or priorities                          │    │
│ └─────────────────────────────────────────────────────────┘    │
│ Maximum 500 characters.                                         │
│                                                                 │
│ ☐ Send me campaign notifications when they become available     │
│                                                                 │
│ We'll only send notifications about campaigns. No spam,         │
│ no marketing emails. Privacy Policy                             │
│                                                                 │
│ [Notify me]                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Form Fields → Google Sheet Columns:**
| Field | Column | Required |
|-------|--------|----------|
| email | A | Yes |
| interests | B | No (comma-separated) |
| notes | C | No |
| notify | D | No (boolean) |
| timestamp | E | Auto |
| source | F | Auto ("landing") |

---

### Section 8: FAQ

```tsx
// FAQ.tsx
// Accordion with Schema.org FAQPage markup
```

**Copy:**
```
Section Title: FAQ

Q: Who holds the funds?
A: Committed funds are held in escrow under each campaign's rules. Alpmera coordinates the escrow process but does not access funds until conditions are met.

Q: What happens if a campaign doesn't complete?
A: Participants receive a full refund from escrow. No penalties, no fees deducted.

Q: Is there urgency or limited-time pressure?
A: No. Campaigns have explicit timelines, but Alpmera does not use countdown timers, artificial scarcity, or pressure tactics.

Q: Is Alpmera a store?
A: No. Alpmera operates campaigns where participants pool demand. We coordinate fulfillment but do not hold inventory or function as a retailer.

Q: When will the web app open?
A: We're launching in phases. Early participants will be notified as campaigns become available in their area.
```

**Schema.org Markup:**
```tsx
// Add to <head> via Helmet or document head
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Who holds the funds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Committed funds are held in escrow under each campaign's rules..."
      }
    },
    // ... more questions
  ]
};
```

---

### Section 9: Footer

```tsx
// Footer.tsx
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ALPMERA                                                         │
│                                                                 │
│ Alpmera operates campaign-based collective participation        │
│ with explicit rules.                                            │
│                                                                 │
│ Seattle metropolitan area (initial focus)                       │
│                                                                 │
│                                     Privacy · Terms · Contact   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Page: Demand Collector (`/demand`)

### Full Page Spec

```tsx
// Demand.tsx
// Professional form for product suggestions
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Nav                                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Suggest a Product                                               │
│                                                                 │
│ Help us decide what campaigns to run. Your suggestions          │
│ directly shape our roadmap.                                     │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ Product name or description *                                   │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ e.g., "Sony WH-1000XM5 headphones" or "Premium cast     │    │
│ │ iron cookware"                                          │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│ SKU or model number (optional)          [?] What is SKU?        │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ e.g., WH1000XM5/B                                       │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│ Reference URL (optional)                                        │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Amazon, Walmart, manufacturer website, etc.             │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│ Why do you want this? (optional)                                │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Tell us why this product would be a good fit for        │    │
│ │ collective buying                                       │    │
│ └─────────────────────────────────────────────────────────┘    │
│ Maximum 500 characters.                                         │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ Your location (optional — helps us prioritize by region)        │
│                                                                 │
│ City                              State                         │
│ ┌───────────────────────┐        ┌───────────────────────┐     │
│ │ e.g., Seattle         │        │ Select state ▼        │     │
│ └───────────────────────┘        └───────────────────────┘     │
│                                                                 │
│ Email (optional — to notify when available)                     │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ your@email.com                                          │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│ ☐ Notify me if this product becomes a campaign                  │
│                                                                 │
│ [Submit Suggestion]                                             │
│                                                                 │
│ Your suggestion is anonymous unless you provide an email.       │
│ We review all submissions but cannot guarantee every product    │
│ will become a campaign.                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**SKU Tooltip:**
```
SKU (Stock Keeping Unit) is a unique product identifier.
You can usually find it on the product page near the price
or in the product details section. It helps us identify
the exact product you're suggesting.
```

**Form Fields → Google Sheet Columns:**
| Field | Column | Required |
|-------|--------|----------|
| product_name | A | Yes |
| sku | B | No |
| reference_url | C | No |
| reason | D | No |
| city | E | No |
| state | F | No |
| email | G | No |
| notify | H | No (boolean) |
| timestamp | I | Auto |

---

## Google Sheets Integration

### Sheet Structure

**Sheet 1: "Early Access"**
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| email | interests | notes | notify | timestamp | source |

**Sheet 2: "Demand Suggestions"**
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| product_name | sku | reference_url | reason | city | state | email | notify | timestamp |

### Google Apps Script

```javascript
// Code.gs - Deploy as Web App

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(data.sheet);
    
    if (data.sheet === 'Early Access') {
      sheet.appendRow([
        data.email,
        data.interests || '',
        data.notes || '',
        data.notify || false,
        new Date().toISOString(),
        data.source || 'landing'
      ]);
    } else if (data.sheet === 'Demand Suggestions') {
      sheet.appendRow([
        data.product_name,
        data.sku || '',
        data.reference_url || '',
        data.reason || '',
        data.city || '',
        data.state || '',
        data.email || '',
        data.notify || false,
        new Date().toISOString()
      ]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Alpmera Forms API')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

### Frontend Integration

```typescript
// lib/googleSheets.ts

const GOOGLE_SCRIPT_URL = 'YOUR_DEPLOYED_SCRIPT_URL';

interface EarlyAccessData {
  email: string;
  interests?: string[];
  notes?: string;
  notify?: boolean;
}

interface DemandSuggestionData {
  product_name: string;
  sku?: string;
  reference_url?: string;
  reason?: string;
  city?: string;
  state?: string;
  email?: string;
  notify?: boolean;
}

export async function submitEarlyAccess(data: EarlyAccessData): Promise<boolean> {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        sheet: 'Early Access',
        email: data.email,
        interests: data.interests?.join(', ') || '',
        notes: data.notes || '',
        notify: data.notify || false,
        source: 'landing'
      }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Form submission error:', error);
    return false;
  }
}

export async function submitDemandSuggestion(data: DemandSuggestionData): Promise<boolean> {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        sheet: 'Demand Suggestions',
        ...data
      }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Form submission error:', error);
    return false;
  }
}
```

---

## SEO Requirements

### Meta Tags (add to each page)

```tsx
// Landing page
<Helmet>
  <title>Alpmera — Collective Buying, Built for People</title>
  <meta name="description" content="Join campaigns, commit funds to escrow, and move forward together only when it's fair for everyone. Trust-first collective buying." />
  <meta property="og:title" content="Alpmera — Collective Buying, Built for People" />
  <meta property="og:description" content="Trust-first collective buying. Escrow-protected commitments with clear outcomes." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://alpmera.com" />
  <link rel="canonical" href="https://alpmera.com" />
</Helmet>

// Demand page
<Helmet>
  <title>Suggest a Product — Alpmera</title>
  <meta name="description" content="Tell us what products you'd like to see on Alpmera. Your suggestions shape our campaigns." />
  <link rel="canonical" href="https://alpmera.com/demand" />
</Helmet>
```

### Sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://alpmera.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://alpmera.com/demand</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://alpmera.com/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://alpmera.com/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

### robots.txt

```
User-agent: *
Allow: /
Sitemap: https://alpmera.com/sitemap.xml
```

---

## State Dropdown Data

```typescript
// data/usStates.ts
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  // ... full list
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];
```

---

## Success States

### Early Access Form

```
Submission successful:
- Show: "You're on the list. We'll notify you when campaigns launch in your area."
- Button changes to: "✓ Subscribed"
- Disable form

Submission failed:
- Show: "Something went wrong. Please try again."
- Keep form enabled
```

### Demand Form

```
Submission successful:
- Show: "Thank you. Your suggestion has been recorded."
- Optionally show: "Suggest another product" button to reset form

Submission failed:
- Show: "Something went wrong. Please try again."
- Keep form enabled
```

---

## Claude Code Prompts

Use these prompts in sequence to build the landing page:

### 1. Setup
```
Read BRAND_SYSTEM.md and LANDING_PAGE_SPEC.md. Set up the file structure as specified. Use existing components from src/components/brand/.
```

### 2. Build Sections
```
Build the Hero section following LANDING_PAGE_SPEC.md Section 2. Include video placeholder and trust model sidebar.
```

```
Build the HowItWorks section with visual flow connectors between steps.
```

```
Build the EarlyAccessForm component with Google Sheets integration.
```

### 3. Demand Page
```
Build the /demand page with the DemandForm component following the spec. Include SKU tooltip and state dropdown.
```

### 4. SEO
```
Add Helmet meta tags, FAQ Schema.org markup, and create sitemap.xml and robots.txt.
```

---

**End of Spec**
