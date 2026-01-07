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
**Commitments:** User commitments with reference numbers, locked amounts
**Escrow Ledger:** Append-only record of LOCK/REFUND/RELEASE entries
**Supplier Acceptances:** When suppliers accept successful campaigns
**Admin Action Logs:** Audit trail for all admin actions

## File Structure

```
├── client/src/
│   ├── components/          # Reusable UI components
│   │   ├── layout.tsx       # Main layout with header/footer
│   │   ├── campaign-card.tsx    # Campaign card component
│   │   └── state-timeline.tsx   # Visual state machine timeline
│   ├── pages/
│   │   ├── home.tsx         # Homepage with doctrine + campaign grid
│   │   ├── campaign-detail.tsx  # Campaign detail (rules first)
│   │   ├── commitment-wizard.tsx # 4-step commitment flow
│   │   ├── status.tsx       # Check commitment status
│   │   ├── how-it-works.tsx # Doctrine explanation page
│   │   └── admin.tsx        # Admin console
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
3. **Review & Confirm** - Verify all information
4. **Escrow Confirmation** - Receive reference number

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

The escrow ledger is designed as append-only:
- Entry types: LOCK (commitment), REFUND (failed), RELEASE (success)
- Each entry records balanceBefore and balanceAfter
- No update or delete operations exposed via API
- Double-processing protection on refund/release operations

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
