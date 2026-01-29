# State Machine Fix: PROCUREMENT State Implementation

**Date:** 2025-01-28
**Issue:** Code review identified mismatch between documented and implemented state machine
**Status:** ✅ Completed

---

## Problem

The code review identified a critical state machine mismatch:

**Documented (CLAUDE.md):**
```
AGGREGATION → SUCCESS → PROCUREMENT → FULFILLMENT → RELEASED
```

**Implemented (schema.ts):**
```
AGGREGATION → SUCCESS → FULFILLMENT → RELEASED
```

**Impact:** The `START_FULFILLMENT` action handler checked for `SUCCESS` state, but once PROCUREMENT was added to the state machine, campaigns would get stuck because:
- SUCCESS → PROCUREMENT (when supplier accepts)
- PROCUREMENT → FULFILLMENT (START_FULFILLMENT should work here)
- But the handler rejected anything not in SUCCESS state

---

## Solution

Added PROCUREMENT state to align implementation with documentation.

### Changes Made

#### 1. Schema Updates ([shared/schema.ts](../shared/schema.ts))
- ✅ Added `PROCUREMENT` to `campaignStateEnum`
- ✅ Added `PROCUREMENT` to `CampaignState` type
- ✅ Updated `VALID_TRANSITIONS`:
  ```typescript
  SUCCESS: ["PROCUREMENT", "FAILED"],
  PROCUREMENT: ["FULFILLMENT", "FAILED"],
  ```

#### 2. Route Handler Updates ([server/routes.ts](../server/routes.ts))
- ✅ Updated `transitionRequestSchema` to include PROCUREMENT
- ✅ Added new action: `START_PROCUREMENT` (SUCCESS → PROCUREMENT)
  - Triggered when supplier accepts
  - Requires `supplierAcceptedAt` timestamp
- ✅ Updated `START_FULFILLMENT` action (PROCUREMENT → FULFILLMENT)
  - Changed from requiring SUCCESS to requiring PROCUREMENT
  - Removed `supplierAcceptedAt` check (already validated in START_PROCUREMENT)

#### 3. Frontend Updates
- ✅ [client/src/components/state-timeline.tsx](../client/src/components/state-timeline.tsx)
  - Added PROCUREMENT to `STATES` array
  - Added label: "Supplier preparing"
- ✅ [client/src/pages/admin.tsx](../client/src/pages/admin.tsx)
  - Updated `FALLBACK_TRANSITIONS` to include PROCUREMENT

#### 4. Database Migration ([migrations/008_add_procurement_state.sql](../migrations/008_add_procurement_state.sql))
- ✅ Created migration to add PROCUREMENT to PostgreSQL enum
- ✅ Includes safety check (IF NOT EXISTS)
- ✅ No data migration needed (campaigns remain in SUCCESS until manually transitioned)

#### 5. Documentation ([CLAUDE.md](../CLAUDE.md))
- ✅ Updated state machine diagram to show all failure paths
- ✅ Changed COMPLETED → RELEASED to match implementation

---

## New State Flow

```
AGGREGATION
    │
    ├─→ SUCCESS (goal reached)
    │       │
    │       ├─→ PROCUREMENT (supplier accepts) ← NEW STATE
    │       │       │
    │       │       ├─→ FULFILLMENT (admin starts fulfillment)
    │       │       │       │
    │       │       │       ├─→ RELEASED (complete)
    │       │       │       │
    │       │       │       └─→ FAILED (fulfillment issues)
    │       │       │
    │       │       └─→ FAILED (procurement issues)
    │       │
    │       └─→ FAILED (supplier doesn't accept)
    │
    └─→ FAILED (didn't reach goal)
```

---

## Admin Action Mapping

| Action | From State | To State | Trigger |
|--------|-----------|----------|---------|
| `MARK_FUNDED` | AGGREGATION | SUCCESS | Admin marks goal reached |
| `START_PROCUREMENT` | SUCCESS | PROCUREMENT | Supplier accepts campaign |
| `START_FULFILLMENT` | PROCUREMENT | FULFILLMENT | Admin starts fulfillment |
| `RELEASE_ESCROW` | FULFILLMENT | RELEASED | Fulfillment complete |
| `FAIL_CAMPAIGN` | Any (except RELEASED/FAILED) | FAILED | Admin intervention |

---

## Testing Checklist

- [ ] Run migration on dev database: `npm run db:push`
- [ ] Verify enum includes PROCUREMENT: `SELECT unnest(enum_range(NULL::campaign_state));`
- [ ] Test SUCCESS → PROCUREMENT transition via admin panel
- [ ] Test PROCUREMENT → FULFILLMENT transition via admin panel
- [ ] Verify START_FULFILLMENT rejects SUCCESS state
- [ ] Verify START_PROCUREMENT requires supplier acceptance
- [ ] Check state timeline renders PROCUREMENT correctly

---

## Deployment Notes

1. **Database Migration:** Must be applied before deploying code changes
2. **Backward Compatibility:** Existing campaigns in SUCCESS will remain there until manually transitioned
3. **Admin Training:** Admin users need to understand new two-step process:
   - SUCCESS → PROCUREMENT (when supplier accepts)
   - PROCUREMENT → FULFILLMENT (when ready to ship)

---

## Related Files

- [shared/schema.ts:267](../shared/schema.ts#L267) - State enum definition
- [shared/schema.ts:613](../shared/schema.ts#L613) - Type definition
- [shared/schema.ts:695](../shared/schema.ts#L695) - Valid transitions
- [server/routes.ts:157](../server/routes.ts#L157) - Transition schema
- [server/routes.ts:5013](../server/routes.ts#L5013) - Action handlers
- [CLAUDE.md:164](../CLAUDE.md#L164) - State machine documentation

---

## Authority

This fix implements the state machine documented in CLAUDE.md (Canon Level 4) and aligns with:
- Constitution Article IV (Operating Model)
- Payment Architecture (supplier acceptance phase)
- Git Governance (proper state transition tracking)
