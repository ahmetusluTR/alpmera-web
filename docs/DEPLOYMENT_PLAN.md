# Alpmera Landing Page Deployment Plan

## Overview

This document guides the deployment of the updated landing page with Product Requests feature.

**What Changed:**
- Landing page now makes API calls (previously static)
- New database tables: `product_requests`, `product_request_votes`, `product_request_events`, `sku_verification_jobs`
- Background worker: SKU verification
- Admin page for managing product requests

**Architecture:**
```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Landing Page      │────▶│   Backend API       │────▶│   Database          │
│   (Vercel)          │     │   (DigitalOcean)    │     │   (Supabase)        │
│   alpmera.com       │     │   api.alpmera.com   │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## CRITICAL ISSUE: CORS Not Configured

**Problem:** The server currently has NO CORS (Cross-Origin Resource Sharing) middleware. This means:
- When landing page (alpmera.com) calls API (api.alpmera.com)
- The browser will BLOCK all requests
- Nothing will work!

**Solution:** We need to add CORS middleware before deployment. See Section 2.

---

## Section 1: Database Setup (Supabase)

### 1.1 Create Production Database

You currently have only a dev database. For production, you have two options:

**Option A: Single Database (Simple, Not Recommended for Production)**
- Use the same dev database for production
- Risk: Development mistakes can affect production data
- Good for: Initial launch with low traffic

**Option B: Separate Production Database (Recommended)**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Settings:
   - Name: `alpmera-production`
   - Database Password: Generate a strong password (save it!)
   - Region: Choose closest to your users (likely US West for Seattle)
   - Plan: Free tier is fine for starting
4. Wait for database to be created (~2 minutes)
5. Go to Settings → Database → Connection string
6. Copy the "URI" - this is your `DATABASE_URL`

### 1.2 Run Migrations

After creating the database, run all migrations:

**Method 1: Using Supabase SQL Editor (Recommended for beginners)**
1. Go to Supabase Dashboard → SQL Editor
2. Open each migration file in order:
   - `migrations/001_escrow_ledger_derived_balances.sql`
   - `migrations/002_escrow_ledger_reason_not_null.sql`
   - `migrations/003_escrow_ledger_append_only.sql`
   - `migrations/004_idempotency_keys.sql`
   - `migrations/005_consolidation_point_contacts.sql`
   - `migrations/006_landing_subscribers.sql`
   - `migrations/007_product_requests.sql` ← NEW: Required for Product Requests
3. Copy/paste each file content and run

**Method 2: Using Command Line**
```bash
# Set the production database URL
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# Run migrations using psql (if installed)
psql $DATABASE_URL -f migrations/007_product_requests.sql
```

### 1.3 Verify Migration Success

Run this query in Supabase SQL Editor to verify:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'product_requests',
  'product_request_votes',
  'product_request_events',
  'sku_verification_jobs'
);
```

Expected: 4 rows returned.

---

## Section 2: Backend Changes (CORS)

### 2.1 Add CORS Middleware

**This is REQUIRED before deployment!**

The file `server/index.ts` needs CORS configuration. Here's what to add:

```typescript
// At the top of the file, add import:
import cors from "cors";

// After app.use(cookieParser()), add:
app.use(cors({
  origin: [
    "https://alpmera.com",
    "https://www.alpmera.com",
    // Add staging domain if you have one
    process.env.NODE_ENV !== "production" ? "http://localhost:5173" : "",
  ].filter(Boolean),
  credentials: true, // Required for cookies/sessions
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-auth"],
}));
```

**Install the cors package:**
```bash
npm install cors
npm install -D @types/cors
```

### 2.2 Environment Variables for Backend

Create/update your production environment file. The backend needs these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase connection string | `postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres` |
| `SESSION_SECRET` | Random string for session encryption | Generate with `openssl rand -hex 32` |
| `ADMIN_API_KEY` | API key for admin authentication | Generate with `openssl rand -hex 32` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |

**Generate secure secrets:**
```bash
# On Mac/Linux:
openssl rand -hex 32

# On Windows (PowerShell):
[System.Web.Security.Membership]::GeneratePassword(64,0)

# Or use an online generator: https://randomkeygen.com/
```

---

## Section 3: Backend Deployment (DigitalOcean)

### 3.1 Connect to Your Server

```bash
ssh root@YOUR_DROPLET_IP
# or
ssh user@api.alpmera.com
```

### 3.2 Update the Code

```bash
cd /path/to/alpmera-web

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build the project
npm run build
```

### 3.3 Update Environment Variables

```bash
# Edit the environment file
nano .env

# Add/update these variables:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
SESSION_SECRET=your_generated_secret_here
ADMIN_API_KEY=your_generated_admin_key_here
NODE_ENV=production
PORT=5000
```

### 3.4 Restart with PM2

```bash
# If PM2 is already running:
pm2 restart all

# If starting fresh:
pm2 start dist/index.cjs --name "alpmera-api"

# Save the PM2 process list
pm2 save

# View logs
pm2 logs alpmera-api
```

### 3.5 Verify Backend is Running

```bash
# Test locally on the server
curl http://localhost:5000/api/landing/subscriber-count

# Should return something like: {"count":0}
```

---

## Section 4: Landing Page Deployment (Vercel)

### 4.1 Configure Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (alpmera landing page)
3. Go to Settings → Environment Variables
4. Add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://api.alpmera.com` | Production |
| `VITE_API_URL` | `https://api-test.alpmera.com` | Preview (optional) |

### 4.2 Update Build Settings (if needed)

In Vercel project settings:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `landing`

### 4.3 Deploy

**Option A: Auto-deploy (if connected to GitHub)**
```bash
# Push to main branch
git push origin main
# Vercel will auto-deploy
```

**Option B: Manual deploy**
```bash
# From the landing directory
cd landing
npx vercel --prod
```

### 4.4 Verify Deployment

1. Go to https://alpmera.com
2. Navigate to "Product Requests" page
3. Open browser DevTools (F12) → Network tab
4. Check that API calls to `api.alpmera.com` succeed (200 status)

---

## Section 5: Security Checklist

### 5.1 Before Going Live

- [ ] `SESSION_SECRET` is a random 64+ character string
- [ ] `ADMIN_API_KEY` is a random 64+ character string
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] CORS only allows `alpmera.com` and `www.alpmera.com`
- [ ] Admin endpoints are protected (require `ADMIN_API_KEY`)

### 5.2 Rate Limiting (Already Implemented)

The server has rate limiting configured:
- Product requests: Limited per IP
- Voting: Limited per IP
- Subscriber form: Limited per IP

### 5.3 Data Protection

- Email addresses are stored but not exposed publicly
- IP addresses are hashed before storage
- Honeypot fields protect against bots

---

## Section 6: Verification Checklist

### 6.1 Database Verification

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'product_request%';

-- Check enums exist
SELECT typname FROM pg_type WHERE typname IN (
  'product_request_status',
  'sku_verification_status'
);
```

### 6.2 Backend Verification

```bash
# Test product requests endpoint
curl https://api.alpmera.com/api/product-requests

# Test subscriber count
curl https://api.alpmera.com/api/landing/subscriber-count
```

### 6.3 Frontend Verification

1. Open https://alpmera.com
2. Test "Join Early List" form → should succeed
3. Go to /demand and test "Suggest a Product" form → should succeed
4. Go to /product-requests → should load list
5. Try voting on a product request → should work

### 6.4 Admin Verification

1. Go to https://api.alpmera.com/admin (or wherever admin is hosted)
2. Login with admin credentials
3. Navigate to Inventory → Product Requests
4. Verify you can see and manage product requests

---

## Section 7: Rollback Plan

If something goes wrong:

### 7.1 Backend Rollback

```bash
# SSH to server
ssh root@api.alpmera.com

# Revert to previous version
cd /path/to/alpmera-web
git checkout HEAD~1

# Rebuild and restart
npm run build
pm2 restart all
```

### 7.2 Frontend Rollback

In Vercel:
1. Go to Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"

### 7.3 Database Rollback

If you need to remove the new tables (WARNING: Data loss!):

```sql
-- Only run if you need to completely undo the migration
DROP TABLE IF EXISTS sku_verification_jobs CASCADE;
DROP TABLE IF EXISTS product_request_events CASCADE;
DROP TABLE IF EXISTS product_request_votes CASCADE;
DROP TABLE IF EXISTS product_requests CASCADE;
DROP TYPE IF EXISTS product_request_status;
DROP TYPE IF EXISTS sku_verification_status;
```

---

## Section 8: Post-Deployment Monitoring

### 8.1 Check Logs

```bash
# On DigitalOcean
pm2 logs alpmera-api --lines 100
```

### 8.2 Monitor Errors

Watch for:
- CORS errors in browser console
- Database connection errors in server logs
- Rate limit blocks (429 errors)

### 8.3 SKU Verifier

The SKU verification worker runs automatically. Check it's working:

```bash
# Look for SKU verifier logs
pm2 logs alpmera-api | grep SKU-VERIFIER
```

---

## Quick Reference: Commands

```bash
# Build everything
npm run build

# Start production server
npm start

# PM2 commands
pm2 start dist/index.cjs --name alpmera-api
pm2 restart alpmera-api
pm2 stop alpmera-api
pm2 logs alpmera-api
pm2 status

# Database push (Drizzle)
npm run db:push
```

---

## Questions?

If you encounter issues:
1. Check the browser console for CORS errors
2. Check PM2 logs for backend errors
3. Verify environment variables are set correctly
4. Ensure database migrations ran successfully
