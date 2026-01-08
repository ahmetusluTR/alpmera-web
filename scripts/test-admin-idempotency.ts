import { randomUUID } from "crypto";

const BASE_URL = "http://localhost:5000";
const ADMIN_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_KEY) {
  console.error("ADMIN_API_KEY not set");
  process.exit(1);
}

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

async function adminRequest(method: string, path: string, body?: object, headers?: Record<string, string>) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-admin-auth": ADMIN_KEY!,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response;
}

async function createTestCampaign(title: string): Promise<string> {
  const resp = await adminRequest("POST", "/api/admin/campaigns", {
    adminUsername: "test-admin",
    title,
    description: "Test campaign for idempotency testing",
    rules: "Test rules",
    targetAmount: "1000",
    unitPrice: "50",
    minCommitment: "50",
    aggregationDeadline: new Date(Date.now() + 86400000).toISOString(),
  });
  const campaign = await resp.json();
  return campaign.id;
}

async function createCommitment(campaignId: string): Promise<string> {
  const idemKey = randomUUID();
  const resp = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/commit`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-idempotency-key": idemKey,
    },
    body: JSON.stringify({
      participantName: "Test User",
      participantEmail: "test@example.com",
      quantity: 1,
    }),
  });
  const commitment = await resp.json();
  return commitment.id;
}

async function testRefundIdempotency() {
  console.log("\n=== Test: Refund Idempotency ===");
  
  const campaignId = await createTestCampaign("Refund Idempotency Test " + Date.now());
  await createCommitment(campaignId);
  
  await adminRequest("POST", `/api/admin/campaigns/${campaignId}/transition`, {
    newState: "FAILED",
    reason: "Test failed state",
    adminUsername: "test-admin",
  });
  
  const idempotencyKey = randomUUID();
  
  const resp1 = await adminRequest("POST", `/api/admin/campaigns/${campaignId}/refund`, {
    adminUsername: "test-admin",
  }, { "x-idempotency-key": idempotencyKey });
  const data1 = await resp1.json();
  console.log("First refund request:", resp1.status, data1._idempotent ? "(idempotent)" : "(fresh)");
  
  const resp2 = await adminRequest("POST", `/api/admin/campaigns/${campaignId}/refund`, {
    adminUsername: "test-admin",
  }, { "x-idempotency-key": idempotencyKey });
  const data2 = await resp2.json();
  console.log("Second refund request:", resp2.status, data2._idempotent ? "(idempotent)" : "(fresh)");
  
  const passed = 
    resp1.status === 200 &&
    resp2.status === 200 &&
    data1._idempotent !== true &&
    data2._idempotent === true;
  
  results.push({
    name: "Refund Idempotency",
    passed,
    details: `First: ${resp1.status} (idempotent=${data1._idempotent}), Second: ${resp2.status} (idempotent=${data2._idempotent})`,
  });
  
  console.log(passed ? "PASSED" : "FAILED");
}

async function testReleaseIdempotency() {
  console.log("\n=== Test: Release Idempotency ===");
  
  const campaignId = await createTestCampaign("Release Idempotency Test " + Date.now());
  await createCommitment(campaignId);
  
  await adminRequest("POST", `/api/admin/campaigns/${campaignId}/transition`, {
    newState: "SUCCESS",
    reason: "Test success",
    adminUsername: "test-admin",
  });
  await adminRequest("POST", `/api/admin/campaigns/${campaignId}/transition`, {
    newState: "FULFILLMENT",
    reason: "Test fulfillment",
    adminUsername: "test-admin",
  });
  await adminRequest("POST", `/api/admin/campaigns/${campaignId}/transition`, {
    newState: "RELEASED",
    reason: "Test release state",
    adminUsername: "test-admin",
  });
  
  const idempotencyKey = randomUUID();
  
  const resp1 = await adminRequest("POST", `/api/admin/campaigns/${campaignId}/release`, {
    adminUsername: "test-admin",
  }, { "x-idempotency-key": idempotencyKey });
  const data1 = await resp1.json();
  console.log("First release request:", resp1.status, data1._idempotent ? "(idempotent)" : "(fresh)");
  
  const resp2 = await adminRequest("POST", `/api/admin/campaigns/${campaignId}/release`, {
    adminUsername: "test-admin",
  }, { "x-idempotency-key": idempotencyKey });
  const data2 = await resp2.json();
  console.log("Second release request:", resp2.status, data2._idempotent ? "(idempotent)" : "(fresh)");
  
  const passed = 
    resp1.status === 200 &&
    resp2.status === 200 &&
    data1._idempotent !== true &&
    data2._idempotent === true;
  
  results.push({
    name: "Release Idempotency",
    passed,
    details: `First: ${resp1.status} (idempotent=${data1._idempotent}), Second: ${resp2.status} (idempotent=${data2._idempotent})`,
  });
  
  console.log(passed ? "PASSED" : "FAILED");
}

async function testSameKeyReturnsIdenticalResponse() {
  console.log("\n=== Test: Same Key Returns Identical Response ===");
  
  const campaignId = await createTestCampaign("Same Response Test " + Date.now());
  await createCommitment(campaignId);
  
  await adminRequest("POST", `/api/admin/campaigns/${campaignId}/transition`, {
    newState: "FAILED",
    reason: "Test failed state",
    adminUsername: "test-admin",
  });
  
  const idempotencyKey = randomUUID();
  
  const resp1 = await adminRequest("POST", `/api/admin/campaigns/${campaignId}/refund`, {
    adminUsername: "test-admin",
  }, { "x-idempotency-key": idempotencyKey });
  const data1 = await resp1.json();
  
  const resp2 = await adminRequest("POST", `/api/admin/campaigns/${campaignId}/refund`, {
    adminUsername: "test-admin",
  }, { "x-idempotency-key": idempotencyKey });
  const data2 = await resp2.json();
  
  const passed = 
    data1.processed === data2.processed &&
    data1.skipped === data2.skipped &&
    data2._idempotent === true;
  
  results.push({
    name: "Same Key Returns Identical Response",
    passed,
    details: `First: processed=${data1.processed}, Second: processed=${data2.processed}, _idempotent=${data2._idempotent}`,
  });
  
  console.log(passed ? "PASSED" : "FAILED");
}

async function testMissingKeyReturns400() {
  console.log("\n=== Test: Missing Idempotency Key Returns 400 ===");
  
  const campaignId = await createTestCampaign("No Key Test " + Date.now());
  await createCommitment(campaignId);
  
  await adminRequest("POST", `/api/admin/campaigns/${campaignId}/transition`, {
    newState: "FAILED",
    reason: "Test failed state",
    adminUsername: "test-admin",
  });
  
  const resp = await adminRequest("POST", `/api/admin/campaigns/${campaignId}/refund`, {
    adminUsername: "test-admin",
  });
  
  const passed = resp.status === 400;
  
  results.push({
    name: "Missing Key Returns 400",
    passed,
    details: `Status: ${resp.status} (expected 400)`,
  });
  
  console.log(passed ? "PASSED" : "FAILED");
}

async function main() {
  console.log("=".repeat(60));
  console.log("Admin Idempotency Test Suite");
  console.log("=".repeat(60));
  
  try {
    await testRefundIdempotency();
    await testReleaseIdempotency();
    await testSameKeyReturnsIdenticalResponse();
    await testMissingKeyReturns400();
  } catch (error) {
    console.error("Test error:", error);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`[${status}] ${result.name}`);
    if (result.details) {
      console.log(`       ${result.details}`);
    }
    if (result.passed) passed++;
    else failed++;
  }
  
  console.log("\n" + "-".repeat(60));
  console.log(`Total: ${passed + failed} tests, ${passed} passed, ${failed} failed`);
  
  process.exit(failed > 0 ? 1 : 0);
}

main();
