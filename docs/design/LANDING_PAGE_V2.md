# Alpmera Landing Page V2 (Pre-Launch)

Primary source: "Alpmera Pre-Launch Requirements" provided in the request.
Goal: Same overall layout structure as LANDING_PAGE_SPEC, but omit pages/components not used in V2.

---

## Overview
- Single-page, mobile-first landing page.
- Purpose: explain Alpmera's value prop, pre-qualify ideal users, and convert 20-30% to waitlist signups.
- Vibe: pressure-free, rational, premium; "correctness over speed."
- Performance target: <2s load, WCAG 2.1 AA.

---

## Tech Stack
- React + TypeScript + Vite.
- Tailwind CSS for styling.
- Form submission to Node.js endpoint or third-party (Typeform / Google Forms initially).
- Analytics via Google Analytics / Tag Manager.

---

## Page Structure (Single Page)

### Section 1: Hero (Above-the-Fold)
- Full viewport height on mobile (min 100vh).
- Background: subtle gradient (muted blue to white) or abstract illustration (calm group, no crowd).
- H1: "Alpmera: Collective Buying, Built for People--Not Pressure"
- Subheadline (20px): "Aggregate real demand for premium products. Escrow-protected funds. Clear outcomes before you commit. For rational buyers who value clarity over impulse."
- Primary CTA: "Join the Waitlist" (scrolls to the form section).
- Visual: minimal icon (balanced scale) or animated counter placeholder ("0 -> 500: Unlock the Deal").

### Section 2: Pain Points
- H2: "The Problems We're Fixing"
- 3 cards (responsive grid -> stacked on mobile):
  - Fragmented Buying Power: "You buy alone, missing out on group leverage for better prices."
  - Unproven Demand: "Prices are set before real demand is known. Buyers pay for guesswork, overproduction, and unsold inventory baked into the price."
  - Unclear Failure Outcomes: "Most buying systems don’t define what happens if things go wrong. Users only learn the rules after they’ve paid."
- Each card: icon, title, 1-2 sentence body.

### Section 3: How We Flip It
- H2: "Alpmera Does It Differently"
- 3 mirrored cards:
  - Demand First: "We aggregate real commitments before any campaign moves forward—no guessing, no excess."
  - Escrow Protection: "Funds are committed safely and only released when campaign conditions are met."
  - Explicit Outcomes: "Know exactly what happens if the group doesn't hit the target."

### Section 4: Who This Is For
- H2: "Alpmera Isn't for Everyone--By Design"
- Bullets:
  - Educated, rational buyers comfortable waiting 2-4 weeks.
  - Buyers of premium, non-perishable products (high-end gear, niche tech).
  - Prefer control, clarity, and protection over speed.
  - Hates fake urgency and post-purchase surprises.
- Contrast line: "If you need it now, Amazon is better. We're for deliberate decisions."

### Section 5: Interest Form (Primary Conversion)
- Inline CTA in hero + dedicated section.
- Fields:
  - Email (required)
  - Interest Category (Optional)
  - Notes (Optional)
- Submission:
  - POST to backend or third-party.
  - Post-submit: thank-you state + social proof counter ("Join X others").
  - Form validation + accessible labels.

### Section 6: Optional "Learn More" / SEO Content
- 1-2 short articles:
  - "Why Group Buying Needs Escrow"
  - "Group Buying Without Pressure"
- Keep content short; only add if time allows.

### Section 7: Footer
- Links: Privacy Policy, Terms, Contact (email), Social (X: @alpmera).
- Copyright: "Copyright 2026 Alpmera. Made with care in Sammamish, WA."
- Schema: Organization JSON-LD (see SEO section).

---

## Reusable UI Elements (Minimal Set)
- HeroWrapper
- Card (variant: pain vs flip)
- FormInput
- Button (primary/secondary)
- Modal or inline success state
- FooterLink

Do not add extra components beyond these unless required by the page.

---

## Accessibility
- WCAG 2.1 AA.
- Keyboard navigation for all controls.
- ARIA labels for inputs and interactive elements.
- Alt text for icons/illustrations.

---

## Analytics
- Track:
  - CTA clicks (hero + inline form).
  - Form start and submit success.
  - Bounce rate / scroll depth.
- Use GA4 / Tag Manager.

---

## SEO + GEO
- Meta:
  - Title: "Alpmera - Pressure-Free Collective Buying"
  - Description: "Join rational buyers aggregating demand for premium products with escrow protection and clear outcomes."
- H1-H3 hierarchy.
- Schema.org: Organization JSON-LD. Add FAQ schema only if FAQ content is present.
- robots.txt: allow all.
- sitemap.xml: include root URL only (single page).
- Page speed: optimize assets (WebP where applicable).
- GEO:
  - Target US/English-speaking users; set Search Console to "International."
  - Add location in footer copy; avoid local keyword stuffing.

---

## Deployment
- Frontend: Vercel or Netlify.
- Domain: www.alpmera.com with HTTPS.
- Backend (if used): Node.js endpoint (Render/Heroku) for waitlist submissions.

---

## Non-Goals / Exclusions
- No separate Demand page, Privacy page, Terms page, or video section in V2 unless explicitly requested.
- No extra component folders beyond the minimal set listed above.
