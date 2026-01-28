# Campaign Lifecycle Completion - Testing Guide

## Overview
This guide covers manual testing procedures for the campaign lifecycle automation system implemented in Phase 2-5.

## Prerequisites
- Server running with `npm run dev` (background job starts automatically)
- Admin access to the admin console
- Access to database for verification

## Test Scenarios

### 1. Background Job Verification

**Objective**: Verify the background job starts and runs periodically

**Steps**:
1. Start the server: `npm run dev`
2. Check server logs for: "Campaign lifecycle job started"
3. Confirm no errors in console

**Expected Result**:
- Log message appears on server start
- No errors during startup
- Job runs every 2 minutes (check logs for processing activity)

**Verification**:
```bash
# Check logs
grep "Campaign lifecycle job" logs/server.log
grep "LIFECYCLE" logs/server.log
```

---

### 2. Funded Campaign Auto-Transition (SUCCESS → PROCUREMENT)

**Objective**: Verify campaigns that meet threshold auto-transition to PROCUREMENT

**Steps**:
1. Create test campaign via Admin Console:
   - Title: "Test Auto-Funded Campaign"
   - Target Units: 100
   - Unit Price: $10
   - Deadline: Set to 2 minutes in the future
   - Publish the campaign

2. Create commitments totaling 100+ units:
   - Navigate to campaign detail page
   - Create commitments via participant flow or admin tools
   - Verify total committed units ≥ 100

3. Wait for deadline to pass (2+ minutes)

4. Wait for next background job cycle (max 2 minutes)

5. Check campaign state in Admin Console

**Expected Result**:
- Campaign transitions: AGGREGATION → SUCCESS → PROCUREMENT
- Both transitions logged in admin action logs
- Actor shown as "SYSTEM_DEADLINE_AUTOMATION"
- All commitments remain LOCKED
- No refunds processed

**Verification SQL**:
```sql
-- Check campaign state
SELECT id, title, state, aggregation_deadline, processing_lock
FROM campaigns
WHERE title = 'Test Auto-Funded Campaign';

-- Check audit logs
SELECT * FROM admin_action_logs
WHERE campaign_id = '<campaign-id>'
ORDER BY created_at DESC;

-- Verify commitments unchanged
SELECT status, COUNT(*)
FROM commitments
WHERE campaign_id = '<campaign-id>'
GROUP BY status;
```

---

### 3. Failed Campaign Auto-Refund (FAILED + Refunds)

**Objective**: Verify unfunded campaigns fail and trigger automatic refunds

**Steps**:
1. Create test campaign via Admin Console:
   - Title: "Test Auto-Failed Campaign"
   - Target Units: 100
   - Unit Price: $10
   - Deadline: Set to 2 minutes in the future
   - Publish the campaign

2. Create commitments totaling LESS than 100 units:
   - Create 5 commitments of 10 units each (50 total)
   - Verify total < 100

3. Wait for deadline + background job cycle

4. Check campaign state and commitments

**Expected Result**:
- Campaign transitions: AGGREGATION → FAILED
- All commitments transition: LOCKED → REFUNDED
- REFUND entries created in escrow_ledger
- Actor: "SYSTEM_DEADLINE_AUTOMATION"
- Refund reason mentions "automatic refund - campaign failed"

**Verification SQL**:
```sql
-- Check campaign state
SELECT state FROM campaigns WHERE title = 'Test Auto-Failed Campaign';

-- Verify all refunded
SELECT status, COUNT(*)
FROM commitments
WHERE campaign_id = '<campaign-id>'
GROUP BY status;

-- Check refund entries
SELECT * FROM escrow_ledger
WHERE campaign_id = '<campaign-id>'
AND entry_type = 'REFUND'
ORDER BY created_at DESC;
```

---

### 4. Threshold Evaluation (minThresholdUnits)

**Objective**: Verify minThresholdUnits is used when set (admin-only breakeven threshold)

**Steps**:
1. Create campaign via Admin Console:
   - Title: "Test Min Threshold"
   - Target Units: 100
   - **Min Threshold Units: 50** (admin-only field)
   - Unit Price: $10
   - Deadline: 2 minutes in future

2. Create 60 units worth of commitments (between min threshold and target)

3. Wait for deadline + job cycle

**Expected Result**:
- Campaign succeeds (60 ≥ 50 threshold)
- Campaign state: PROCUREMENT
- Uses minThresholdUnits, not targetUnits for evaluation

**Verification**:
```sql
SELECT
  title,
  state,
  target_units,
  min_threshold_units,
  (SELECT SUM(quantity) FROM commitments WHERE campaign_id = campaigns.id) as total_committed
FROM campaigns
WHERE title = 'Test Min Threshold';
```

---

### 5. Processing Lock Mechanism

**Objective**: Verify row-level locks prevent duplicate processing

**Steps**:
1. Create campaign with past deadline
2. Manually set processing lock:
   ```sql
   UPDATE campaigns
   SET processing_lock = NOW()
   WHERE id = '<campaign-id>';
   ```
3. Wait for background job cycle
4. Check campaign state (should remain unchanged)
5. Wait 6+ minutes, check again (stale lock should be processed)

**Expected Result**:
- Active lock prevents processing
- Stale lock (>5 minutes) allows processing
- No duplicate transitions logged

---

### 6. Admin UI State Display

**Objective**: Verify new states display correctly in admin UI

**Steps**:
1. Navigate to Admin Console → Campaigns
2. Check state filter dropdown
3. Create campaigns in different states
4. Verify badges and labels

**Expected Result**:
- State filters include: PROCUREMENT, COMPLETED
- PROCUREMENT badge: Orange "Processing"
- COMPLETED badge: Green "Completed"
- Campaign detail page shows correct state colors
- State timeline component shows all states

---

### 7. Participant UI State Display

**Objective**: Verify participant-facing state labels are correct

**Steps**:
1. Create test campaign and commitments
2. Navigate to participant account dashboard
3. Check commitment card state labels

**Expected Result**:
- PROCUREMENT shows as "Processing"
- COMPLETED shows as "Completed"
- Colors match design: orange for PROCUREMENT, gray for COMPLETED

---

### 8. Refund Alerts API

**Objective**: Verify refund alert tracking works

**Steps**:
1. Manually create refund alert (simulating failure):
   ```sql
   INSERT INTO refund_alerts (campaign_id, commitment_id, error_message)
   VALUES ('<campaign-id>', '<commitment-id>', 'Test refund processing failure');
   ```

2. Navigate to Admin Console (future feature: Alerts page)
3. Test API endpoint:
   ```bash
   curl -X GET "http://localhost:5000/api/admin/refund-alerts?unresolvedOnly=true" \
     -H "Cookie: <admin-session-cookie>"
   ```

**Expected Result**:
- Alert appears in API response
- Shows campaign title, commitment reference, error message
- `requiresManualIntervention: true`
- `resolvedAt: null`

---

## Performance Testing

### Background Job Performance

**Test Load**:
1. Create 50 campaigns with past deadlines
2. Monitor background job execution time
3. Check for processing lock contention

**Expected**:
- Job completes within 2-minute interval
- No lock timeout errors
- All campaigns processed within 1-2 cycles

**Monitoring**:
```bash
# Watch logs
tail -f logs/server.log | grep LIFECYCLE

# Check processing locks
SELECT id, title, processing_lock
FROM campaigns
WHERE processing_lock IS NOT NULL;
```

---

## Rollback Testing

### Graceful Shutdown

**Steps**:
1. Start server
2. Send SIGTERM: `kill -15 <pid>`
3. Check logs for "stopping background jobs"

**Expected**:
- Job stops cleanly
- No orphaned processing locks
- No errors on shutdown

---

## Edge Cases

### 1. Campaign with No Commitments
- Creates FAILED state
- No refunds to process
- Audit log shows 0 units committed

### 2. Campaign Already Processed
- Job skips non-AGGREGATION states
- No duplicate processing
- Logs show "no expired campaigns"

### 3. Future Deadline
- Job skips campaigns not yet expired
- State remains AGGREGATION
- No premature transitions

---

## Troubleshooting

### Background Job Not Running
```bash
# Check if job started
grep "Campaign lifecycle job started" logs/server.log

# Verify NODE_ENV
echo $NODE_ENV  # Should not be "test"

# Check for errors
grep ERROR logs/server.log | grep LIFECYCLE
```

### Campaigns Not Processing
```sql
-- Check for stuck processing locks
SELECT id, title, processing_lock, aggregation_deadline
FROM campaigns
WHERE state = 'AGGREGATION'
AND aggregation_deadline < NOW();

-- Clear stuck locks manually
UPDATE campaigns
SET processing_lock = NULL
WHERE processing_lock < NOW() - INTERVAL '10 minutes';
```

### Refunds Not Processing
```sql
-- Check commitment states
SELECT status, COUNT(*)
FROM commitments
WHERE campaign_id = '<campaign-id>'
GROUP BY status;

-- Check for refund alerts
SELECT * FROM refund_alerts
WHERE campaign_id = '<campaign-id>'
AND resolved_at IS NULL;
```

---

## Test Checklist

- [ ] Background job starts on server launch
- [ ] Funded campaigns auto-transition to PROCUREMENT
- [ ] Failed campaigns trigger automatic refunds
- [ ] minThresholdUnits used when set
- [ ] Processing locks prevent duplicate processing
- [ ] PROCUREMENT state displays in admin UI
- [ ] COMPLETED state displays in admin UI
- [ ] Participant UI shows correct state labels
- [ ] Audit logs record all transitions
- [ ] Actor shows as SYSTEM_DEADLINE_AUTOMATION
- [ ] Refund alerts API returns correct data
- [ ] Graceful shutdown works correctly
- [ ] Edge cases handled (no commitments, future deadline, etc.)

---

## Success Criteria

✅ **Phase 2-5 Implementation Complete When**:
- All manual tests pass
- 19/20 automated tests passing
- Background job runs without errors
- State transitions logged correctly
- Automatic refunds work
- UI displays new states correctly
- No silent transitions (all logged)
- Performance meets requirements (<2 min cycle time)
