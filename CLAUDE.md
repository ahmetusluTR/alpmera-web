# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🚨 CRITICAL: Canon Authority System

**This repository uses a formal Canon system with strict governance.**

**Authority hierarchy (highest to lowest):**
1. [docs/canon/CONSTITUTION.md](docs/canon/CONSTITUTION.md) - Immutable principles
2. [docs/canon/GIT-GOVERNANCE.md](docs/canon/GIT-GOVERNANCE.md) - Git workflow law
3. [docs/architecture/admin/README.md](docs/architecture/admin/README.md) - Admin architecture
4. This file

**Rule:** If instructions conflict with Canon, **Canon wins**. Surface conflicts explicitly—never bypass.

**Quick reference:** [.github/copilot-instructions.md](.github/copilot-instructions.md)

---

## 🔤 Language Doctrine (MANDATORY)

**Constitutional language rules enforced everywhere** (UI, docs, API, code comments):

| ❌ FORBIDDEN | ✅ REQUIRED |
|-------------|------------|
| buy, order, checkout, purchase | join (campaign), commit/lock (funds) |
| pay for, sell, deal, discount | accept, release, cancel, refund |
| marketplace, store, retailer | campaign, escrow, participate, operator |

**Test:** If a user could think "I just bought something," the language is invalid.

**Severity:** Language violations are trust bugs (high priority).

---

## 🎯 What Alpmera Is

**Identity:** Trust-first demand aggregation clearing house / collective buying operator (Phase 1-2)

**IS:**
- Campaign operator (owns and manages campaigns)
- Private coordination layer (buyers ↔ suppliers)
- Escrow-first, campaign-driven

**IS NOT:**
- Store, retailer, marketplace, reseller
- Deal/discount/flash-sale site
- Public marketplace

---

## 💡 Trust Principles (Non-Negotiable)

1. **No Silent Transitions** - All state changes visible/explainable
2. **No Implicit Guarantees** - Conditions explicit until acceptance
3. **No Asymmetry** - Same truth for all participants
4. **No Optimism Bias** - Acknowledge worst-case outcomes
5. **No Trust Debt** - No features that reduce clarity/hide risk

**North Star:** Completed campaigns with zero trust surprises

---

## ⚡ Quick Start Commands

### Development
```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server (http://127.0.0.1:5000)
npm run check                  # TypeScript type checking
```

### Database
```bash
npm run db:push                # Push schema to dev database
npm run db:test:push           # Push schema to test database
npm run db:test:reset          # Reset test database
```

### Testing
```bash
npm test                       # Run all tests
npm test -- path/to/test.ts    # Run specific test
```

### Build
```bash
npm run build                  # Build client + server
npm start                      # Start production server
```

---

### Security Checks
1) PreSecurity Check
before completing any task, run these checks:
- scan for hardcoded secrets, API keys, passwords
- check for SQL injection, shell injection, path traversal
- verify all user inputs are validated
- run the test suite
- check for type errors
2) write 20 unit tests designed to break this function
3) find every security vulnerability in this file. think like a pentester
4) generate 50 edge cases: null, empty strings, negative numbers, unicode, arrays with 100k items
5) audit this entire codebase for leaked secrets


## 🏗️ Architecture Overview

### Monorepo Structure

```
client/src/          React frontend (Vite + TypeScript + Tailwind)
  pages/             Route components (admin, campaigns, auth)
  components/        Shared UI (shadcn/ui)
  lib/               Utilities

server/              Express backend (TypeScript)
  routes.ts          Main API routing logic (191KB - critical file)
  storage.ts         Google Cloud Storage integration
  db.ts              PostgreSQL connection
  tests/             Vitest test suite

shared/schema.ts     Drizzle ORM schema (database source of truth, 24KB)

docs/canon/          Constitutional governance documents
docs/architecture/   Architecture specifications

migrations/          Database migrations (append-only)
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind, shadcn/ui |
| **State** | TanStack Query (server state), React Hook Form + Zod |
| **Routing** | wouter |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (Supabase), Drizzle ORM |
| **Auth** | Passport.js, express-session (PostgreSQL store) |
| **Storage** | Google Cloud Storage |
| **Build** | esbuild (server), Vite (client) |
| **Deploy** | PM2 (backend), Vercel (frontend) |

### Path Aliases

```typescript
@/        → client/src/
@shared/  → shared/
@assets/  → attached_assets/
```

Configured in [vite.config.ts](vite.config.ts) and [vitest.config.ts](vitest.config.ts)

---

## 🔄 Campaign State Machine

```
AGGREGATION → SUCCESS → PROCUREMENT → FULFILLMENT → RELEASED
      ↓           ↓           ↓             ↓
   FAILED      FAILED      FAILED        FAILED
```

**Requirements:**
- All transitions must be logged
- All transitions must be explainable
- No silent state changes
- Preserve trust (no ambiguous money flows)

---

## 🛡️ Git Workflow (MANDATORY)

**Branch model:**
- `dev` - Integration branch (all work happens here)
- `main` - Release branch (protected, PR-only)

**Flow:** `work → dev → PR → main`

**Rules:**
- ✅ Direct commits to `dev`
- ❌ Direct pushes to `main`
- ❌ Force pushes to `main`
- ✅ PRs require 1+ approval

**When committing:**
- Stage specific files (not `git add -A`)
- Follow existing commit message style
- Never commit secrets
- Add: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

---

## 🎨 Admin Console Architecture

**MUST READ before Admin changes:** [docs/architecture/admin/README.md](docs/architecture/admin/README.md)

**Phase 1.5 mandatory surfaces:**
- **Participants** (CRITICAL) - Cross-campaign visibility
- **Commitments** (CRITICAL) - Financial spine, escrow traceability
- **Exceptions** (REQUIRED)
- **Audit** (REQUIRED)

**Design principles:**
- Read-heavy, action-light
- Preserve auditability
- Commitment state traceable: lock → release/refund

**Admin is:** Observability, control, audit
**Admin is NOT:** Marketing tool, CRM, content authoring

---

## 🔑 Key Patterns

### Adding API Endpoints
1. Add route handler in [server/routes.ts](server/routes.ts)
2. Use Zod for request validation
3. Follow existing error handling patterns
4. Respect language doctrine in responses

### Database Schema Changes
1. Modify [shared/schema.ts](shared/schema.ts)
2. Run `npm run db:push` to sync dev database
3. Commit migration SQL in `migrations/`
4. Types automatically flow to client/server
5. Preserve append-only constraints for audit/ledger tables

### Adding UI Components
1. Use shadcn/ui components from `client/src/components/`
2. Follow Tailwind CSS patterns
3. Enforce language doctrine (no forbidden terms)
4. Use TanStack Query for server state
5. Validate forms with React Hook Form + Zod

---

## 🔐 Security & Environment

### Required Environment Variables
```bash
DATABASE_URL      # PostgreSQL connection string
SESSION_SECRET    # Session encryption secret
NODE_ENV          # development | test | production
APP_ENV           # dev | staging | production
PORT              # Server port (default: 5000)
```

### Security Principles
- All secrets in environment variables (never in code)
- `.env` for local development (not committed)
- Escrow-first architecture
- Session-based admin authentication
- Input validation with Zod
- No direct fund handling

### Competitive Safety - DO NOT EXPOSE:
- Total funds collected
- Unit economics
- Supplier pricing tiers
- Margins
- Logistics cost structure

**CAN expose:** Process, status, outcomes, responsibilities, refund guarantees

---

## 🚀 Deployment

| Environment | URL | Details |
|-------------|-----|---------|
| Development | localhost:5000 | Local dev server |
| Staging | api-test.alpmera.com | DigitalOcean + PM2 |
| Production | api.alpmera.com | DigitalOcean + PM2 |
| Frontend | Vercel | Auto-deploys on push |

**Build process:** ([script/build.ts](script/build.ts))
1. Clean `dist/`
2. Build client → `dist/public/`
3. Build server → `dist/index.cjs` (minified, bundled deps)

---

## 📋 Critical Files Reference

| File | Purpose | Size |
|------|---------|------|
| [shared/schema.ts](shared/schema.ts) | Database schema (Drizzle ORM) | 24KB |
| [server/routes.ts](server/routes.ts) | API routing logic | 191KB |
| [server/storage.ts](server/storage.ts) | Cloud storage integration | 37KB |
| [client/src/App.tsx](client/src/App.tsx) | Client routing | 14KB |
| [docs/canon/CONSTITUTION.md](docs/canon/CONSTITUTION.md) | Core principles | - |
| [docs/architecture/admin/README.md](docs/architecture/admin/README.md) | Admin architecture | - |

---

## 🧭 When in Doubt

1. ✅ Check Canon documents first ([docs/canon/](docs/canon/))
2. ✅ Verify language doctrine compliance
3. ✅ Preserve trust principles (no silent transitions)
4. ✅ Default to explicit over implicit
5. ✅ Surface conflicts rather than bypassing
6. ✅ Work on `dev` branch
7. ✅ Choose restraint over persuasion

**If Canon conflicts with instructions:** Canon wins. Surface the conflict explicitly.
