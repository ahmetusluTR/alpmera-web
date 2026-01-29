# Campaign Lifecycle Completion - Implementation Plan

## 1. 🎯 Objective
Implement PRD-aligned campaign state machine with PROCUREMENT and COMPLETED states, deadline automation with threshold evaluation, and automatic refund processing to ensure "no silent transitions."

## 2. 🏗️ Tech Strategy
- **Pattern:** Background job with row-level locking for deadline automation
- **State:** Database-driven state machine with VALID_TRANSITIONS enforcement
- **Data Flow:** Auto-transitions via background job, manual via admin actions
- **Constraints:** Schema isolation (test schema for tests), no breaking changes to existing campaigns

## 3. 📂 File Changes

### Phase 1: Schema & Core Logic
| Action | File Path | Brief Purpose |
|:-------|:----------|:--------------|
| [MOD]  | `shared/schema.ts` | Add PROCUREMENT/COMPLETED states, minThresholdUnits field, VALID_TRANSITIONS |
| [NEW]  | `migrations/2026-01-28-campaign-lifecycle.sql` | Database migration for new states and fields |
| [MOD]  | `shared/schema.ts` | Add refundAlerts table schema |

### Phase 2: Background Job
| Action | File Path | Brief Purpose |
|:-------|:----------|:--------------|
| [NEW]  | `server/jobs/campaign-lifecycle.ts` | Deadline automation and refund processing |
| [MOD]  | `server/index.ts` | Initialize background job on startup |

### Phase 3: Backend API
| Action | File Path | Brief Purpose |
|:-------|:----------|:--------------|
| [MOD]  | `server/routes.ts` | Update action codes (START_PROCUREMENT, MARK_COMPLETED) |
| [MOD]  | `server/routes.ts` | Add /api/admin/refund-alerts endpoint |
| [MOD]  | `server/storage.ts` | Add createRefundAlert, getRefundAlerts helpers |

### Phase 4: Admin UI
| Action | File Path | Brief Purpose |
|:-------|:----------|:--------------|
| [MOD]  | `client/src/pages/admin/campaign-detail.tsx` | Add minThresholdUnits field, update badges/actions |
| [MOD]  | `client/src/pages/admin/campaigns.tsx` | Add PROCUREMENT/COMPLETED filters |
| [NEW]  | `client/src/pages/admin/alerts.tsx` | Refund alerts dashboard |

### Phase 5: Participant UI
| Action | File Path | Brief Purpose |
|:-------|:----------|:--------------|
| [MOD]  | `client/src/pages/campaign.tsx` | Update status messages for new states |
| [MOD]  | `client/src/pages/account/index.tsx` | Update dashboard state labels |

### Phase 6: Testing
| Action | File Path | Brief Purpose |
|:-------|:----------|:--------------|
| [NEW]  | `server/tests/campaign-lifecycle.test.ts` | Unit tests for deadline automation |
| [MOD]  | `server/tests/unit.test.ts` | Update VALID_TRANSITIONS tests |

## 4. 👣 Execution Sequence

### Phase 1: Schema & Core Logic (2-3h)
1. **Update shared/schema.ts:**
   - Add PROCUREMENT, COMPLETED to campaignStateEnum
   - Add minThresholdUnits (integer, nullable) to campaigns table
   - Add processingLock (timestamp, nullable) to campaigns table
   - Create refundAlerts table definition
   - Update VALID_TRANSITIONS map
   - Update CampaignState type

2. **Create migration SQL:**
   - ALTER TYPE campaign_state ADD VALUE 'PROCUREMENT'
   - ALTER TYPE campaign_state ADD VALUE 'COMPLETED'
   - ALTER TABLE campaigns ADD COLUMN min_threshold_units
   - ALTER TABLE campaigns ADD COLUMN processing_lock
   - UPDATE campaigns SET state = 'COMPLETED' WHERE state = 'RELEASED'
   - CREATE TABLE refund_alerts

3. **Run migration:**
   - `npm run db:push` to apply schema changes

### Phase 2: Background Job (3-4h)
1. **Create server/jobs/campaign-lifecycle.ts:**
   - CampaignLifecycleJob class with start/stop methods
   - processExpiredCampaigns() - find AGGREGATION campaigns past deadline
   - processSingleCampaign() - evaluate threshold and transition
   - acquireProcessingLock() - row-level lock mechanism
   - processAutoRefunds() - create REFUND entries, update commitments

2. **Update server/index.ts:**
   - Import campaignLifecycleJob
   - Start job after server listen
   - Add SIGTERM handler to stop job gracefully

### Phase 3: Backend API (2-3h)
1. **Update server/routes.ts action endpoint:**
   - Add START_PROCUREMENT action (SUCCESS → PROCUREMENT)
   - Add MARK_COMPLETED action (FULFILLMENT → COMPLETED)
   - Update MARK_FUNDED to auto-chain to PROCUREMENT
   - Update FAIL_CAMPAIGN to trigger processAutoRefunds

2. **Add /api/admin/refund-alerts endpoint:**
   - GET endpoint with pagination
   - Filter by unresolved only
   - Return alert details with campaign/commitment context

3. **Update server/storage.ts:**
   - Add createRefundAlert(data) helper
   - Add getRefundAlerts(filters) helper

### Phase 4: Admin UI (3-4h)
1. **Update client/src/pages/admin/campaign-detail.tsx:**
   - Add minThresholdUnits input in Prerequisites section
   - Add admin-only badge and help text
   - Update CampaignStateBadge component (add PROCUREMENT, COMPLETED)
   - Update CampaignActions component (add new action buttons)
   - Update validation to sanitize empty string → null

2. **Update client/src/pages/admin/campaigns.tsx:**
   - Add PROCUREMENT and COMPLETED to state filters
   - Update state badge rendering

3. **Create client/src/pages/admin/alerts.tsx:**
   - Refund alerts list with pagination
   - Show campaign title, commitment code, error message
   - Retry and Mark Resolved actions

### Phase 5: Participant UI (2h)
1. **Update client/src/pages/campaign.tsx:**
   - Add status messages for PROCUREMENT, COMPLETED states
   - Update CampaignStatusBanner component

2. **Update client/src/pages/account/index.tsx:**
   - Update stateLabels map (add PROCUREMENT: "Processing", COMPLETED: "Completed")
   - Update commitment cards to show new states

### Phase 6: Testing (3-4h)
1. **Create server/tests/campaign-lifecycle.test.ts:**
   - Test: Funded campaign → PROCUREMENT
   - Test: Unfunded campaign → FAILED with refunds
   - Test: minThresholdUnits fallback to targetUnits
   - Test: Duplicate processing prevented
   - Test: Partial refund failure doesn't block others

2. **Update server/tests/unit.test.ts:**
   - Update VALID_TRANSITIONS tests for new states

3. **Manual testing:**
   - Create test campaign with minThresholdUnits
   - Set deadline to past, verify auto-transition
   - Test manual state transitions
   - Verify audit logs

## 5. 🔗 Blast Radius Analysis

### Breaking Changes
- **NONE** - All changes are additive or migrations

### Affected Systems
1. **Admin Campaign Management:**
   - Prerequisites form gains new field (backward compatible)
   - Action buttons updated (contextual to state)
   - Filters expanded (backward compatible)

2. **Participant Experience:**
   - Status messages updated (backward compatible)
   - Dashboard labels updated (backward compatible)

3. **Background Jobs:**
   - NEW system - no existing jobs to break
   - Requires .env restart to activate

### Dependencies
- Existing campaigns in RELEASED state will migrate to COMPLETED (handled in migration)
- minThresholdUnits = null falls back to targetUnits (backward compatible)
- All existing API endpoints remain unchanged

### Rollback Strategy
- Migration is additive (no destructive changes)
- Stop background job if issues arise
- Manual state corrections via SQL if needed
- Audit logs preserve full history for recovery

## 6. ✅ Verification Standards

### Functional Verification
- [ ] **Migration:** Run `npm run db:push`, verify schema updated
- [ ] **RELEASED → COMPLETED:** Check existing campaigns migrated
- [ ] **Background Job:** Verify job starts on server launch
- [ ] **Deadline Automation:** Set test campaign deadline to past, verify auto-transition
- [ ] **Threshold Logic:** Test with minThresholdUnits set vs null
- [ ] **Auto-Refunds:** Verify FAILED campaigns trigger refund processing
- [ ] **Manual Actions:** Test all admin action buttons (START_PROCUREMENT, MARK_COMPLETED)
- [ ] **Audit Logs:** Verify all transitions logged with correct actor

### UI Verification
- [ ] **Admin Prerequisites:** minThresholdUnits input appears with admin-only badge
- [ ] **Admin Badges:** PROCUREMENT (warning), COMPLETED (success) display correctly
- [ ] **Admin Filters:** PROCUREMENT and COMPLETED filters work
- [ ] **Participant Status:** New state messages display on campaign pages
- [ ] **Dashboard:** Commitment cards show correct state labels

### Code Quality
- [ ] **Tests Pass:** `npm test` shows all tests passing
- [ ] **TypeScript:** `npm run check` shows no type errors
- [ ] **Linting:** No console errors in browser
- [ ] **Language Compliance:** No "buy/purchase/order" language in UI

### Trust Alignment (PRD)
- [ ] **No Silent Transitions:** All transitions logged to adminActionLogs
- [ ] **Automatic Refunds:** FAILED state triggers immediate refund processing
- [ ] **Explicit Behavior:** minThresholdUnits never exposed to participants
- [ ] **Audit Trail:** SYSTEM_DEADLINE_AUTOMATION actor in logs
- [ ] **Processing Locks:** Duplicate processing prevented

## 7. 🚨 Critical Checkpoints

### Before Starting
- [x] Design document approved
- [x] Worktree created and isolated
- [ ] .env file copied to worktree (for test execution)

### Before Committing Phase 1
- [ ] Schema changes validated in dev database
- [ ] Existing campaigns not affected
- [ ] TypeScript types updated

### Before Committing Phase 2
- [ ] Background job tested locally (create past-deadline campaign)
- [ ] Processing locks prevent duplicate runs
- [ ] Graceful shutdown handler tested

### Before Committing Phase 3
- [ ] All new API endpoints tested with curl/Postman
- [ ] State transition validation enforced
- [ ] Refund alerts endpoint returns correct data

### Before Committing Phase 4
- [ ] Admin UI visually tested for all new states
- [ ] minThresholdUnits field saves correctly
- [ ] Action buttons appear/disappear based on state

### Before PR
- [ ] All unit tests pass
- [ ] Manual testing checklist complete
- [ ] No console errors in browser
- [ ] Audit logs verified for all flows
- [ ] Documentation updated (if needed)

---

**Estimated Total Time:** 16-21 hours
**Implementation Branch:** `feature/campaign-lifecycle-completion`
**Target:** Dev branch merge → QA → Production
