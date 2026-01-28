# Campaign Lifecycle Completion - Design Document

**Date:** 2026-01-28
**Status:** Approved
**Owner:** Campaign Lifecycle Team
**Scope:** Complete PRD-aligned state machine + deadline automation

---

## 1. Executive Summary

This design completes the campaign lifecycle system to match PRD Phase 0-1 requirements. It adds missing states (PROCUREMENT, COMPLETED), implements deadline automation with threshold-based success evaluation, and ensures "no silent transitions" through background job automation and comprehensive audit logging.

**Key Outcomes:**
- PRD-aligned state machine: `AGGREGATION → SUCCESS → PROCUREMENT → FULFILLMENT → COMPLETED`
- Automatic deadline processing with configurable success thresholds
- Automatic refund processing on campaign failure
- Full audit trail for all state transitions
- Admin-only breakeven threshold field (competitive safety)

---

## 2. State Machine Architecture

### Current State
```
AGGREGATION → SUCCESS → FULFILLMENT → RELEASED
     ↓           ↓           ↓
   FAILED     FAILED      FAILED
```

### New State Machine (PRD-Aligned)
```
AGGREGATION → SUCCESS → PROCUREMENT → FULFILLMENT → COMPLETED
     ↓           ↓            ↓             ↓
   FAILED     FAILED       FAILED        FAILED
```

### State Definitions

**AGGREGATION:** Campaign accepting participants until deadline
- Entry: Campaign published by admin
- Exit: Deadline passes (auto) or admin marks funded (manual)
- Participant action: Can join campaign

**SUCCESS:** Campaign funded, order processing pending
- Entry: Deadline passed with sufficient participation
- Exit: Auto-transition to PROCUREMENT immediately after funding confirmed
- Participant view: "Campaign funded! Order processing starting soon."

**PROCUREMENT:** Admin coordinating with supplier, placing order
- Entry: Automatic after SUCCESS
- Exit: Admin manually transitions to FULFILLMENT when order placed
- Purpose: Admin working period between funding confirmation and fulfillment start
- Participant view: "Order being placed with supplier"

**FULFILLMENT:** Supplier fulfilling orders
- Entry: Admin confirms procurement complete
- Exit: Admin marks as completed when all fulfilled
- Participant view: "Supplier is fulfilling your order"

**COMPLETED:** Campaign successfully completed, escrow released
- Entry: Admin confirms fulfillment complete
- Exit: None (terminal state)
- Participant view: "Campaign completed successfully"

**FAILED:** Campaign did not meet threshold or was cancelled
- Entry: Deadline passed unfunded OR admin fails campaign
- Exit: None (terminal state)
- Automatic action: All locked funds refunded immediately
- Participant view: "Campaign did not reach minimum participation. Full refund issued."

### Transition Rules

```typescript
export const VALID_TRANSITIONS: Record<CampaignState, CampaignState[]> = {
  AGGREGATION: ["SUCCESS", "FAILED"],      // Auto (deadline) or manual
  SUCCESS: ["PROCUREMENT", "FAILED"],       // Auto → PROCUREMENT, manual → FAILED
  PROCUREMENT: ["FULFILLMENT", "FAILED"],   // Manual only
  FULFILLMENT: ["COMPLETED", "FAILED"],     // Manual only
  FAILED: [],                                // Terminal
  COMPLETED: [],                             // Terminal
};
```

### Design Rationale

**Why no DESIGN state?**
- Existing DRAFT/PUBLISHED system handles "design vs live" distinction
- DRAFT campaigns are effectively in design phase until published
- Adding DESIGN state would be redundant complexity
- PRD compliance: DRAFT status maps to "DESIGN" conceptually

**Why PROCUREMENT between SUCCESS and FULFILLMENT?**
- Clear separation: "we got funded" vs "we're ordering" vs "supplier is fulfilling"
- Gives admin breathing room to coordinate before fulfillment starts
- Matches real operational workflow
- PRD explicitly shows: SUCCESS → PROCUREMENT → FULFILLMENT

**Why auto-transition SUCCESS → PROCUREMENT?**
- Funded status immediately triggers procurement workflow
- Admin still controls exit from PROCUREMENT (manual transition to FULFILLMENT)
- Reduces admin burden while preserving control at critical gate

---

## 3. Minimum Threshold System

### Problem
Campaign target (e.g., 100 units) may differ from operational breakeven point (e.g., 80 units). Current system only checks against target, making campaigns fail even when profitable.

### Solution: Admin-Only Threshold Field

**New Database Field:**
```typescript
minThresholdUnits: integer | null
```

**Behavior:**
- If set: Campaign succeeds when `totalUnits >= minThresholdUnits`
- If null: Campaign succeeds when `totalUnits >= targetUnits` (existing behavior)
- **Never exposed to participants** (competitive safety - no economics disclosure)

**Admin UI:**
```
Prerequisites Section:
┌─────────────────────────────────────────┐
│ Target Units: [100]                     │
│ Min Threshold Units: [80] (optional)    │
│                                          │
│ ℹ️ Admin-only: Campaign succeeds if     │
│   this threshold is met by deadline.    │
│   If not set, uses target units.        │
│   Never shown to participants.          │
└─────────────────────────────────────────┘
```

**Participant View:**
- Always sees: "Target: 100 units" (aspirational goal)
- Never sees: Breakeven threshold (80 units)
- Progress bar: "85 / 100 units" (shows target, not threshold)

**Automation Logic:**
```typescript
const threshold = campaign.minThresholdUnits ?? campaign.targetUnits;
const totalUnits = commitments.reduce((sum, c) => sum + c.quantity, 0);
const isFunded = totalUnits >= threshold;

if (isFunded) {
  // SUCCESS → PROCUREMENT
} else {
  // FAILED + refunds
}
```

---

## 4. Deadline Automation System

### Background Job Architecture

**Implementation:**
```typescript
// server/jobs/campaign-lifecycle.ts
class CampaignLifecycleJob {
  private interval: NodeJS.Timeout | null = null;

  start() {
    // Run every 2 minutes
    this.interval = setInterval(() => this.processExpiredCampaigns(), 120000);
    console.log("[LIFECYCLE] Background job started (interval: 2min)");
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log("[LIFECYCLE] Background job stopped");
    }
  }

  async processExpiredCampaigns() {
    // Find campaigns past deadline still in AGGREGATION
    const expiredCampaigns = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.state, "AGGREGATION"),
          lt(campaigns.aggregationDeadline, new Date())
        )
      );

    for (const campaign of expiredCampaigns) {
      await this.processSingleCampaign(campaign);
    }
  }

  async processSingleCampaign(campaign: Campaign) {
    // Acquire lock to prevent duplicate processing
    const lock = await this.acquireProcessingLock(campaign.id);
    if (!lock) return; // Another instance processing

    try {
      // Calculate total committed units
      const commitments = await storage.getCommitments(campaign.id);
      const totalUnits = commitments.reduce((sum, c) => sum + c.quantity, 0);

      // Determine threshold (minThresholdUnits or targetUnits)
      const threshold = campaign.minThresholdUnits ?? campaign.targetUnits;
      const isFunded = totalUnits >= threshold;

      if (isFunded) {
        // Transition: AGGREGATION → SUCCESS
        await storage.updateCampaignState(campaign.id, "SUCCESS");
        await storage.createAdminActionLog({
          campaignId: campaign.id,
          adminUsername: "SYSTEM_DEADLINE_AUTOMATION",
          action: "STATE_TRANSITION",
          previousState: "AGGREGATION",
          newState: "SUCCESS",
          reason: `Deadline passed, funded: YES (${totalUnits}/${threshold} units)`,
        });

        // Auto-chain: SUCCESS → PROCUREMENT
        await storage.updateCampaignState(campaign.id, "PROCUREMENT");
        await storage.createAdminActionLog({
          campaignId: campaign.id,
          adminUsername: "SYSTEM_DEADLINE_AUTOMATION",
          action: "STATE_TRANSITION",
          previousState: "SUCCESS",
          newState: "PROCUREMENT",
          reason: "Auto-transition to procurement after funding confirmed",
        });

      } else {
        // Transition: AGGREGATION → FAILED
        await storage.updateCampaignState(campaign.id, "FAILED");
        await storage.createAdminActionLog({
          campaignId: campaign.id,
          adminUsername: "SYSTEM_DEADLINE_AUTOMATION",
          action: "STATE_TRANSITION",
          previousState: "AGGREGATION",
          newState: "FAILED",
          reason: `Deadline passed, funded: NO (${totalUnits}/${threshold} units)`,
        });

        // Process automatic refunds
        await this.processAutoRefunds(campaign.id, commitments);
      }

    } finally {
      await this.releaseProcessingLock(campaign.id);
    }
  }
}

export const campaignLifecycleJob = new CampaignLifecycleJob();
```

**Server Integration:**
```typescript
// server/index.ts
import { campaignLifecycleJob } from './jobs/campaign-lifecycle';

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  campaignLifecycleJob.start(); // Start background job
});

// Graceful shutdown
process.on('SIGTERM', () => {
  campaignLifecycleJob.stop();
  server.close();
});
```

### Processing Lock Mechanism

**Purpose:** Prevent duplicate processing if multiple server instances running

**Implementation:**
```typescript
// Use database row-level lock
async acquireProcessingLock(campaignId: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      UPDATE campaigns
      SET processing_lock = NOW()
      WHERE id = ${campaignId}
        AND (processing_lock IS NULL OR processing_lock < NOW() - INTERVAL '10 minutes')
      RETURNING id
    `);
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

async releaseProcessingLock(campaignId: string) {
  await db.execute(sql`
    UPDATE campaigns SET processing_lock = NULL WHERE id = ${campaignId}
  `);
}
```

**Schema Change:**
```sql
ALTER TABLE campaigns ADD COLUMN processing_lock timestamp;
```

---

## 5. Automatic Refund Processing

### Trigger Conditions
Refunds are automatically processed when campaign transitions to FAILED:
1. Deadline passes with insufficient funding (background job)
2. Admin manually fails campaign (any state except COMPLETED)

### Processing Logic

```typescript
async processAutoRefunds(campaignId: string, commitments: Commitment[]) {
  const lockedCommitments = commitments.filter(c => c.status === "LOCKED");

  console.log(`[REFUND] Processing ${lockedCommitments.length} refunds for campaign ${campaignId}`);

  for (const commitment of lockedCommitments) {
    try {
      // Create REFUND escrow entry
      await storage.createEscrowEntry({
        commitmentId: commitment.id,
        campaignId: campaignId,
        entryType: "REFUND",
        amount: commitment.amount,
        reason: "Campaign failed - automatic refund",
        actor: "SYSTEM_REFUND_AUTOMATION",
      });

      // Update commitment status
      await storage.updateCommitmentStatus(commitment.id, "REFUNDED");

      console.log(`[REFUND] Processed refund for commitment ${commitment.referenceNumber}`);

    } catch (error) {
      // Log failure but continue processing other refunds
      console.error(`[REFUND] Failed to process refund for ${commitment.referenceNumber}:`, error);

      // Create alert for admin intervention
      await storage.createRefundAlert({
        campaignId,
        commitmentId: commitment.id,
        errorMessage: error.message,
        requiresManualIntervention: true,
      });
    }
  }
}
```

### Idempotency
- Refund processing only affects LOCKED commitments
- Safe to re-run: already REFUNDED commitments are skipped
- No duplicate refund entries created

### Error Handling
- Individual refund failures logged to dedicated alert table
- Other refunds continue processing (don't block batch)
- Admin receives alert dashboard notification
- Manual intervention required for failed refunds only

---

## 6. Database Migration

### Schema Changes

```sql
-- Migration: 2026-01-28-campaign-lifecycle-completion.sql

-- 1. Add new states to enum
ALTER TYPE campaign_state ADD VALUE IF NOT EXISTS 'PROCUREMENT';
ALTER TYPE campaign_state ADD VALUE IF NOT EXISTS 'COMPLETED';

-- 2. Add minThresholdUnits column (admin-only breakeven threshold)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS min_threshold_units integer;

-- 3. Add processing lock for background job coordination
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS processing_lock timestamp;

-- 4. Migrate existing RELEASED campaigns to COMPLETED
UPDATE campaigns
SET state = 'COMPLETED'
WHERE state = 'RELEASED';

-- 5. Create refund alerts table for error tracking
CREATE TABLE IF NOT EXISTS refund_alerts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id varchar NOT NULL REFERENCES campaigns(id),
  commitment_id varchar NOT NULL REFERENCES commitments(id),
  error_message text NOT NULL,
  requires_manual_intervention boolean DEFAULT true,
  resolved_at timestamp,
  resolved_by text,
  created_at timestamp DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS refund_alerts_unresolved_idx
ON refund_alerts(requires_manual_intervention, created_at)
WHERE resolved_at IS NULL;

-- Note: Cannot remove 'RELEASED' from enum (Postgres limitation)
-- Validation in code will prevent new uses
```

### Type Updates

```typescript
// shared/schema.ts

export const campaignStateEnum = pgEnum("campaign_state", [
  "AGGREGATION",
  "SUCCESS",
  "PROCUREMENT",
  "FULFILLMENT",
  "COMPLETED",
  "FAILED",
  // "RELEASED" - deprecated, migrated to COMPLETED
]);

export type CampaignState =
  | "AGGREGATION"
  | "SUCCESS"
  | "PROCUREMENT"
  | "FULFILLMENT"
  | "COMPLETED"
  | "FAILED";

export const campaigns = pgTable("campaigns", {
  // ... existing fields
  minThresholdUnits: integer("min_threshold_units"), // Admin-only breakeven
  processingLock: timestamp("processing_lock"), // Background job coordination
});

export const refundAlerts = pgTable("refund_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  commitmentId: varchar("commitment_id").notNull().references(() => commitments.id),
  errorMessage: text("error_message").notNull(),
  requiresManualIntervention: boolean("requires_manual_intervention").default(true),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const VALID_TRANSITIONS: Record<CampaignState, CampaignState[]> = {
  AGGREGATION: ["SUCCESS", "FAILED"],
  SUCCESS: ["PROCUREMENT", "FAILED"],
  PROCUREMENT: ["FULFILLMENT", "FAILED"],
  FULFILLMENT: ["COMPLETED", "FAILED"],
  FAILED: [],
  COMPLETED: [],
};
```

### Migration Execution

**Development:**
```bash
npm run db:push  # Push schema changes
```

**Production:**
```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 2. Run migration
psql $DATABASE_URL < migrations/2026-01-28-campaign-lifecycle-completion.sql

# 3. Verify
psql $DATABASE_URL -c "SELECT state, COUNT(*) FROM campaigns GROUP BY state;"
```

**Rollback Plan:**
- Migration is additive (no destructive changes)
- If issues: stop background job, manually correct states via SQL
- Audit logs preserve full history for recovery

---

## 7. Admin UI Updates

### Campaign Detail Page

**1. Prerequisites Section - Add Threshold Field:**
```tsx
<FormSection title="Campaign Prerequisites">
  {/* Existing fields: product, supplier, consolidation point */}

  <FormField label="Target Units" required>
    <Input
      type="number"
      value={targetUnits}
      onChange={(e) => setTargetUnits(Number(e.target.value))}
    />
    <HelpText>
      Goal shown to participants. Campaign can succeed below this if min threshold is set.
    </HelpText>
  </FormField>

  <FormField
    label="Min Threshold Units (Breakeven)"
    adminOnly
    badge="Admin Only"
  >
    <Input
      type="number"
      value={minThresholdUnits || ""}
      placeholder="Optional - defaults to target units"
      onChange={(e) => setMinThresholdUnits(e.target.value ? Number(e.target.value) : null)}
    />
    <HelpText variant="warning">
      Admin-only: Campaign succeeds if this threshold is met by deadline.
      If not set, uses target units. Never shown to participants (competitive safety).
    </HelpText>
  </FormField>
</FormSection>
```

**2. State Badge Component:**
```tsx
function CampaignStateBadge({ state }: { state: CampaignState }) {
  const badges = {
    AGGREGATION: <Badge variant="info">Aggregating</Badge>,
    SUCCESS: <Badge variant="success">Funded</Badge>,
    PROCUREMENT: <Badge variant="warning">Procurement</Badge>,
    FULFILLMENT: <Badge variant="warning">Fulfillment</Badge>,
    COMPLETED: <Badge variant="success">Completed</Badge>,
    FAILED: <Badge variant="destructive">Failed</Badge>,
  };
  return badges[state];
}
```

**3. Action Buttons (Context-Aware):**
```tsx
function CampaignActions({ campaign }: { campaign: Campaign }) {
  const actions = {
    AGGREGATION: [
      { code: "MARK_FUNDED", label: "Mark as Funded", variant: "default" },
      { code: "FAIL_CAMPAIGN", label: "Fail Campaign", variant: "destructive" },
    ],
    SUCCESS: [
      { code: "START_PROCUREMENT", label: "Start Procurement", variant: "default" },
      { code: "FAIL_CAMPAIGN", label: "Fail Campaign", variant: "destructive" },
    ],
    PROCUREMENT: [
      { code: "START_FULFILLMENT", label: "Start Fulfillment", variant: "default" },
      { code: "FAIL_CAMPAIGN", label: "Fail Campaign", variant: "destructive" },
    ],
    FULFILLMENT: [
      { code: "MARK_COMPLETED", label: "Mark as Completed", variant: "default" },
      { code: "FAIL_CAMPAIGN", label: "Fail Campaign", variant: "destructive" },
    ],
    COMPLETED: [],
    FAILED: [],
  };

  return (
    <div className="flex gap-2">
      {actions[campaign.state].map(action => (
        <Button
          key={action.code}
          variant={action.variant}
          onClick={() => performAction(campaign.id, action.code)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
```

**4. Admin Action Codes:**
```typescript
// server/routes.ts - Updated action endpoint

const actionCodeMap = {
  MARK_FUNDED: {
    from: "AGGREGATION",
    to: "SUCCESS",
    then: "PROCUREMENT", // Auto-chain
    reason: "Manually marked as funded by admin",
  },
  START_PROCUREMENT: {
    from: "SUCCESS",
    to: "PROCUREMENT",
    reason: "Manually started procurement",
  },
  START_FULFILLMENT: {
    from: "PROCUREMENT",
    to: "FULFILLMENT",
    requires: (c) => c.supplierAcceptedAt !== null,
    reason: "Fulfillment started by admin",
  },
  MARK_COMPLETED: {
    from: "FULFILLMENT",
    to: "COMPLETED",
    reason: "Campaign marked as completed by admin",
  },
  FAIL_CAMPAIGN: {
    from: ["AGGREGATION", "SUCCESS", "PROCUREMENT", "FULFILLMENT"],
    to: "FAILED",
    reason: "Campaign failed by admin",
    autoRefund: true,
  },
};
```

### Campaign List Filters

```tsx
const stateFilters = [
  { value: "AGGREGATION", label: "Aggregating", count: aggregatingCount },
  { value: "SUCCESS", label: "Funded", count: fundedCount },
  { value: "PROCUREMENT", label: "Procurement", count: procurementCount },
  { value: "FULFILLMENT", label: "Fulfillment", count: fulfillmentCount },
  { value: "COMPLETED", label: "Completed", count: completedCount },
  { value: "FAILED", label: "Failed", count: failedCount },
];
```

### Refund Alerts Dashboard (New)

```tsx
// New admin page: /admin/alerts

function RefundAlertsDashboard() {
  const { data: alerts } = useQuery({
    queryKey: ["admin", "refund-alerts"],
    queryFn: () => fetch("/api/admin/refund-alerts").then(r => r.json()),
  });

  return (
    <div>
      <h1>Refund Alerts - Manual Intervention Required</h1>
      {alerts?.map(alert => (
        <AlertCard key={alert.id}>
          <AlertTitle>Refund Failed: {alert.commitmentId}</AlertTitle>
          <AlertDescription>
            Campaign: {alert.campaignTitle}
            Error: {alert.errorMessage}
            Created: {formatDate(alert.createdAt)}
          </AlertDescription>
          <Button onClick={() => retryRefund(alert.id)}>Retry Refund</Button>
          <Button variant="outline" onClick={() => markResolved(alert.id)}>
            Mark Resolved
          </Button>
        </AlertCard>
      ))}
    </div>
  );
}
```

---

## 8. Participant UI Updates

### Status Messages

```typescript
const participantStatusMessages = {
  AGGREGATION: {
    title: "Campaign is Active",
    description: "Accepting participants until {deadline}",
    variant: "info",
  },
  SUCCESS: {
    title: "Campaign Funded!",
    description: "Order processing starting soon. You'll be notified of progress.",
    variant: "success",
  },
  PROCUREMENT: {
    title: "Order Being Placed",
    description: "We're coordinating with the supplier to finalize your order.",
    variant: "warning",
  },
  FULFILLMENT: {
    title: "Order in Progress",
    description: "Supplier is fulfilling your order. Delivery timeline: {deliveryWindow}",
    variant: "warning",
  },
  COMPLETED: {
    title: "Campaign Completed",
    description: "Your order has been successfully fulfilled.",
    variant: "success",
  },
  FAILED: {
    title: "Campaign Did Not Succeed",
    description: "Minimum participation not reached. Full refund has been issued to your account.",
    variant: "destructive",
  },
};
```

### Campaign Page Updates

```tsx
// client/src/pages/campaign.tsx

function CampaignStatusBanner({ campaign }: { campaign: Campaign }) {
  const status = participantStatusMessages[campaign.state];

  return (
    <Alert variant={status.variant}>
      <AlertTitle>{status.title}</AlertTitle>
      <AlertDescription>
        {status.description
          .replace("{deadline}", formatDate(campaign.aggregationDeadline))
          .replace("{deliveryWindow}", campaign.deliveryWindow || "TBD")}
      </AlertDescription>
    </Alert>
  );
}
```

### Dashboard Updates

```tsx
// client/src/pages/account/index.tsx

// Update commitment cards to show new states
function CommitmentCard({ commitment }: { commitment: Commitment }) {
  const stateLabels = {
    AGGREGATION: "Active",
    SUCCESS: "Funded",
    PROCUREMENT: "Processing",
    FULFILLMENT: "In Progress",
    COMPLETED: "Completed",
    FAILED: "Refunded",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{commitment.campaignTitle}</CardTitle>
        <Badge>{stateLabels[commitment.campaignState]}</Badge>
      </CardHeader>
      {/* ... rest of card */}
    </Card>
  );
}
```

---

## 9. Error Handling & Edge Cases

### Race Condition: User Commits During Deadline

**Scenario:** User submits commitment form while deadline passes and background job processes campaign

**Solution:**
```typescript
// Before accepting commitment
const campaign = await storage.getCampaign(campaignId);

if (campaign.state !== "AGGREGATION") {
  return res.status(400).json({
    error: "Campaign is no longer accepting participants",
    currentState: campaign.state,
  });
}

// Additional check: deadline not passed
if (new Date(campaign.aggregationDeadline) < new Date()) {
  return res.status(400).json({
    error: "Campaign deadline has passed",
  });
}
```

### Duplicate Processing Prevention

**Scenario:** Multiple server instances try to process same campaign

**Solution:** Row-level database lock (see Section 4)

### Partial Refund Failures

**Scenario:** Some refunds succeed, others fail (network/DB errors)

**Solution:**
- Process each refund in try-catch
- Log failures to `refund_alerts` table
- Continue processing other refunds (don't block batch)
- Admin dashboard shows failed refunds requiring intervention

```typescript
for (const commitment of lockedCommitments) {
  try {
    await processRefund(commitment);
  } catch (error) {
    await createRefundAlert({
      campaignId,
      commitmentId: commitment.id,
      errorMessage: error.message,
      requiresManualIntervention: true,
    });
    // Continue to next refund
  }
}
```

### Background Job Crash Recovery

**Scenario:** Server crashes mid-processing

**Solution:**
- Job is stateless: always queries fresh data
- Processing locks timeout after 10 minutes (stale lock prevention)
- Next job run picks up where previous left off
- Audit logs show exact progress for manual recovery if needed

### Admin Manual Override During Automation

**Scenario:** Admin manually transitions campaign while background job processing

**Solution:**
- State transition validation prevents invalid moves
- Processing lock prevents simultaneous updates
- Audit logs show both attempts (one succeeds, one fails gracefully)
- Last successful transition wins

---

## 10. Testing Strategy

### Unit Tests (Vitest)

```typescript
// server/jobs/campaign-lifecycle.test.ts

describe("Campaign Deadline Processing", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  test("funded campaign transitions to PROCUREMENT", async () => {
    const campaign = await createTestCampaign({
      targetUnits: 100,
      minThresholdUnits: 80,
      aggregationDeadline: pastDate(),
    });
    await createTestCommitments(campaign.id, 85); // Above threshold

    await campaignLifecycleJob.processExpiredCampaigns();

    const updated = await storage.getCampaign(campaign.id);
    expect(updated.state).toBe("PROCUREMENT");

    // Verify audit logs
    const logs = await storage.getAdminActionLogs(campaign.id);
    expect(logs).toHaveLength(2); // AGGREGATION→SUCCESS, SUCCESS→PROCUREMENT
    expect(logs[0].actor).toBe("SYSTEM_DEADLINE_AUTOMATION");
  });

  test("unfunded campaign transitions to FAILED with refunds", async () => {
    const campaign = await createTestCampaign({
      targetUnits: 100,
      minThresholdUnits: 80,
      aggregationDeadline: pastDate(),
    });
    const commitmentIds = await createTestCommitments(campaign.id, 50); // Below threshold

    await campaignLifecycleJob.processExpiredCampaigns();

    const updated = await storage.getCampaign(campaign.id);
    expect(updated.state).toBe("FAILED");

    // Verify all commitments refunded
    for (const id of commitmentIds) {
      const commitment = await storage.getCommitment(id);
      expect(commitment.status).toBe("REFUNDED");

      // Verify escrow entry created
      const escrowEntries = await storage.getEscrowEntriesByCommitment(id);
      const refundEntry = escrowEntries.find(e => e.entryType === "REFUND");
      expect(refundEntry).toBeDefined();
      expect(refundEntry.actor).toBe("SYSTEM_REFUND_AUTOMATION");
    }
  });

  test("uses targetUnits when minThresholdUnits is null", async () => {
    const campaign = await createTestCampaign({
      targetUnits: 100,
      minThresholdUnits: null, // Not set
      aggregationDeadline: pastDate(),
    });
    await createTestCommitments(campaign.id, 95); // Below target, above most breakevens

    await campaignLifecycleJob.processExpiredCampaigns();

    const updated = await storage.getCampaign(campaign.id);
    expect(updated.state).toBe("FAILED"); // Should fail since 95 < 100
  });

  test("duplicate processing is prevented", async () => {
    const campaign = await createTestCampaign({
      aggregationDeadline: pastDate(),
    });

    // Simulate two job instances
    const promise1 = campaignLifecycleJob.processSingleCampaign(campaign);
    const promise2 = campaignLifecycleJob.processSingleCampaign(campaign);

    await Promise.all([promise1, promise2]);

    // Verify only one set of audit logs created
    const logs = await storage.getAdminActionLogs(campaign.id);
    expect(logs.filter(l => l.actor === "SYSTEM_DEADLINE_AUTOMATION")).toHaveLength(2); // SUCCESS + PROCUREMENT
  });

  test("partial refund failure doesn't block others", async () => {
    const campaign = await createTestCampaign({
      aggregationDeadline: pastDate(),
    });
    const commitmentIds = await createTestCommitments(campaign.id, 5);

    // Mock one refund to fail
    const originalCreateEscrowEntry = storage.createEscrowEntry;
    let failureCount = 0;
    storage.createEscrowEntry = jest.fn(async (data) => {
      if (failureCount === 0 && data.commitmentId === commitmentIds[2]) {
        failureCount++;
        throw new Error("Simulated refund failure");
      }
      return originalCreateEscrowEntry(data);
    });

    await campaignLifecycleJob.processExpiredCampaigns();

    // Verify 4 succeeded, 1 failed
    const commitments = await storage.getCommitments(campaign.id);
    const refundedCount = commitments.filter(c => c.status === "REFUNDED").length;
    expect(refundedCount).toBe(4);

    // Verify alert created for failed refund
    const alerts = await storage.getRefundAlerts(campaign.id);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].commitmentId).toBe(commitmentIds[2]);
  });
});

describe("State Transition Validation", () => {
  test("invalid transitions are rejected", async () => {
    const campaign = await createTestCampaign({ state: "COMPLETED" });

    await expect(
      storage.updateCampaignState(campaign.id, "AGGREGATION")
    ).rejects.toThrow("Invalid transition");
  });

  test("VALID_TRANSITIONS enforced", async () => {
    const campaign = await createTestCampaign({ state: "PROCUREMENT" });

    // Valid: PROCUREMENT → FULFILLMENT
    await expect(
      storage.updateCampaignState(campaign.id, "FULFILLMENT")
    ).resolves.not.toThrow();

    // Invalid: FULFILLMENT → AGGREGATION
    await expect(
      storage.updateCampaignState(campaign.id, "AGGREGATION")
    ).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
describe("Full Lifecycle Integration", () => {
  test("happy path: AGGREGATION → COMPLETED", async () => {
    // 1. Create campaign
    const campaign = await createCampaign({
      state: "AGGREGATION",
      targetUnits: 100,
      minThresholdUnits: 80,
      aggregationDeadline: futureDate(1), // 1 day from now
    });

    // 2. Add commitments
    await createCommitments(campaign.id, 90); // Above threshold

    // 3. Wait for deadline (simulate)
    await db.update(campaigns)
      .set({ aggregationDeadline: pastDate() })
      .where(eq(campaigns.id, campaign.id));

    // 4. Run background job
    await campaignLifecycleJob.processExpiredCampaigns();

    let updated = await storage.getCampaign(campaign.id);
    expect(updated.state).toBe("PROCUREMENT");

    // 5. Admin starts fulfillment
    await adminAction(campaign.id, "START_FULFILLMENT");
    updated = await storage.getCampaign(campaign.id);
    expect(updated.state).toBe("FULFILLMENT");

    // 6. Admin marks complete
    await adminAction(campaign.id, "MARK_COMPLETED");
    updated = await storage.getCampaign(campaign.id);
    expect(updated.state).toBe("COMPLETED");

    // Verify audit trail
    const logs = await storage.getAdminActionLogs(campaign.id);
    expect(logs.map(l => l.newState)).toEqual([
      "SUCCESS",
      "PROCUREMENT",
      "FULFILLMENT",
      "COMPLETED",
    ]);
  });

  test("failure path: AGGREGATION → FAILED with refunds", async () => {
    const campaign = await createCampaign({
      state: "AGGREGATION",
      targetUnits: 100,
      aggregationDeadline: pastDate(),
    });
    const commitmentIds = await createCommitments(campaign.id, 50); // Below target

    await campaignLifecycleJob.processExpiredCampaigns();

    const updated = await storage.getCampaign(campaign.id);
    expect(updated.state).toBe("FAILED");

    // Verify all refunds processed
    for (const id of commitmentIds) {
      const commitment = await storage.getCommitment(id);
      expect(commitment.status).toBe("REFUNDED");
    }
  });
});
```

### Manual Testing Checklist

- [ ] Create campaign with minThresholdUnits = 80, targetUnits = 100
- [ ] Add 85 commitments (above threshold, below target)
- [ ] Set deadline to past
- [ ] Wait for background job (2 min max)
- [ ] Verify auto-transition to PROCUREMENT
- [ ] Verify audit logs show SYSTEM_DEADLINE_AUTOMATION actor
- [ ] Admin manually transitions PROCUREMENT → FULFILLMENT
- [ ] Admin manually transitions FULFILLMENT → COMPLETED
- [ ] Verify full audit trail captured

- [ ] Create campaign with targetUnits = 100, no minThresholdUnits
- [ ] Add 50 commitments (below target)
- [ ] Set deadline to past
- [ ] Wait for background job
- [ ] Verify auto-transition to FAILED
- [ ] Verify all commitments show REFUNDED status
- [ ] Verify escrow entries show REFUND type with SYSTEM_REFUND_AUTOMATION actor

- [ ] Verify participant sees correct status messages for each state
- [ ] Verify admin can manually fail campaign from any non-terminal state
- [ ] Verify manual fail triggers auto-refunds
- [ ] Background job survives server restart (restart server, verify job resumes)
- [ ] Processing lock prevents duplicate processing (simulate by setting past deadline on many campaigns)

---

## 11. Implementation Sequence

### Phase 1: Foundation (Schema + Core Logic)
**Estimated: 2-3 hours**

1. Create migration file: `migrations/2026-01-28-campaign-lifecycle-completion.sql`
2. Update `shared/schema.ts`:
   - Add PROCUREMENT, COMPLETED to campaignStateEnum
   - Add minThresholdUnits, processingLock fields
   - Update VALID_TRANSITIONS map
   - Add refundAlerts table
3. Run migration: `npm run db:push`
4. Verify schema in dev database

### Phase 2: Background Job (Automation Core)
**Estimated: 3-4 hours**

1. Create `server/jobs/campaign-lifecycle.ts`
2. Implement CampaignLifecycleJob class:
   - processExpiredCampaigns() method
   - processSingleCampaign() method
   - acquireProcessingLock() / releaseProcessingLock()
   - processAutoRefunds() method
3. Add job initialization to `server/index.ts`
4. Test locally: create test campaign with past deadline, verify processing

### Phase 3: Backend API Updates
**Estimated: 2-3 hours**

1. Update `server/routes.ts`:
   - Add START_PROCUREMENT, MARK_COMPLETED action codes
   - Update state transition validation to use VALID_TRANSITIONS
   - Update MARK_FUNDED to auto-chain to PROCUREMENT
   - Update FAIL_CAMPAIGN to trigger auto-refunds
2. Add `/api/admin/refund-alerts` endpoint
3. Update storage.ts helpers if needed:
   - createRefundAlert()
   - getRefundAlerts()
4. Test all admin actions via API

### Phase 4: Admin UI
**Estimated: 3-4 hours**

1. Update `client/src/pages/admin/campaign-detail.tsx`:
   - Add minThresholdUnits field to Prerequisites section
   - Update state badge component (add PROCUREMENT, COMPLETED)
   - Update action buttons for new states
   - Add help text for admin-only threshold field
2. Update `client/src/pages/admin/campaigns.tsx`:
   - Add PROCUREMENT, COMPLETED to state filters
   - Update state labels throughout
3. Create `client/src/pages/admin/alerts.tsx`:
   - Refund alerts dashboard
   - Retry/resolve actions
4. Test all admin flows manually

### Phase 5: Participant UI
**Estimated: 2 hours**

1. Update `client/src/pages/campaign.tsx`:
   - Add status messages for new states
   - Update CampaignStatusBanner component
2. Update `client/src/pages/account/index.tsx`:
   - Update commitment cards to show new states
   - Update state labels in dashboard
3. Update `client/src/pages/commitment-wizard.tsx`:
   - Add validation to prevent commits after deadline
4. Test participant experience for all states

### Phase 6: Testing & Validation
**Estimated: 3-4 hours**

1. Write unit tests (see Section 10)
2. Write integration tests
3. Manual testing checklist (see Section 10)
4. Test on staging environment
5. Monitor background job logs for errors
6. Verify audit logs capture all transitions

### Phase 7: Documentation & Deployment
**Estimated: 1 hour**

1. Update CLAUDE.md with new states
2. Document minThresholdUnits field usage
3. Create deployment runbook
4. Deploy to staging
5. Run smoke tests
6. Deploy to production
7. Monitor for 24 hours

**Total Estimated Time: 16-21 hours**

---

## 12. Success Criteria

### Functional Requirements
- ✅ Campaign state machine matches PRD exactly
- ✅ Deadline automation processes campaigns within 2 minutes of expiration
- ✅ Threshold evaluation uses minThresholdUnits (or targetUnits fallback)
- ✅ Auto-refunds process all LOCKED commitments on FAILED transition
- ✅ All state transitions logged to adminActionLogs
- ✅ Admin can manually override at each state
- ✅ Participants see correct status messages for each state
- ✅ minThresholdUnits field is admin-only (never exposed to participants)

### Non-Functional Requirements
- ✅ Background job handles 100+ concurrent campaigns without performance issues
- ✅ Processing locks prevent duplicate processing across multiple server instances
- ✅ Partial refund failures don't block entire batch
- ✅ Job survives server restarts (resumes automatically)
- ✅ All operations are idempotent (safe to retry)
- ✅ Audit logs provide complete traceability for manual recovery

### Trust Alignment (PRD Phase 0-1)
- ✅ No silent transitions ("no silent transitions ever" - PRD 4.4)
- ✅ Refunds issued automatically on failure (PRD 4.5)
- ✅ All money flows explicit and logged (PRD 2.3)
- ✅ Competitive safety: no economics exposed (PRD 8)
- ✅ Admin power exists to protect trust (PRD 5.5)

---

## 13. Risks & Mitigations

### Risk: Background Job Performance at Scale
**Impact:** Job takes >2min to process many campaigns, delays increase

**Mitigation:**
- Batch processing with configurable limits (e.g., 50 campaigns per run)
- Add monitoring/alerting for job duration
- Scale horizontally if needed (multiple workers with locks)

### Risk: Database Lock Contention
**Impact:** Processing locks block legitimate admin actions

**Mitigation:**
- Lock timeout set to 10 minutes (stale lock prevention)
- Admin actions acquire locks with timeout, show clear error if locked
- Monitor lock acquisition failures

### Risk: Refund Processing Failures
**Impact:** Users don't receive refunds, trust erosion

**Mitigation:**
- Alert dashboard for failed refunds (requires manual intervention)
- Each refund failure logged individually (no silent failures)
- Admin can retry refunds manually from alert dashboard
- Phase 0 stop condition: "Refunds fail or delay" (PRD 4.8)

### Risk: State Transition Race Conditions
**Impact:** Invalid state transitions, data inconsistency

**Mitigation:**
- Database-level constraints enforce VALID_TRANSITIONS
- Row-level locks prevent concurrent updates
- All transitions atomic (transaction-wrapped)

### Risk: Background Job Crash/Hang
**Impact:** Campaigns stuck in wrong state indefinitely

**Mitigation:**
- Job is stateless (always queries fresh data)
- PM2 auto-restart on crash
- Manual admin override always available
- Monitoring/alerting for job health

---

## 14. Monitoring & Observability

### Metrics to Track
- Campaign state distribution (count by state)
- Deadline processing latency (time from deadline to transition)
- Refund success rate (successful / total refunds attempted)
- Background job execution time
- Processing lock acquisition failures
- Failed refund alert count (unresolved)

### Logging Standards
```typescript
// All state transitions
console.log(`[LIFECYCLE] Campaign ${campaignId} transitioned ${prevState} → ${newState} (actor: ${actor})`);

// Refund processing
console.log(`[REFUND] Processing ${count} refunds for campaign ${campaignId}`);
console.log(`[REFUND] Completed refund for commitment ${referenceNumber}`);
console.error(`[REFUND] Failed refund for ${referenceNumber}:`, error);

// Background job
console.log(`[LIFECYCLE] Background job started (interval: 2min)`);
console.log(`[LIFECYCLE] Processing ${count} expired campaigns`);
console.log(`[LIFECYCLE] Completed processing ${count} campaigns in ${duration}ms`);
```

### Admin Dashboard Indicators
- System health status (background job running)
- Failed refund alerts (count, list)
- Recent state transitions (audit log view)
- Campaigns awaiting action (by state)

---

## 15. PRD Alignment Verification

| PRD Requirement | Implementation | Status |
|-----------------|----------------|--------|
| State machine: DESIGN → AGGREGATION → SUCCESS → PROCUREMENT → FULFILLMENT → COMPLETED | DRAFT/PUBLISHED handles DESIGN, full state chain implemented | ✅ |
| "No Silent Transitions. Ever." (4.4) | Background automation + audit logging | ✅ |
| "Refunds issued automatically on failure" (4.5) | Auto-refund on FAILED transition | ✅ |
| "All transitions logged" (4.4) | adminActionLogs captures all, including system actor | ✅ |
| "All outcomes auditable" (4.4) | Audit logs + escrow ledger provide full trail | ✅ |
| Admin authority to protect trust (5.5) | Manual overrides at each state + fail campaign action | ✅ |
| No economics exposure (8) | minThresholdUnits admin-only, never shown to participants | ✅ |
| Phase 0 stop condition: refund failures (4.8) | Alert dashboard + manual intervention system | ✅ |

---

**End of Design Document**

This design completes the campaign lifecycle system with PRD-aligned states, deadline automation, automatic refunds, and full audit traceability. Implementation follows a phased approach with comprehensive testing and error handling to ensure "no silent transitions" and trust preservation.
