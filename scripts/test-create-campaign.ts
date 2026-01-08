/**
 * Test script for Admin Create Campaign endpoint
 * 
 * SECURITY: Admin endpoints require ADMIN_API_KEY to be set
 * 
 * Tests:
 * 1. POST /api/admin/campaigns without auth → MUST fail (401 or 503)
 * 2. POST /api/admin/campaigns with wrong key → MUST fail (401)
 * 3. POST /api/admin/campaigns with correct key → succeeds
 * 4. Created campaign is in AGGREGATION state
 * 5. admin_action_logs has CAMPAIGN_CREATE record
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
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const adminApiKey = process.env.ADMIN_API_KEY;

  console.log("=== Create Campaign Endpoint Tests ===\n");

  if (!adminApiKey) {
    console.log("ERROR: ADMIN_API_KEY not set in environment");
    console.log("Run with: ADMIN_API_KEY=your-key npx tsx scripts/test-create-campaign.ts\n");
    process.exit(1);
  }

  console.log(`Using ADMIN_API_KEY: ${adminApiKey.substring(0, 4)}...`);

  // TEST 1: Without auth header - MUST FAIL
  console.log("\n--- Test 1: POST without auth header (MUST FAIL) ---");
  const noAuthRes = await makeRequest("POST", "/api/admin/campaigns", {
    adminUsername: "test_admin",
    title: testCampaignTitle,
    rules: "Test rules for campaign",
    targetAmount: "10000",
    unitPrice: "99.99",
    aggregationDeadline: futureDate,
  });
  
  const noAuthStatus = noAuthRes.status;
  console.log(`Response status: ${noAuthStatus}`);
  
  // MUST be 401 (missing header) or 503 (key not configured on server)
  const noAuthPassed = noAuthStatus === 401 || noAuthStatus === 503;
  results.push({
    test: "Create campaign without auth header REJECTED",
    passed: noAuthPassed,
    details: noAuthPassed 
      ? `Correctly rejected with ${noAuthStatus}` 
      : `SECURITY FAILURE: Got ${noAuthStatus} instead of 401/503`,
  });

  // TEST 2: With wrong auth key - MUST FAIL
  console.log("\n--- Test 2: POST with wrong auth key (MUST FAIL) ---");
  const wrongAuthRes = await makeRequest("POST", "/api/admin/campaigns", {
    adminUsername: "test_admin",
    title: testCampaignTitle + " - Wrong Key",
    rules: "Test rules",
    targetAmount: "10000",
    unitPrice: "99.99",
    aggregationDeadline: futureDate,
  }, { "x-admin-auth": "wrong-key-12345" });
  
  const wrongAuthStatus = wrongAuthRes.status;
  console.log(`Response status: ${wrongAuthStatus}`);
  
  const wrongAuthPassed = wrongAuthStatus === 401;
  results.push({
    test: "Create campaign with wrong key REJECTED",
    passed: wrongAuthPassed,
    details: wrongAuthPassed 
      ? "Correctly rejected with 401" 
      : `SECURITY FAILURE: Got ${wrongAuthStatus} instead of 401`,
  });

  // TEST 3: With correct auth key - MUST SUCCEED
  console.log("\n--- Test 3: POST with correct auth key (MUST SUCCEED) ---");
  const withAuthRes = await makeRequest("POST", "/api/admin/campaigns", {
    adminUsername: "test_admin",
    title: testCampaignTitle + " - Auth Test",
    description: "Campaign created for testing purposes",
    rules: "1. This is a test campaign\n2. All rules apply\n3. Funds will be locked",
    targetAmount: "5000",
    unitPrice: "49.99",
    aggregationDeadline: futureDate,
  }, { "x-admin-auth": adminApiKey });
  
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
    test: "Create campaign with correct auth SUCCEEDS",
    passed: withAuthPassed,
    details: withAuthPassed 
      ? `Campaign created: ${createdCampaignId}` 
      : `Failed with status: ${withAuthStatus}`,
  });

  // TEST 4: Verify campaign is in AGGREGATION state
  console.log("\n--- Test 4: Verify AGGREGATION state ---");
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

  // TEST 5: Verify admin_action_logs has CAMPAIGN_CREATE record
  console.log("\n--- Test 5: Verify admin_action_logs entry ---");
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
        ? `Log entry: action=${logEntry.action}, newState=${logEntry.newState}` 
        : `Missing or incorrect log entry`,
    });
    console.log(`Log found: ${logCorrect}`);
  } else {
    results.push({
      test: "Admin action log has CAMPAIGN_CREATE entry",
      passed: false,
      details: "No campaign was created to verify log",
    });
  }

  // TEST 6: Verify validation - missing required fields
  console.log("\n--- Test 6: Validation - missing title ---");
  const missingTitleRes = await makeRequest("POST", "/api/admin/campaigns", {
    adminUsername: "test_admin",
    rules: "Test rules",
    targetAmount: "10000",
    unitPrice: "99.99",
    aggregationDeadline: futureDate,
  }, { "x-admin-auth": adminApiKey });
  
  const missingTitlePassed = missingTitleRes.status === 400;
  results.push({
    test: "Validation rejects missing title",
    passed: missingTitlePassed,
    details: missingTitlePassed 
      ? "Correctly returned 400 for missing title" 
      : `Unexpected status: ${missingTitleRes.status}`,
  });
  console.log(`Missing title validation: ${missingTitleRes.status}`);

  return results;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     Create Campaign Endpoint Test Suite (STRICT AUTH)       ║");
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
