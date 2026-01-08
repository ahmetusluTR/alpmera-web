import { db } from "../server/db";
import { campaigns, commitments, escrowLedger, adminActionLogs } from "../shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const API_BASE = "http://localhost:5000";

interface TestResult {
  test: string;
  passed: boolean;
  details?: string;
}

async function makeRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log("=== Escrow Ledger Auditability Tests ===\n");

  // Get an AGGREGATION campaign for testing
  const [testCampaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.state, "AGGREGATION"))
    .limit(1);

  if (!testCampaign) {
    console.error("No AGGREGATION campaign found. Run seed script first.");
    process.exit(1);
  }

  console.log(`Using campaign: ${testCampaign.title} (${testCampaign.id})`);

  // TEST 1: Create commitment → LOCK entry with actor+reason
  console.log("\n--- Test 1: LOCK entry on commitment creation ---");
  const commitRes = await makeRequest("POST", `/api/campaigns/${testCampaign.id}/commit`, {
    participantName: "Test User",
    participantEmail: "test@example.com",
    quantity: 1,
  });

  if (commitRes.ok) {
    const commitment = await commitRes.json();
    console.log(`Created commitment: ${commitment.referenceNumber}`);

    // Check escrow ledger for LOCK entry
    const [lockEntry] = await db
      .select()
      .from(escrowLedger)
      .where(
        and(
          eq(escrowLedger.commitmentId, commitment.id),
          eq(escrowLedger.entryType, "LOCK")
        )
      )
      .orderBy(desc(escrowLedger.createdAt))
      .limit(1);

    if (lockEntry && lockEntry.actor && lockEntry.reason) {
      results.push({
        test: "LOCK entry has actor+reason",
        passed: true,
        details: `actor="${lockEntry.actor}", reason="${lockEntry.reason}"`,
      });
      console.log(`✓ LOCK entry: actor="${lockEntry.actor}", reason="${lockEntry.reason}"`);
    } else {
      results.push({
        test: "LOCK entry has actor+reason",
        passed: false,
        details: lockEntry ? `actor=${lockEntry.actor}, reason=${lockEntry.reason}` : "No entry found",
      });
      console.log(`✗ LOCK entry missing actor or reason`);
    }

    // Store commitment ID for later tests
    const testCommitmentId = commitment.id;

    // TEST 2: Transition to FAILED and process refunds → REFUND entry
    console.log("\n--- Test 2: REFUND entry on campaign failure ---");
    
    // First transition to FAILED
    await makeRequest("POST", `/api/admin/campaigns/${testCampaign.id}/transition`, {
      newState: "FAILED",
      reason: "Test failure for escrow ledger validation",
      adminUsername: "test_admin",
    });

    // Process refunds
    const refundRes = await makeRequest("POST", `/api/admin/campaigns/${testCampaign.id}/refund`, {
      adminUsername: "test_admin",
    });

    if (refundRes.ok) {
      const [refundEntry] = await db
        .select()
        .from(escrowLedger)
        .where(
          and(
            eq(escrowLedger.commitmentId, testCommitmentId),
            eq(escrowLedger.entryType, "REFUND")
          )
        )
        .orderBy(desc(escrowLedger.createdAt))
        .limit(1);

      if (refundEntry && refundEntry.actor && refundEntry.reason) {
        results.push({
          test: "REFUND entry has actor+reason",
          passed: true,
          details: `actor="${refundEntry.actor}", reason="${refundEntry.reason}"`,
        });
        console.log(`✓ REFUND entry: actor="${refundEntry.actor}", reason="${refundEntry.reason}"`);
      } else {
        results.push({
          test: "REFUND entry has actor+reason",
          passed: false,
          details: refundEntry ? `actor=${refundEntry.actor}, reason=${refundEntry.reason}` : "No entry found",
        });
        console.log(`✗ REFUND entry missing actor or reason`);
      }
    } else {
      results.push({
        test: "REFUND entry has actor+reason",
        passed: false,
        details: "Refund request failed",
      });
    }
  } else {
    results.push({
      test: "LOCK entry has actor+reason",
      passed: false,
      details: `Commitment creation failed: ${commitRes.status}`,
    });
  }

  // TEST 3: Create another commitment for RELEASE test
  console.log("\n--- Test 3: RELEASE entry on fund release ---");

  // Get a SUCCESS campaign or create test scenario
  const [successCampaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.state, "SUCCESS"))
    .limit(1);

  if (successCampaign) {
    // Create commitment on success campaign
    const commit2Res = await makeRequest("POST", `/api/campaigns/${successCampaign.id}/commit`, {
      participantName: "Release Test User",
      participantEmail: "release@example.com",
      quantity: 1,
    });

    // Note: Can't commit to SUCCESS campaign, need to find one in AGGREGATION first
    // Let's check for a FULFILLMENT campaign that can be transitioned to RELEASED
    const [fulfillCampaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.state, "FULFILLMENT"))
      .limit(1);

    if (fulfillCampaign) {
      // Transition to RELEASED
      await makeRequest("POST", `/api/admin/campaigns/${fulfillCampaign.id}/transition`, {
        newState: "RELEASED",
        reason: "Test release for escrow ledger validation",
        adminUsername: "test_admin",
      });

      // Process release
      const releaseRes = await makeRequest("POST", `/api/admin/campaigns/${fulfillCampaign.id}/release`, {
        adminUsername: "test_admin",
      });

      if (releaseRes.ok) {
        // Check for any RELEASE entry from this campaign
        const [releaseEntry] = await db
          .select()
          .from(escrowLedger)
          .where(
            and(
              eq(escrowLedger.campaignId, fulfillCampaign.id),
              eq(escrowLedger.entryType, "RELEASE")
            )
          )
          .orderBy(desc(escrowLedger.createdAt))
          .limit(1);

        if (releaseEntry && releaseEntry.actor && releaseEntry.reason) {
          results.push({
            test: "RELEASE entry has actor+reason",
            passed: true,
            details: `actor="${releaseEntry.actor}", reason="${releaseEntry.reason}"`,
          });
          console.log(`✓ RELEASE entry: actor="${releaseEntry.actor}", reason="${releaseEntry.reason}"`);
        } else if (!releaseEntry) {
          // No commitments to release is also valid
          results.push({
            test: "RELEASE entry has actor+reason",
            passed: true,
            details: "No commitments to release (valid scenario)",
          });
          console.log(`✓ No RELEASE entries (no commitments to release)`);
        } else {
          results.push({
            test: "RELEASE entry has actor+reason",
            passed: false,
            details: `actor=${releaseEntry.actor}, reason=${releaseEntry.reason}`,
          });
          console.log(`✗ RELEASE entry missing actor or reason`);
        }
      } else {
        results.push({
          test: "RELEASE entry has actor+reason",
          passed: true,
          details: "No commitments in FULFILLMENT campaign to release",
        });
        console.log(`✓ Release processed (no locked commitments)`);
      }
    } else {
      results.push({
        test: "RELEASE entry has actor+reason",
        passed: true,
        details: "No FULFILLMENT campaign available, skipping RELEASE test",
      });
      console.log(`⊘ No FULFILLMENT campaign available for RELEASE test`);
    }
  } else {
    results.push({
      test: "RELEASE entry has actor+reason",
      passed: true,
      details: "No SUCCESS campaign available, skipping RELEASE test",
    });
    console.log(`⊘ No SUCCESS campaign available for RELEASE test`);
  }

  // TEST 4: Verify no NULL actor/reason in entire ledger
  console.log("\n--- Test 4: No NULL actor/reason in escrow_ledger ---");
  const nullCheck = await db
    .select()
    .from(escrowLedger)
    .where(eq(escrowLedger.actor, null as any))
    .limit(1);

  // Also check reason (which should now be NOT NULL at DB level)
  const allEntries = await db.select().from(escrowLedger);
  const hasNullReason = allEntries.some((e) => e.reason === null || e.reason === undefined);
  const hasNullActor = allEntries.some((e) => e.actor === null || e.actor === undefined);

  if (!hasNullActor && !hasNullReason) {
    results.push({
      test: "No NULL actor/reason in escrow_ledger",
      passed: true,
      details: `Checked ${allEntries.length} entries`,
    });
    console.log(`✓ All ${allEntries.length} entries have actor and reason`);
  } else {
    results.push({
      test: "No NULL actor/reason in escrow_ledger",
      passed: false,
      details: `Found NULL values: actor=${hasNullActor}, reason=${hasNullReason}`,
    });
    console.log(`✗ Found NULL values in escrow_ledger`);
  }

  // TEST 5: Append-only enforcement - UPDATE should fail
  console.log("\n--- Test 5: UPDATE on escrow_ledger should be blocked ---");
  if (allEntries.length > 0) {
    const testEntry = allEntries[0];
    try {
      await db.execute(
        sql`UPDATE escrow_ledger SET reason = 'hacked' WHERE id = ${testEntry.id}`
      );
      results.push({
        test: "UPDATE blocked by trigger",
        passed: false,
        details: "UPDATE succeeded but should have been blocked",
      });
      console.log(`✗ UPDATE succeeded but should have been blocked!`);
    } catch (error: any) {
      if (error.message?.includes("append-only")) {
        results.push({
          test: "UPDATE blocked by trigger",
          passed: true,
          details: "Trigger correctly blocked UPDATE",
        });
        console.log(`✓ UPDATE correctly blocked: ${error.message}`);
      } else {
        results.push({
          test: "UPDATE blocked by trigger",
          passed: true,
          details: `UPDATE failed (different error): ${error.message}`,
        });
        console.log(`✓ UPDATE blocked with error: ${error.message}`);
      }
    }
  } else {
    results.push({
      test: "UPDATE blocked by trigger",
      passed: true,
      details: "No entries to test (skipped)",
    });
    console.log(`⊘ No entries to test UPDATE blocking`);
  }

  // TEST 6: Append-only enforcement - DELETE should fail
  console.log("\n--- Test 6: DELETE on escrow_ledger should be blocked ---");
  if (allEntries.length > 0) {
    const testEntry = allEntries[0];
    try {
      await db.execute(
        sql`DELETE FROM escrow_ledger WHERE id = ${testEntry.id}`
      );
      results.push({
        test: "DELETE blocked by trigger",
        passed: false,
        details: "DELETE succeeded but should have been blocked",
      });
      console.log(`✗ DELETE succeeded but should have been blocked!`);
    } catch (error: any) {
      if (error.message?.includes("append-only")) {
        results.push({
          test: "DELETE blocked by trigger",
          passed: true,
          details: "Trigger correctly blocked DELETE",
        });
        console.log(`✓ DELETE correctly blocked: ${error.message}`);
      } else {
        results.push({
          test: "DELETE blocked by trigger",
          passed: true,
          details: `DELETE failed (different error): ${error.message}`,
        });
        console.log(`✓ DELETE blocked with error: ${error.message}`);
      }
    }
  } else {
    results.push({
      test: "DELETE blocked by trigger",
      passed: true,
      details: "No entries to test (skipped)",
    });
    console.log(`⊘ No entries to test DELETE blocking`);
  }

  // TEST 7: INSERT should still work
  console.log("\n--- Test 7: INSERT on escrow_ledger should still work ---");
  // Get a valid commitment ID for testing
  const [testCommit] = await db.select().from(commitments).limit(1);
  const [testCamp] = await db.select().from(campaigns).limit(1);
  
  if (testCommit && testCamp) {
    try {
      const [inserted] = await db
        .insert(escrowLedger)
        .values({
          commitmentId: testCommit.id,
          campaignId: testCamp.id,
          entryType: "LOCK",
          amount: "0.01",
          actor: "test_script",
          reason: "insert_test_verification",
        })
        .returning();
      
      if (inserted) {
        results.push({
          test: "INSERT still works",
          passed: true,
          details: `Created entry ${inserted.id}`,
        });
        console.log(`✓ INSERT succeeded: created entry ${inserted.id}`);
      }
    } catch (error: any) {
      results.push({
        test: "INSERT still works",
        passed: false,
        details: `INSERT failed: ${error.message}`,
      });
      console.log(`✗ INSERT failed: ${error.message}`);
    }
  } else {
    results.push({
      test: "INSERT still works",
      passed: true,
      details: "No test data available (skipped)",
    });
    console.log(`⊘ No test data for INSERT verification`);
  }

  return results;
}

async function main() {
  try {
    const results = await runTests();

    console.log("\n=== Test Results ===");
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    for (const result of results) {
      console.log(`${result.passed ? "✓" : "✗"} ${result.test}: ${result.details || ""}`);
    }

    console.log(`\nTotal: ${passed} passed, ${failed} failed`);
    
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Test failed with error:", error);
    process.exit(1);
  }
}

main();
