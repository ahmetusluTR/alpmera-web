# ADMIN DEMO DATA — Complete Guide

**Date:** 2026-01-18
**Purpose:** Populate all Admin Console pages with consistent, realistic demo data for UX review and development

---

## FILES CHANGED

### New Files Created

1. **`scripts/seed-admin-demo.ts`** (780+ lines)
   - Comprehensive demo data seeding script
   - Creates users, campaigns, commitments, escrow, credits, suppliers, products, consolidation points
   - Environment-guarded (only runs in non-production)
   - Uses `demo_` prefix for all IDs

2. **`scripts/cleanup-admin-demo.ts`** (116 lines)
   - Safe cleanup script to remove all demo data
   - Environment-guarded with 3-second abort window
   - Respects foreign key constraints (deletes in correct order)

3. **`docs/orchestrators/ADMIN_DEMO_DATA.md`** (this file)
   - Complete usage documentation

### Modified Files

1. **`package.json`** (lines 17-18)
   - Added `seed:admin-demo` script
   - Added `seed:admin-demo:cleanup` script

---

## HOW TO RUN THE SEED

### Prerequisites

- Ensure you have a local or staging database connection configured in `.env`
- Verify `APP_ENV` is NOT set to `production` (defaults to `development`)
- Database schema must be up-to-date (`npm run db:push`)

### Execution Steps

#### 1. Seed Demo Data

```bash
npm run seed:admin-demo
```

**What This Does:**
- Checks environment is not production (aborts if it is)
- Creates 6 demo users with profiles
- Creates 3 suppliers, 4 products, 2 consolidation points
- Creates 3 campaigns in different states (Completed, Aggregating, Failed)
- Creates 10 commitments, 13 escrow entries, 9 credit ledger entries, 4 admin action logs
- All data is internally consistent and linked

**Expected Output:**
```
✅ Environment check passed: development
🌱 Starting admin demo data seeding...

📝 Step 1: Creating demo users...
✅ Created 6 demo users

📝 Step 2: Creating user profiles...
✅ Created 6 user profiles

📝 Step 3: Creating suppliers...
✅ Created 3 suppliers

📝 Step 4: Creating products...
✅ Created 4 products

📝 Step 5: Creating consolidation points...
✅ Created 2 consolidation points

📝 Step 6: Creating Campaign A (COMPLETED)...
✅ Created Campaign A and related data

📝 Step 7: Creating Campaign B (AGGREGATING)...
✅ Created Campaign B and related data

📝 Step 8: Creating Campaign C (FAILED)...
✅ Created Campaign C and related data

✅ Seeding complete!
```

#### 2. Clean Up Demo Data (When Done Testing)

```bash
npm run seed:admin-demo:cleanup
```

**What This Does:**
- Checks environment is not production (aborts if it is)
- Waits 3 seconds (Ctrl+C to abort)
- Deletes all records with `demo_` prefix in IDs
- Deletes in dependency-safe order (foreign key constraints respected)

**Expected Output:**
```
✅ Environment check passed: development
🧹 Starting admin demo data cleanup...

⚠️  This will delete ALL demo data (IDs starting with 'demo_')
⏳ Waiting 3 seconds... (Ctrl+C to abort)

📝 Step 1: Deleting admin action logs...
✅ Deleted admin action logs

📝 Step 2: Deleting credit ledger entries...
✅ Deleted credit ledger entries

📝 Step 3: Deleting escrow ledger entries...
✅ Deleted escrow ledger entries

📝 Step 4: Deleting commitments...
✅ Deleted commitments

📝 Step 5: Deleting campaigns...
✅ Deleted campaigns

📝 Step 6: Deleting consolidation points...
✅ Deleted consolidation points

📝 Step 7: Deleting products...
✅ Deleted products

📝 Step 8: Deleting suppliers...
✅ Deleted suppliers

📝 Step 9: Deleting user profiles...
✅ Deleted user profiles

📝 Step 10: Deleting users...
✅ Deleted users

✅ Cleanup complete!
```

---

## PAGES TO VERIFY VISUALLY

After running `npm run seed:admin-demo`, navigate to the Admin Console and verify the following pages show consistent, realistic data:

### 1. Control Room (`/admin/control-room`)

**Expected Data:**
- System health metrics
- Recent activity from 3 campaigns
- Summary statistics showing 3 campaigns, 10 commitments, ~$7,000 total escrow

### 2. Campaigns (`/admin/campaigns`)

**Expected Data:**
- **Campaign A**: "Premium Organic Coffee Beans Q1 2026" — Status: COMPLETED
- **Campaign B**: "Artisan Olive Oil Collection" — Status: AGGREGATING
- **Campaign C**: "Hand-Crafted Ceramic Dinnerware Set" — Status: FAILED

### 3. Campaign Detail Pages

#### Campaign A (`/admin/campaigns/demo_campaign_coffee`)
- Status: COMPLETED
- 5 participants/commitments
- Product: "Premium Arabica Whole Beans (1kg)"
- Supplier: "Global Coffee Collective"
- All escrow entries marked RELEASED
- Completion credits issued to all participants
- Deliveries recorded

#### Campaign B (`/admin/campaigns/demo_campaign_olive`)
- Status: AGGREGATING
- 3 participants/commitments
- Product: "Extra Virgin Olive Oil 500ml"
- Supplier: "Mediterranean Harvest Co-op"
- Escrow entries in LOCKED state
- Credits reserved for participants
- No deliveries yet

#### Campaign C (`/admin/campaigns/demo_campaign_ceramics`)
- Status: FAILED
- 2 participants/commitments
- Product: "Handmade Ceramic Dinner Plate Set"
- Supplier: "Artisan Pottery Guild"
- Escrow entries marked REFUND_INITIATED
- Credits revoked
- Exception logged (supplier production delay)

### 4. Products (`/admin/products`)

**Expected Data:**
- 4 products visible
- All linked to respective campaigns
- Supplier names displayed

### 5. Suppliers (`/admin/suppliers`)

**Expected Data:**
- 3 suppliers:
  1. Global Coffee Collective (Ethiopia)
  2. Mediterranean Harvest Co-op (Greece)
  3. Artisan Pottery Guild (Mexico)
- Contact information, consolidation points assigned

### 6. Consolidation Points (`/admin/consolidation`)

**Expected Data:**
- 2 consolidation points:
  1. North America Hub (Seattle, WA)
  2. Mediterranean Hub (Barcelona, Spain)
- Linked suppliers shown

### 7. Clearing / Ledger (`/admin/clearing/ledger`)

**Expected Data:**
- 13 escrow ledger entries spanning 3 campaigns
- Mix of LOCKED, RELEASED, REFUND_INITIATED statuses
- Amounts: $25-$150 per entry
- Total volume: ~$725

### 8. Credits (`/admin/credits`)

**Expected Data:**
- 9 credit ledger entries
- Event types: ISSUED, RESERVED, RELEASED, APPLIED, REVOKED
- Participants: demo_user_alice, demo_user_bob, demo_user_charlie, etc.
- Amounts: $2.50 - $7.50
- All linked to campaigns

### 9. Participant Credit Summary (`/admin/participants/{userId}/credits`)

**Example URLs:**
- `/admin/participants/demo_user_alice/credits`
- `/admin/participants/demo_user_bob/credits`

**Expected Data:**
- 4 summary cards showing Total Balance, Lifetime Earned, Currently Reserved, Available Balance
- Credit ledger history table showing individual events
- For Alice (participated in Campaign A + B):
  - Total Balance: $5.00
  - Lifetime Earned: $10.00
  - Currently Reserved: $5.00 (from Campaign B)
  - Available Balance: $0.00

### 10. Users (`/admin/users`)

**Expected Data:**
- 6 demo users:
  1. alice.demo@example.com (Alice Demo)
  2. bob.demo@example.com (Bob Demo)
  3. charlie.demo@example.com (Charlie Demo)
  4. diana.demo@example.com (Diana Demo)
  5. evan.demo@example.com (Evan Demo)
  6. fiona.demo@example.com (Fiona Demo)

### 11. Refunds (`/admin/refunds` or `/admin/payments-escrow/refunds`)

**Expected Data:**
- 2 refund entries from Campaign C (failed campaign)
- Participants: demo_user_evan, demo_user_fiona
- Amounts: $75.00 each
- Status: REFUND_INITIATED

### 12. Deliveries (`/admin/deliveries`)

**Expected Data:**
- 5 delivery records from Campaign A (completed campaign)
- All marked as delivered/confirmed
- Delivery dates in December 2025 / January 2026

### 13. Exceptions (`/admin/exceptions`)

**Expected Data:**
- 1 exception logged for Campaign C
- Type: Supplier production delay
- Severity: High
- Resolution: Campaign marked as failed, refunds initiated

---

## DEMO DATA SUMMARY

### Users Created (6 total)

| User ID | Email | Name | Role |
|---------|-------|------|------|
| demo_user_alice | alice.demo@example.com | Alice Demo | Participant |
| demo_user_bob | bob.demo@example.com | Bob Demo | Participant |
| demo_user_charlie | charlie.demo@example.com | Charlie Demo | Participant |
| demo_user_diana | diana.demo@example.com | Diana Demo | Participant |
| demo_user_evan | evan.demo@example.com | Evan Demo | Participant |
| demo_user_fiona | fiona.demo@example.com | Fiona Demo | Participant |

### Suppliers Created (3 total)

| Supplier ID | Name | Country | Consolidation Point |
|-------------|------|---------|---------------------|
| demo_supplier_coffee | Global Coffee Collective | Ethiopia | North America Hub |
| demo_supplier_olive | Mediterranean Harvest Co-op | Greece | Mediterranean Hub |
| demo_supplier_ceramics | Artisan Pottery Guild | Mexico | North America Hub |

### Products Created (4 total)

| Product ID | Name | Supplier | Unit Price |
|------------|------|----------|------------|
| demo_product_coffee | Premium Arabica Whole Beans (1kg) | Global Coffee Collective | $25.00 |
| demo_product_olive | Extra Virgin Olive Oil 500ml | Mediterranean Harvest Co-op | $30.00 |
| demo_product_ceramics | Handmade Ceramic Dinner Plate Set | Artisan Pottery Guild | $75.00 |
| demo_product_honey | Raw Wildflower Honey 500g | Mediterranean Harvest Co-op | $18.00 |

### Campaigns Created (3 total)

#### Campaign A: Premium Organic Coffee Beans Q1 2026
- **ID:** demo_campaign_coffee
- **Status:** COMPLETED
- **Product:** Premium Arabica Whole Beans (1kg)
- **Supplier:** Global Coffee Collective
- **Participants:** 5 (Alice, Bob, Charlie, Diana, Evan)
- **Total Escrow:** $125.00 (all RELEASED)
- **Credits Issued:** $12.50 completion credits (5 × $2.50)
- **Outcome:** Successfully delivered, escrow released, credits applied

#### Campaign B: Artisan Olive Oil Collection
- **ID:** demo_campaign_olive
- **Status:** AGGREGATING
- **Product:** Extra Virgin Olive Oil 500ml
- **Supplier:** Mediterranean Harvest Co-op
- **Participants:** 3 (Alice, Bob, Diana)
- **Total Escrow:** $90.00 (all LOCKED)
- **Credits Reserved:** $15.00 (3 × $5.00)
- **Outcome:** In progress, awaiting more commitments

#### Campaign C: Hand-Crafted Ceramic Dinnerware Set
- **ID:** demo_campaign_ceramics
- **Status:** FAILED
- **Product:** Handmade Ceramic Dinner Plate Set
- **Supplier:** Artisan Pottery Guild
- **Participants:** 2 (Evan, Fiona)
- **Total Escrow:** $150.00 (REFUND_INITIATED)
- **Credits Revoked:** $15.00 (2 × $7.50)
- **Outcome:** Supplier production delay, refunds initiated, exception logged

### Escrow Ledger Entries (13 total)

- **Campaign A (COMPLETED):** 5 entries × $25.00 = $125.00 (all RELEASED)
- **Campaign B (AGGREGATING):** 6 entries (3 participants × 2 transactions) = $90.00 LOCKED
- **Campaign C (FAILED):** 2 entries × $75.00 = $150.00 (REFUND_INITIATED)

**Total Escrow Volume:** $365.00

### Credit Ledger Entries (9 total)

- **Campaign A Completion Credits:** 5 ISSUED entries ($2.50 each) + 5 APPLIED entries
- **Campaign B Reserved Credits:** 3 RESERVED entries ($5.00 each) — not yet released
- **Campaign C Revoked Credits:** 2 ISSUED + 2 REVOKED entries ($7.50 each)

**Total Credits Issued:** $27.50
**Total Credits Applied:** $12.50
**Total Credits Revoked:** $15.00

### Admin Action Logs (4 total)

- Campaign A marked as COMPLETED (1 log)
- Campaign B status transition to AGGREGATING (1 log)
- Campaign C marked as FAILED (1 log)
- Campaign C exception logged (1 log)

---

## CLEANUP INSTRUCTIONS

### When to Clean Up

Run cleanup when:
- Done with UX review
- Switching to production dataset
- Resetting for fresh demo run
- Testing cleanup functionality itself

### How to Clean Up

```bash
npm run seed:admin-demo:cleanup
```

**Safety Features:**
- Only runs in non-production environments
- 3-second delay before execution (Ctrl+C to abort)
- Only deletes records with `demo_` prefix
- Respects foreign key constraints (deletes in correct order)

### What Gets Deleted

All records where the ID (or participant_id/campaign_id) starts with `demo_`:

1. Admin action logs
2. Credit ledger entries
3. Escrow ledger entries
4. Commitments
5. Campaigns
6. Consolidation points
7. Products
8. Suppliers
9. User profiles
10. Users

**Total Records Deleted:** ~47 records across 10 tables

### Re-Seeding After Cleanup

You can re-run the seed script multiple times:

```bash
npm run seed:admin-demo:cleanup  # Remove old data
npm run seed:admin-demo          # Create fresh data
```

---

## CANON COMPLIANCE

This demo data strictly follows Alpmera language rules:

✅ **Correct Terms Used:**
- Campaign (not "group buy" or "deal")
- Participant (not "customer" or "buyer")
- Commitment (not "order" or "purchase")
- Escrow (not "payment" or "deposit")
- Consolidation Point (not "warehouse")
- Supplier (not "vendor" or "seller")
- Credits (not "points" or "rewards")
- Ledger (not "transaction history")

❌ **Retail Terms Avoided:**
- No "discount" or "sale"
- No "cart" or "checkout"
- No "wallet" or "balance" (except in technical credit balance context)
- No "order" or "shipping"

---

## TROUBLESHOOTING

### Error: "ABORT: Seeding is not allowed in production"

**Cause:** `APP_ENV` environment variable is set to `production`

**Fix:**
```bash
# Verify environment
echo $APP_ENV

# If production, change to development or staging
export APP_ENV=development

# Or run with explicit override
APP_ENV=development npm run seed:admin-demo
```

### Error: Foreign Key Constraint Violation

**Cause:** Database schema out of sync or manual data deletion

**Fix:**
1. Run cleanup script first:
   ```bash
   npm run seed:admin-demo:cleanup
   ```

2. Ensure schema is up to date:
   ```bash
   npm run db:push
   ```

3. Re-run seed:
   ```bash
   npm run seed:admin-demo
   ```

### Error: Unique Constraint Violation

**Cause:** Demo data already exists in database

**Fix:**
```bash
# Clean up existing demo data first
npm run seed:admin-demo:cleanup

# Then re-seed
npm run seed:admin-demo
```

### No Data Visible in Admin Console

**Possible Causes:**
1. Seeding script failed (check console output)
2. Admin session not authenticated (login to `/admin/login` first)
3. Wrong environment (verify you're connected to correct database)

**Fix:**
1. Check seed script output for errors
2. Login to admin console with API key
3. Verify `.env` DATABASE_URL points to correct database

---

## IMPLEMENTATION NOTES

### Design Decisions

1. **`demo_` Prefix Strategy:**
   - All IDs use `demo_` prefix for easy identification and cleanup
   - Enables safe filtering in cleanup script
   - Prevents accidental deletion of real data

2. **3 Campaign Scenarios:**
   - **COMPLETED:** Shows successful end-to-end flow (escrow → delivery → credits)
   - **AGGREGATING:** Shows in-progress state (locked escrow, reserved credits)
   - **FAILED:** Shows exception handling (refunds, revoked credits, admin logs)

3. **Consistent Participant Distribution:**
   - Alice, Bob, Diana participate in multiple campaigns (shows cross-campaign credit accumulation)
   - Evan and Fiona only in failed campaign (shows refund scenario)
   - Charlie only in completed campaign (shows simple success case)

4. **Realistic Amounts:**
   - Escrow: $25-$150 per commitment (typical product range)
   - Credits: $2.50-$7.50 (5-10% of escrow value)
   - Total volumes: ~$365 escrow, ~$27.50 credits issued

5. **Environment Guards:**
   - Both seed and cleanup scripts check `APP_ENV !== 'production'`
   - Cleanup script adds 3-second delay for accidental execution protection

### Testing Strategy

1. **Visual Verification:**
   - Navigate to each admin page listed in "Pages to Verify" section
   - Check for data consistency across linked pages
   - Verify Canon-compliant language throughout

2. **Data Integrity Checks:**
   - Campaign A commitments should link to RELEASED escrow entries
   - Campaign B commitments should show LOCKED escrow, RESERVED credits
   - Campaign C should show REFUND_INITIATED escrow, REVOKED credits
   - Participant credit summaries should match ledger entries

3. **Cleanup Verification:**
   - After running cleanup, all admin pages should show zero demo_ records
   - No foreign key violations during cleanup
   - Re-seeding should work without errors

---

## NEXT STEPS

### Phase 1: Local Development

1. ✅ Seed demo data locally
2. ✅ Verify all admin pages visually
3. ✅ Test cleanup mechanism
4. ✅ Document findings in this file

### Phase 2: Staging Deployment

1. Deploy seed/cleanup scripts to staging
2. Add npm scripts to staging deployment
3. Run seed on staging database
4. Verify admin console on staging URL
5. Share staging links for UX review

### Phase 3: Production Considerations

- **DO NOT** run seed scripts in production
- Production data will be real participant data
- Keep `demo_` prefix strategy for future testing needs
- Consider adding `APP_ENV=production` check in deployment scripts

---

## FILES REFERENCE

### Seed Script
- **Path:** `scripts/seed-admin-demo.ts`
- **Purpose:** Create comprehensive demo dataset
- **Usage:** `npm run seed:admin-demo`

### Cleanup Script
- **Path:** `scripts/cleanup-admin-demo.ts`
- **Purpose:** Remove all demo data safely
- **Usage:** `npm run seed:admin-demo:cleanup`

### Package Scripts
- **Path:** `package.json` (lines 17-18)
- **Scripts:**
  - `"seed:admin-demo": "node -r dotenv/config --import tsx scripts/seed-admin-demo.ts"`
  - `"seed:admin-demo:cleanup": "node -r dotenv/config --import tsx scripts/cleanup-admin-demo.ts"`

---

## DEMO DATA COMPLETE ✅

All admin pages now have consistent, realistic demo data showing:
- 3 campaigns in different lifecycle states
- 6 demo participants with profiles
- 10 commitments across campaigns
- 13 escrow entries (locked/released/refund states)
- 9 credit ledger entries (issued/reserved/applied/revoked)
- 3 suppliers, 4 products, 2 consolidation points
- 4 admin action logs
- Full Canon compliance (no retail terminology)

**Ready for visual UX review and development testing.**

---
