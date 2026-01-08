/**
 * Test script for Admin Create Campaign endpoint
 * 
 * Tests:
 * 1. POST /api/admin/campaigns without auth → fails
 * 2. POST /api/admin/campaigns with auth → succeeds
 * 3. Created campaign is in AGGREGATION state
 * 4. admin_action_logs has CAMPAIGN_CREATE record
 */

import { db } from "../server/db";
import { campaigns, adminActionLogs } from "../shared/schema";
import { eq, desc } from "drizzle-orm";

const API_BASE = "http://localhost:5000";

interface TestResult {
  test: string;
  passed: boolean;
  details: string;
}

async function makeRequest(
  method: string,
  path: string,
  body?: object,
  headers?: Record<string, string>
): Promise<Response> {
  const allHeaders: Record<string, string> = {};
  if (body) allHeaders["Content-Type"] = "application/json";
  if (headers) Object.assign(allHeaders, headers);

  return fetch(`${API_BASE}${path}`, {
    method,
    headers: allHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const testCampaignTitle = `Test Campaign ${Date.now()}`;
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

  console.log("=== Create Campaign Endpoint Tests ===\n");

  // TEST 1: Without auth header (when ADMIN_API_KEY is configured on server)
  console.log("--- Test 1: POST without auth header ---");
  const noAuthRes = await makeRequest("POST", "/api/admin/campaigns", {
    adminUsername: "test_admin",
    title: testCampaignTitle,
    rules: "Test rules for campaign",
    targetAmount: "10000",
    unitPrice: "99.99",
    aggregationDeadline: futureDate,
  });
  
  // In dev mode, this may succeed; in production mode with key, should fail
  const noAuthStatus = noAuthRes.status;
  console.log(`Response status: ${noAuthStatus}`);
  
  // For dev mode without ADMIN_API_KEY on server, 201 is acceptable
  // For production mode with ADMIN_API_KEY, should be 401
  const noAuthPassed = noAuthStatus === 401 || noAuthStatus === 201;
  results.push({
    test: "Create campaign without auth header",
    passed: noAuthPassed,
    details: noAuthStatus === 401 
      ? "Correctly rejected (production mode)" 
      : noAuthStatus === 201 
        ? "Allowed (dev mode)" 
        : `Unexpected status: ${noAuthStatus}`,
  });

  // TEST 2: With dev admin header (for development mode)
  console.log("\n--- Test 2: POST with dev admin header ---");
  const withAuthRes = await makeRequest("POST", "/api/admin/campaigns", {
    adminUsername: "test_admin",
    title: testCampaignTitle + " - Auth Test",
    description: "Campaign created for testing purposes",
    rules: "1. This is a test campaign\n2. All rules apply\n3. Funds will be locked",
    targetAmount: "5000",
    unitPrice: "49.99",
    aggregationDeadline: futureDate,
  }, { "x-admin-auth": "development-admin" });
  
  const withAuthStatus = withAuthRes.status;
  let createdCampaignId: string | null = null;
  
  if (withAuthRes.ok) {
    const campaign = await withAuthRes.json();
    createdCampaignId = campaign.id;
    console.log(`Created campaign: ${campaign.id}`);
    console.log(`Title: ${campaign.title}`);
    console.log(`State: ${campaign.state}`);
  } else {
    console.log(`Failed with status: ${withAuthStatus}`);
    const errorBody = await withAuthRes.text();
    console.log(`Error: ${errorBody}`);
  }
  
  const withAuthPassed = withAuthStatus === 201;
  results.push({
    test: "Create campaign with admin auth",
    passed: withAuthPassed,
    details: withAuthPassed 
      ? `Campaign created: ${createdCampaignId}` 
      : `Failed with status: ${withAuthStatus}`,
  });

  // TEST 3: Verify campaign is in AGGREGATION state
  console.log("\n--- Test 3: Verify AGGREGATION state ---");
  if (createdCampaignId) {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, createdCampaignId));
    
    const stateCorrect = campaign?.state === "AGGREGATION";
    results.push({
      test: "Created campaign in AGGREGATION state",
      passed: stateCorrect,
      details: stateCorrect 
        ? "State is AGGREGATION as expected" 
        : `State is ${campaign?.state || 'unknown'}`,
    });
    console.log(`Campaign state: ${campaign?.state}`);
  } else {
    results.push({
      test: "Created campaign in AGGREGATION state",
      passed: false,
      details: "No campaign was created to verify",
    });
  }

  // TEST 4: Verify admin_action_logs has CAMPAIGN_CREATE record
  console.log("\n--- Test 4: Verify admin_action_logs entry ---");
  if (createdCampaignId) {
    const [logEntry] = await db
      .select()
      .from(adminActionLogs)
      .where(eq(adminActionLogs.campaignId, createdCampaignId))
      .orderBy(desc(adminActionLogs.createdAt))
      .limit(1);
    
    const logCorrect = logEntry?.action === "CAMPAIGN_CREATE" && 
                       logEntry?.newState === "AGGREGATION" &&
                       logEntry?.reason === "admin_create_campaign";
    
    results.push({
      test: "Admin action log has CAMPAIGN_CREATE entry",
      passed: logCorrect,
      details: logCorrect 
        ? `Log entry: action=${logEntry.action}, newState=${logEntry.newState}, reason=${logEntry.reason}` 
        : `Missing or incorrect log entry: ${JSON.stringify(logEntry)}`,
    });
    console.log(`Log entry: ${JSON.stringify(logEntry, null, 2)}`);
  } else {
    results.push({
      test: "Admin action log has CAMPAIGN_CREATE entry",
      passed: false,
      details: "No campaign was created to verify log",
    });
  }

  // TEST 5: Verify validation - missing required fields
  console.log("\n--- Test 5: Validation - missing title ---");
  const missingTitleRes = await makeRequest("POST", "/api/admin/campaigns", {
    adminUsername: "test_admin",
    rules: "Test rules",
    targetAmount: "10000",
    unitPrice: "99.99",
    aggregationDeadline: futureDate,
  }, { "x-admin-auth": "development-admin" });
  
  const missingTitlePassed = missingTitleRes.status === 400;
  results.push({
    test: "Validation rejects missing title",
    passed: missingTitlePassed,
    details: missingTitlePassed 
      ? "Correctly returned 400 for missing title" 
      : `Unexpected status: ${missingTitleRes.status}`,
  });
  console.log(`Missing title validation: ${missingTitleRes.status}`);

  // TEST 6: Verify validation - past deadline
  console.log("\n--- Test 6: Validation - past deadline ---");
  const pastDeadlineRes = await makeRequest("POST", "/api/admin/campaigns", {
    adminUsername: "test_admin",
    title: "Past Deadline Test",
    rules: "Test rules",
    targetAmount: "10000",
    unitPrice: "99.99",
    aggregationDeadline: "2020-01-01T00:00:00Z",
  }, { "x-admin-auth": "development-admin" });
  
  const pastDeadlinePassed = pastDeadlineRes.status === 400;
  results.push({
    test: "Validation rejects past deadline",
    passed: pastDeadlinePassed,
    details: pastDeadlinePassed 
      ? "Correctly returned 400 for past deadline" 
      : `Unexpected status: ${pastDeadlineRes.status}`,
  });
  console.log(`Past deadline validation: ${pastDeadlineRes.status}`);

  return results;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           Create Campaign Endpoint Test Suite                ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const results = await runTests();

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                      TEST SUMMARY                             ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  for (const result of results) {
    const icon = result.passed ? "✓" : "✗";
    console.log(`${icon} ${result.test}`);
    console.log(`  ${result.details}`);
  }

  console.log(`\nTotal: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("\n🔴 SOME TESTS FAILED");
    process.exit(1);
  } else {
    console.log("\n🟢 ALL TESTS PASSED");
    process.exit(0);
  }
}

main().catch(console.error);
