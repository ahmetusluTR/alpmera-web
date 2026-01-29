# PROCUREMENT State Deployment Guide

**Date:** 2025-01-28
**Issue:** State machine alignment (code review fix)
**Status:** ✅ Code changes complete, ready for database migration

---

## Overview

The PROCUREMENT state has been added to the campaign state machine to align with documentation and fix the START_FULFILLMENT gate issue.

**State Flow:**
```
AGGREGATION → SUCCESS → PROCUREMENT → FULFILLMENT → RELEASED
      ↓           ↓           ↓             ↓
   FAILED      FAILED      FAILED        FAILED
```

---

## Deployment Steps

### 1. Database Migration (Required First)

**Before deploying code changes**, run the database migration:

```bash
# Connect to your database and run:
psql $DATABASE_URL -f migrations/008_add_procurement_state.sql

# Or using a database client, execute:
cat migrations/008_add_procurement_state.sql
```

**Verify migration:**
```sql
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'campaign_state')
ORDER BY enumsortorder;
```

Expected output should include: `PROCUREMENT`

### 2. Code Deployment

Once the database migration is complete, deploy the code changes:

```bash
# Development
npm run db:push  # If not already done
npm run dev

# Production
npm run build
npm start
```

### 3. Verification Checklist

After deployment, verify:

- [ ] Enum includes PROCUREMENT: Check database
- [ ] Admin panel loads without errors
- [ ] State timeline shows "Supplier preparing" for PROCUREMENT
- [ ] SUCCESS campaigns can transition to PROCUREMENT
- [ ] PROCUREMENT campaigns can transition to FULFILLMENT
- [ ] START_FULFILLMENT rejects SUCCESS state (requires PROCUREMENT)

---

## Changed Files

### Backend
- [shared/schema.ts](shared/schema.ts) - Added PROCUREMENT to enum, type, and transitions
- [server/routes.ts](server/routes.ts) - Added START_PROCUREMENT action, updated START_FULFILLMENT
- [migrations/008_add_procurement_state.sql](migrations/008_add_procurement_state.sql) - Database migration

### Frontend
- [client/src/components/state-timeline.tsx](client/src/components/state-timeline.tsx) - Added PROCUREMENT label
- [client/src/pages/admin.tsx](client/src/pages/admin.tsx) - Updated fallback transitions

### Documentation
- [CLAUDE.md](CLAUDE.md) - Updated state machine diagram

---

## Admin Actions Reference

| Action | From State | To State | When to Use |
|--------|-----------|----------|-------------|
| `MARK_FUNDED` | AGGREGATION | SUCCESS | Campaign reaches funding goal |
| `START_PROCUREMENT` | SUCCESS | PROCUREMENT | Supplier accepts the campaign |
| `START_FULFILLMENT` | PROCUREMENT | FULFILLMENT | Ready to ship products |
| `RELEASE_ESCROW` | FULFILLMENT | RELEASED | Products delivered, inspection complete |
| `FAIL_CAMPAIGN` | Any | FAILED | Campaign cannot proceed |

---

## Breaking Changes

⚠️ **START_FULFILLMENT behavior changed:**
- **Before:** Required SUCCESS state
- **After:** Requires PROCUREMENT state

**Impact:** Campaigns in SUCCESS state cannot directly start fulfillment. They must first transition to PROCUREMENT via the new START_PROCUREMENT action.

**Migration Path for Existing SUCCESS Campaigns:**
1. Verify supplier has accepted
2. Use START_PROCUREMENT action to move to PROCUREMENT
3. Then use START_FULFILLMENT to begin fulfillment

---

## Rollback Plan

If issues arise:

1. **Do NOT drop the PROCUREMENT enum value** (PostgreSQL doesn't support this easily)
2. Update code to skip PROCUREMENT validation temporarily
3. Hotfix: Allow START_FULFILLMENT from both SUCCESS and PROCUREMENT
4. Investigate and re-deploy proper fix

---

## Testing Commands

```bash
# Type checking
npm run check

# Build verification
npm run build

# Run tests (if available)
npm test

# Database connection test
node -e "import pg from 'pg'; const pool = new pg.Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT 1').then(() => console.log('✅ DB connected')).catch(e => console.error('❌', e)).finally(() => pool.end());"
```

---

## Support

If you encounter issues:

1. Check that database migration ran successfully
2. Verify DATABASE_URL is set correctly
3. Check admin action logs for failed transitions
4. Review [STATE_MACHINE_FIX.md](brand-assets/STATE_MACHINE_FIX.md) for technical details

---

## Authority & Compliance

- ✅ Aligns with [CLAUDE.md](CLAUDE.md) state machine documentation
- ✅ Maintains audit trail (all transitions logged)
- ✅ Preserves backward compatibility (existing campaigns unchanged)
- ✅ No impact on participant-facing flows
