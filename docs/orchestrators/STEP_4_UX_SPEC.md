# STEP 4 — UX SPECIFICATION
## Admin Console Credits UI — Canon-Compliant Interface Design

**Date:** 2026-01-18
**Orchestrator:** ADMIN_PHASE_1_5_CONTINUATION.md
**Role:** UX Trust Designer

---

## CANON LANGUAGE COMPLIANCE (Absolute Constraints)

### ❌ FORBIDDEN TERMS (Never Use)
- Buy, purchase, order, checkout
- Shop, store, marketplace
- Discount, deal, sale, promotion
- Wallet, cash, money (when referring to credits)
- Points, rewards, loyalty

### ✅ REQUIRED TERMS (Always Use)
- Join (not buy)
- Commit (not order)
- Campaign (not product listing)
- Escrow (not payment)
- Refund/Release (not cancellation)
- Credit balance (not wallet)
- Ledger (not transaction history)
- Adjustment (not correction/fix)

---

## UX BASELINE RULES (Binding)

1. **Boring Consistency:** All list pages use same Card + Table pattern
2. **No Surprises:** Filters above table, actions on right side
3. **Predictable Navigation:** Breadcrumbs, back buttons, linked IDs
4. **Calm Error States:** No red alerts unless critical; use muted warnings
5. **No Confetti:** No animations, no celebratory messaging
6. **Literal Copy:** Describe what happens, not what user "gets" or "achieves"

---

## ADMIN PAGES — ENHANCEMENT SUMMARY

### Existing Pages (Already Implemented)
1. **Credits Ledger List** (`/admin/credits`) — ✅ Exists
2. **Credit Ledger Entry Detail** (`/admin/credits/:id`) — ✅ Exists

### New Pages (Required)
3. **Participant Credit Summary** (`/admin/participants/:id/credits`) — ❌ Missing (NEW)

### Future Pages (Deferred to Completion Credit Engine)
4. **Manual Credit Issuance** (`/admin/credits/issue`) — ⏸️ Deferred (Manual workflow later)
5. **Manual Credit Revocation** (`/admin/credits/revoke`) — ⏸️ Deferred (Exception workflow first)

---

## PAGE 1: CREDITS LEDGER LIST (Existing — No Changes)

**Route:** `/admin/credits`

**Current State:** Already implemented in [credits.tsx](client/src/pages/admin/credits.tsx)

**Features:**
- ✅ Filters: Participant ID, Event Type, Date Range
- ✅ Table: Created At, Participant, Event Type, Amount, Campaign, Reason
- ✅ Color-coded event type badges
- ✅ Links to participant and campaign detail
- ✅ NO export button (competitive safety)
- ✅ NO aggregate totals (competitive safety)

**No Changes Required for Step 4.**

---

## PAGE 2: CREDIT LEDGER ENTRY DETAIL (Existing — No Changes)

**Route:** `/admin/credits/:id`

**Current State:** Already implemented in [credit-detail.tsx](client/src/pages/admin/credit-detail.tsx)

**Features:**
- ✅ Section A: Event Core (ID, type, amount, timestamp, creator, reason)
- ✅ Section B: Participant Context (email, name, current balance)
- ✅ Section C: Related Entities (campaign, commitment, refs)

**No Changes Required for Step 4.**

---

## PAGE 3: PARTICIPANT CREDIT SUMMARY (NEW — Primary Deliverable)

**Route:** `/admin/participants/:id/credits`

**Purpose:** Provide admin with participant-scoped credit overview and ledger history.

**Navigation:**
- Accessed from: Future Participants page (link: "View Credits")
- Or direct URL: `/admin/participants/:participantId/credits`

**Breadcrumb:**
```
Admin > Participants > [Participant Email] > Credits
```

---

### 3.1 Page Header

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Participants                                      │
│                                                              │
│ Participant Credits                                         │
│ [Participant Email] • User ID: usr_abc123                   │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Back button: `← Back to Participants` (or `← Back` if Participants page doesn't exist yet)
- Title: "Participant Credits"
- Subtitle: Participant email + User ID

**Copy Rules:**
- Use "Participant" not "User" or "Customer"
- Show User ID (not "Account Number" or "Customer ID")

---

### 3.2 Summary Cards Section

**Layout: 4-column grid (responsive: 2 cols on tablet, 1 col on mobile)**

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Lifetime     │ Currently    │ Available    │
│ Balance      │ Earned       │ Reserved     │ Balance      │
│              │              │              │              │
│ $50.00 USD   │ $100.00 USD  │ $20.00 USD   │ $30.00 USD   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### Card 1: Total Balance

**Label:** "Total Balance"
**Value:** `$50.00 USD` (formatted with 2 decimals)
**Description:** "Sum of all credit events"

**Data Source:** `GET /api/admin/credits/participant/:id/summary` → `totalBalance`

**Copy:** Use "Total Balance" not "Current Balance" or "Account Balance"

---

#### Card 2: Lifetime Earned

**Label:** "Lifetime Earned"
**Value:** `$100.00 USD`
**Description:** "All credits issued (ISSUED events)"

**Data Source:** `summary.lifetimeEarned`

**Copy:** Use "Earned" not "Awarded" or "Received"

---

#### Card 3: Currently Reserved

**Label:** "Currently Reserved"
**Value:** `$20.00 USD`
**Description:** "Credits held for pending commitments"

**Data Source:** `summary.currentlyReserved`

**Copy:** Use "Reserved" not "Locked" or "Held"

**Visual Note:** If reserved > 0, show warning icon (⚠️) with tooltip: "Reserved credits cannot be used for new commitments until released"

---

#### Card 4: Available Balance

**Label:** "Available Balance"
**Value:** `$30.00 USD`
**Description:** "Credits usable for new commitments"

**Data Source:** `summary.availableBalance`

**Copy:** Use "Available" not "Free" or "Remaining"

**Visual Note:** This is the actionable number (highlighted or bold)

---

### 3.3 Credit Ledger Entries Section

**Title:** "Credit Ledger History"

**Description:** "Append-only record of all credit events for this participant"

**Table Columns:**

| Column | Width | Description |
|--------|-------|-------------|
| **Created At** | 15% | Event timestamp (MMM d, yyyy HH:mm) |
| **Event Type** | 12% | Badge with color coding |
| **Amount** | 12% | +/- amount with color (green/red) |
| **Campaign** | 15% | Campaign name (linked) or "—" |
| **Commitment** | 12% | Commitment ref (linked) or "—" |
| **Reason** | 24% | Full reason text |
| **Created By** | 10% | SYSTEM or admin username |

**Sort:** Default: Created At DESC (most recent first)

**Pagination:** 50 entries per page

**Data Source:** `GET /api/admin/credits?participantId={id}&limit=50&offset={offset}`

---

### 3.4 Empty State

**Condition:** Participant has no credit ledger entries

**Display:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│              No credit history                               │
│                                                              │
│  This participant has not yet received or used any credits.  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Copy:** Use "No credit history" not "No transactions" or "No activity"

---

### 3.5 Loading State

**Display:** Card skeletons for summary cards + table skeleton

**Copy:** "Loading participant credit summary..."

---

### 3.6 Error State

**Condition:** API error (participant not found, network error)

**Display:**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Error loading credit summary                             │
│                                                              │
│ Could not retrieve credit information for this participant.  │
│ [Retry Button]                                               │
└─────────────────────────────────────────────────────────────┘
```

**Copy:** Use "Error loading" not "Failed to load" or "Something went wrong"

---

## PAGE 4: MANUAL CREDIT ISSUANCE (Deferred — Future Phase)

**Route:** `/admin/credits/issue`

**Status:** ⏸️ Deferred to Completion Credit Engine phase

**Reason:** Manual issuance requires:
1. Exception workflow integration (for audit trail)
2. Admin authorization levels (not all admins should issue credits)
3. Idempotency key generation UI
4. Confirmation dialogs with risk warnings

**When Implemented:**
- Form fields: Participant ID, Amount, Reason, Idempotency Key (auto-generated)
- Validation: All fields required, amount > 0, participant exists
- Confirmation: "Issue $X.XX USD credit to [email]?"
- Success: Redirect to participant credit summary

**For Phase 1.5:** Admin uses backend API directly (curl/Postman) if manual issuance needed.

---

## PAGE 5: MANUAL CREDIT REVOCATION (Deferred — Future Phase)

**Route:** `/admin/credits/revoke`

**Status:** ⏸️ Deferred to Exception workflow implementation

**Reason:** Revocation requires:
1. Mandatory Exception record (auditRef)
2. Exception-first workflow (create Exception → then revoke)
3. Available balance verification UI
4. High-severity confirmation dialogs

**When Implemented:**
- Form fields: Participant ID, Amount, Reason, Exception ID (required)
- Pre-check: Display current available balance, warn if insufficient
- Confirmation: "Revoke $X.XX USD credit from [email]? This action is logged as Exception #{id}."
- Success: Redirect to Exception detail + participant credit summary

**For Phase 1.5:** Revocations handled via Exception workflow (manual backend operation).

---

## NAVIGATION UPDATES (Required)

### Option A: Add Participants Page First (Recommended)

**IF** Participants page is implemented:

**Location:** `/admin/participants`

**Participants List Columns:**
- Participant ID
- Email
- Full Name
- Commitments Count
- **Credit Balance** ← NEW COLUMN
- Actions: [View] [View Credits] ← NEW LINK

**Participants Detail Page:**
- Add "Credits" tab or section
- Link to `/admin/participants/:id/credits`

---

### Option B: Direct Link from Credits Ledger (Interim)

**IF** Participants page does not exist yet:

**Credits Ledger List Page:**
- Participant column already links to `/admin/participants/:id` (will 404)
- Change link to `/admin/participants/:id/credits` (participant credit summary)

**Breadcrumb:**
- Credits > Participant Credits (no middle "Participants" page)

---

## COMPONENT PATTERNS (Reuse Existing)

### Card Component
```typescript
<Card>
  <CardHeader>
    <CardTitle>Total Balance</CardTitle>
    <CardDescription>Sum of all credit events</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">$50.00 USD</p>
  </CardContent>
</Card>
```

**Pattern:** Same as existing admin pages (Clearing, Campaigns, etc.)

---

### Table Component
```typescript
<table className="w-full">
  <thead>
    <tr className="border-b">
      <th className="text-left py-3 px-4 font-medium">Created At</th>
      {/* ... */}
    </tr>
  </thead>
  <tbody>
    {entries.map(entry => (
      <tr key={entry.id} className="border-b hover:bg-muted/50">
        <td className="py-3 px-4 text-sm">{format(entry.createdAt)}</td>
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>
```

**Pattern:** Same as Credits Ledger List page (already implemented)

---

### Event Type Badge
```typescript
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
  eventType === "ISSUED" ? "bg-green-100 text-green-800" :
  eventType === "RESERVED" ? "bg-yellow-100 text-yellow-800" :
  eventType === "RELEASED" ? "bg-blue-100 text-blue-800" :
  eventType === "APPLIED" ? "bg-purple-100 text-purple-800" :
  eventType === "REVOKED" ? "bg-red-100 text-red-800" :
  "bg-gray-100 text-gray-800"
}`}>
  {eventType}
</span>
```

**Pattern:** Same as existing Credits pages

---

## COPY CHECKLIST (Pre-Implementation Review)

Before implementing, verify all copy against Canon Language Rules:

- [ ] No retail terms (buy, order, discount, etc.)
- [ ] Use "participant" not "user" or "customer"
- [ ] Use "credit balance" not "wallet" or "account balance"
- [ ] Use "ledger" not "transaction history"
- [ ] Use "join" and "commit" for campaign participation
- [ ] Use "reserved" not "locked" or "frozen"
- [ ] Use "available" not "free" or "remaining"
- [ ] All amounts show currency explicitly ("USD" not "$" alone)
- [ ] No confetti/celebration language ("Congrats!", "You earned!", etc.)
- [ ] Literal descriptions ("Sum of all credit events" not "Your total credits")

---

## ACCESSIBILITY REQUIREMENTS

### Screen Reader Support
- All summary cards have `aria-label` with full description
- Table has `<caption>` for context
- Event type badges have `aria-label` (e.g., "Credit issued")

### Keyboard Navigation
- All links and buttons keyboard-accessible
- Table rows focusable if clickable
- Filter controls tab-accessible

### Color Contrast
- Event type badge text meets WCAG AA contrast (4.5:1)
- Amount colors (green/red) have sufficient contrast
- Avoid color as sole indicator (use +/- symbols)

---

## RESPONSIVE DESIGN

### Desktop (1024px+)
- 4-column summary cards
- Full table with all columns

### Tablet (768px - 1023px)
- 2-column summary cards
- Table scrolls horizontally (all columns visible)

### Mobile (< 768px)
- 1-column summary cards (stacked)
- Table shows: Event Type, Amount, Created At (hide other columns)
- "View Details" link per row

---

## API INTEGRATION POINTS

### GET `/api/admin/credits/participant/:participantId/summary`

**Request:** No query params

**Response:**
```json
{
  "participantId": "usr_abc123",
  "participantEmail": "user@example.com",
  "participantName": "John Doe",
  "currency": "USD",
  "totalBalance": "50.00",
  "breakdown": {
    "lifetimeEarned": "100.00",
    "lifetimeSpent": "30.00",
    "currentlyReserved": "20.00",
    "availableBalance": "30.00"
  },
  "lastUpdated": "2026-01-18T10:30:00Z"
}
```

**Error Handling:**
- 404 Not Found → Show "Participant not found" error state
- 500 Server Error → Show "Error loading credit summary" with retry button

---

### GET `/api/admin/credits?participantId={id}`

**Request:** `participantId` query param (required for participant credit summary)

**Response:** Same as existing Credits Ledger API

**Error Handling:** Same as summary endpoint

---

## FILENAME & ROUTE MAPPING

| Page | Component File | Route | Status |
|------|---------------|-------|--------|
| Credits Ledger List | `client/src/pages/admin/credits.tsx` | `/admin/credits` | ✅ Exists |
| Credit Entry Detail | `client/src/pages/admin/credit-detail.tsx` | `/admin/credits/:id` | ✅ Exists |
| Participant Credit Summary | `client/src/pages/admin/participant-credits.tsx` | `/admin/participants/:id/credits` | ❌ NEW |

**Note:** If Participants page doesn't exist yet, consider route `/admin/credits/participant/:id` as alternative.

---

## IMPLEMENTATION WIREFRAMES (Text Format)

### Participant Credit Summary Page

```
┌───────────────────────────────────────────────────────────────────────┐
│ ← Back to Participants                                    Admin Console │
├───────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Participant Credits                                                    │
│  user@example.com • User ID: usr_abc123                                │
│                                                                         │
├───────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Total       │ │ Lifetime    │ │ Currently   │ │ Available   │   │
│  │ Balance     │ │ Earned      │ │ Reserved    │ │ Balance     │   │
│  │             │ │             │ │             │ │             │   │
│  │ $50.00 USD  │ │ $100.00 USD │ │ $20.00 USD  │ │ $30.00 USD  │   │
│  │             │ │             │ │             │ │             │   │
│  │ Sum of all  │ │ All credits │ │ Held for    │ │ Usable for  │   │
│  │ credit evts │ │ issued      │ │ commitments │ │ new commits │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                         │
├───────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Credit Ledger History                                                  │
│  Append-only record of all credit events for this participant          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Created At     Event Type  Amount      Campaign    Reason       │ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │ Jan 18, 10:30  [ISSUED]    +$50.00 USD  Campaign A Early join   │ │
│  │ Jan 15, 14:20  [RESERVED]  -$20.00 USD  Campaign B Reserved     │ │
│  │ Jan 10, 09:15  [ISSUED]    +$50.00 USD  Campaign C Completion   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  [Prev] Page 1 of 3 [Next]                                             │
│                                                                         │
└───────────────────────────────────────────────────────────────────────┘
```

---

## STEP 4 COMPLETE ✅

**Deliverable Summary:**
- ✅ UX specification for Participant Credit Summary page
- ✅ Canon language compliance verified
- ✅ Component patterns documented (reuse existing)
- ✅ API integration points specified
- ✅ Responsive design considerations
- ✅ Accessibility requirements
- ✅ Copy checklist for pre-implementation review
- ✅ Deferred manual issuance/revocation UX (future phase)

**Primary New Component:**
- `client/src/pages/admin/participant-credits.tsx` — Participant Credit Summary page

**Navigation Decision Required:**
- If Participants page exists → link from there
- If not → interim link from Credits Ledger list

**Next:** Proceed to **Step 5 — Implementation** (Implementer)

---
