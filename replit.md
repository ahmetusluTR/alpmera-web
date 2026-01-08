# Alpmera - Trust-First Collective Buying Platform

## Overview
Alpmera is a campaign-based collective buying platform that prioritizes trust, auditability, and correctness over speed or conversion optimization. Users join campaigns and make escrow-style commitments where funds are locked (not spent) until campaign conditions are met.

**Key Principles:**
- Trust over speed - No countdown timers, urgency tactics, or growth hacks
- Escrow-style commitments - Funds are locked until campaign success or failure
- Append-only ledger - All fund movements are recorded immutably
- Transparent state machine - Clear campaign lifecycle with auditable transitions

## Architecture

### Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Routing:** wouter (frontend), Express routes (backend)
- **State Management:** TanStack Query (React Query v5)

### Campaign State Machine
```
AGGREGATION → SUCCESS → FULFILLMENT → RELEASED
     ↓           ↓           ↓
   FAILED     FAILED      FAILED
```

**States:**
- **AGGREGATION:** Campaign accepting commitments until deadline
- **SUCCESS:** Target met, awaiting supplier acceptance
- **FAILED:** Target not met or campaign cancelled (terminal)
- **FULFILLMENT:** Supplier fulfilling orders
- **RELEASED:** Funds released to supplier (terminal)

### Data Models

**Campaigns:** Campaign details, rules, target, state, deadline
**Commitments:** User commitments with reference numbers, locked amounts (optional user_id FK)
**Escrow Ledger:** Append-only record of LOCK/REFUND/RELEASE entries
**Supplier Acceptances:** When suppliers accept successful campaigns
**Admin Action Logs:** Audit trail for all admin actions

**User Authentication (Phase 1.5):**
- **Users:** id (UUID), email (unique), created_at
- **User Profiles:** delivery addresses, contact info linked to user_id
- **User Sessions:** session tokens with 30-day expiry, httpOnly cookies
- **Auth Codes:** 6-digit passwordless login codes (hashed with salt), 10-min TTL, single-use

**USA-Only Delivery (Phase 1):**
- Country is hardcoded to "USA" (read-only display)
- State field uses dropdown with 50 US states + DC (USPS abbreviations)
- Backend schema unchanged - state stores abbreviation (e.g., "CA", "NY", "TX")

## File Structure

```
├── client/src/
│   ├── components/          # Reusable UI components
│   │   ├── layout.tsx       # Main layout with header/footer
│   │   ├── campaign-card.tsx    # Campaign card component
│   │   ├── state-timeline.tsx   # Visual state machine timeline
│   │   └── timeline.tsx         # Shared timeline component for events/ledger
│   ├── pages/
│   │   ├── home.tsx         # Homepage with doctrine + campaign grid
│   │   ├── campaign-detail.tsx  # Campaign detail (rules first)
│   │   ├── commitment-wizard.tsx # 4-step commitment flow
│   │   ├── status.tsx       # Check commitment status
│   │   ├── how-it-works.tsx # Doctrine explanation page
│   │   ├── admin.tsx        # Admin console
│   │   └── account/         # Account module with navigation
│   │       ├── layout.tsx   # Account layout shell with sidebar
│   │       ├── index.tsx    # Redirects to /account/commitments
│   │       ├── profile.tsx  # Delivery profile form
│   │       ├── commitments.tsx  # User's commitments list
│   │       ├── payments.tsx # Payments & escrow ledger
│   │       ├── refunds.tsx  # Refund history
│   │       └── security.tsx # Session management
│   ├── App.tsx              # Router and providers
│   └── index.css            # Tailwind + custom styles
├── server/
│   ├── db.ts                # Drizzle database connection
│   ├── routes.ts            # API endpoints
│   └── storage.ts           # DatabaseStorage implementation
├── shared/
│   └── schema.ts            # Drizzle schemas + types
├── scripts/
│   └── seed.ts              # Seed 6 sample campaigns
└── design_guidelines.md     # UI/UX design system
```

## API Routes

### Public Endpoints
- `GET /api/campaigns` - List all campaigns with stats
- `GET /api/campaigns/:id` - Get single campaign with stats
- `POST /api/campaigns/:id/commit` - Create commitment (lock funds)
- `GET /api/commitments/:reference` - Get commitment by reference

### User Authentication Endpoints
- `POST /api/auth/start` - Request login code (logs to console in dev)
- `POST /api/auth/verify` - Verify code and create session
- `GET /api/auth/session` - Check current session status
- `POST /api/auth/logout` - Destroy session and clear cookie
- `GET /api/me` - Get current user and profile (protected)
- `PATCH /api/me/profile` - Update user profile (protected)
- `GET /api/account/commitments` - Get user's own commitments with campaign details and lastCampaignStatusUpdate (protected)
- `GET /api/account/commitments/:code` - Get commitment detail by reference code with escrow entries and status transitions (protected)
- `GET /api/account/escrow` - Get user's escrow movements (append-only ledger entries) (protected)
- `GET /api/account/escrow/:id` - Get escrow movement detail with related entries timeline (protected)

### Commitment Linking
- When authenticated, `POST /api/campaigns/:id/commit` attaches `user_id` to the commitment
- Anonymous commitments still work (user_id is null) - backward compatible
- `participantEmail` is always stored for audit/legacy purposes

### Admin Endpoints
- `GET /api/campaigns/:id/commitments` - List campaign commitments
- `POST /api/admin/campaigns/:id/transition` - Change campaign state
- `POST /api/admin/campaigns/:id/refund` - Process refunds for failed campaign
- `POST /api/admin/campaigns/:id/release` - Release funds for completed campaign
- `GET /api/admin/logs` - Get admin action audit log
- `GET /api/admin/campaigns/:id/escrow` - Get escrow ledger entries

## Key Features

### 4-Step Commitment Wizard
1. **Review Rules** - Read and accept campaign rules
2. **Commitment Amount** - Enter details and select quantity
3. **Review & Confirm** - Verify all information (requires auth + complete profile)
4. **Escrow Confirmation** - Receive reference number

**Profile Return Path:**
- If user needs to complete profile at step 3, clicking "Complete profile" redirects to `/account?returnTo=/campaign/{id}/commit?step=3`
- After saving profile, user is automatically redirected back to step 3 with profile unlocked
- Auth context is refetched on wizard mount to ensure profile completeness is up-to-date

### Escrow Ledger (Append-Only)
- Every fund movement creates an immutable entry
- Entry types: LOCK (commitment), REFUND (failed), RELEASE (success)
- Tracks balance before/after for each entry
- No updates or deletes allowed

### Admin Console
- Campaign list with state filters
- State transition controls with validation
- Commitment table per campaign
- Process refunds/releases
- Audit log stream

## Running the Application

```bash
# Push database schema
npm run db:push

# Seed sample data
npx tsx scripts/seed.ts

# Start development server
npm run dev
```

## Security Configuration

### Admin API Authentication

**Development Mode:**
- GET requests to admin endpoints are allowed (read-only)
- POST requests require `adminUsername` in request body (for audit trail)
- All admin actions are logged to the append-only audit trail

**Production Mode:**
- Set `ADMIN_API_KEY` environment variable with a secure random string
- All admin requests must include `x-admin-auth` header matching the API key
- If `ADMIN_API_KEY` is not configured, all admin endpoints return 503
- Invalid authentication attempts are logged with IP address

```bash
# Production setup
ADMIN_API_KEY=your-secure-random-key-here
```

### Escrow Ledger Integrity

The escrow ledger uses the append-only ledger pattern where balances are **derived**, not stored:
- Entry types: LOCK (commitment), REFUND (failed), RELEASE (success)
- Each entry records: `actor` (who performed the action) and `reason` (why)
- Balances computed by summing LOCK entries and subtracting REFUND/RELEASE entries
- No update or delete operations exposed via API
- Double-processing protection on refund/release operations

**Migrations applied:**
1. `migrations/001_escrow_ledger_derived_balances.sql` - Removed balance columns, added actor/reason
2. `migrations/002_escrow_ledger_reason_not_null.sql` - Made reason NOT NULL, added indexes

**Standardized reason codes:**
- `commitment_created` - LOCK entry when participant commits
- `campaign_failed_refund` - REFUND entry when admin processes failed campaign
- `admin_release` - RELEASE entry when admin releases funds to supplier

## Design Philosophy

Following the design guidelines, the platform uses:
- **Typography:** Inter (primary), IBM Plex Mono (data/numbers)
- **Colors:** Neutral palette with institutional trust aesthetic
- **Layout:** Rules-first on campaign details, no urgency messaging
- **Interactions:** Minimal animations, focus on clarity
- **Trust Elements:** Monospace reference numbers, visible IDs, append-only terminology

## Sample Data

The seed script creates 6 campaigns:
- 3 in AGGREGATION (Solar Panels, Coffee, Olive Oil)
- 1 in SUCCESS (Electric Cargo Bikes)
- 1 in FAILED (Community Tool Library)
- 1 in FULFILLMENT (Bamboo Furniture)
