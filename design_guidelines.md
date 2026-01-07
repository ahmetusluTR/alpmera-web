# Alpmera Design Guidelines

## Design Approach: Institutional Trust Architecture

**System Foundation:** Carbon Design System principles adapted for financial transparency
**Visual References:** Stripe Dashboard, Coinbase institutional interfaces, Bloomberg Terminal (restrained approach)
**Core Principle:** Clarity, auditability, and institutional trust over conversion optimization

---

## Typography System

**Font Stack:** Inter (primary), IBM Plex Mono (data/code)

**Hierarchy:**
- Hero/H1: 48px/56px, font-weight 600
- H2 (Section): 32px/40px, font-weight 600
- H3 (Card titles): 20px/28px, font-weight 500
- Body: 16px/24px, font-weight 400
- Small/Meta: 14px/20px, font-weight 400
- Data/Numbers: IBM Plex Mono 16px/24px, font-weight 500

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-6, p-8
- Section spacing: py-12, py-16
- Grid gaps: gap-6, gap-8

**Grid Strategy:**
- Homepage: Single column doctrine narrative
- Campaign cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Admin tables: Full-width with fixed column widths
- Status displays: 2-column split (state + timeline)

---

## Component Library

### Navigation
- Top bar with logo left, admin link right
- Minimal navigation - "Campaigns" and "How It Works" only
- Fixed position, subtle bottom border

### Campaign Cards
- Image top (if available), campaign title, participant count, funding progress bar (precise numbers), state badge, timeline metadata
- No CTAs on cards - cards are clickable zones themselves

### State Machine Display
- Prominent state badge (AGGREGATION/SUCCESS/FAILED/FULFILLMENT/RELEASED)
- Timeline component showing: past states (completed), current state (highlighted), future states (dimmed)
- Timestamp for each transition

### Commitment Wizard (4-step)
1. Campaign Rules Review (text-heavy, checkbox acknowledgment)
2. Commitment Amount (calculator-style input with validation)
3. Review & Confirm (summary table)
4. Escrow Confirmation (reference number display)

### Data Tables (Admin Console)
- Fixed header, striped rows
- Sortable columns
- Action buttons at row end
- Inline state transition controls

### Trust Elements
- Escrow reference numbers (monospace font)
- Commitment IDs displayed prominently
- "Append-only ledger" terminology visible
- Admin action logs with timestamps and usernames

---

## Page-Specific Layouts

### Homepage
- Hero: Typography-first (no image) - Large headline about trust-first collective buying, 2-3 sentence doctrine statement
- "How It Works" section: 4-step process with icons
- Active Campaigns grid
- Footer: minimal links, no newsletter

### Campaign Detail
**Layout Order (critical):**
1. Campaign state banner (full-width, current state)
2. Rules section (prominent, expandable if long)
3. Campaign timeline (visual state machine)
4. Product image and description (secondary)
5. Participation stats (funding progress, participant count)
6. Commitment action area

### Failed Campaign Screen
- Large, clear "CAMPAIGN FAILED" message
- Refund information prominent
- Refund status table (commitment amount, refund status, transaction ID)

### Admin Console
- Left sidebar: Campaign list with state filters
- Main area: Selected campaign details + action controls
- Bottom panel: Audit log stream (latest actions)

---

## Interaction Patterns

**Animations:** Minimal - state transitions fade in/out (200ms), no scroll effects
**Loading States:** Skeleton screens for data tables, subtle spinners for actions
**Confirmations:** Modal overlays for destructive actions (refunds, state overrides)
**Validation:** Inline, immediate feedback on forms

---

## Images

**Hero:** No large hero image - typography-first trust statement
**Campaign Images:** Product/offering images at 16:9 aspect ratio, displayed AFTER rules section on detail pages
**Icons:** Heroicons (via CDN) for state badges, timeline markers, and navigation
**Placement Strategy:** Images support documentation, never lead the narrative

---

## Trust-First Visual Treatment

- Prefer tables over cards for financial data
- Show precise numbers, avoid rounding
- Display all IDs/reference numbers in monospace
- Use borders and structure over shadows
- Avoid gradients, prefer solid fills
- No countdown timers or urgency indicators
- State changes are logged, never animated dramatically