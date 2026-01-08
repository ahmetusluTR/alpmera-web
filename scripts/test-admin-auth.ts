/**
 * Phase 1 Production Security Audit - Admin Endpoint Authentication Test
 * 
 * SECURITY: Admin endpoints NEVER accessible without x-admin-auth
 * 
 * This script verifies that admin endpoints are properly protected:
 * 1. Requests without x-admin-auth header MUST fail (401/503)
 * 2. Requests with wrong key MUST fail (401)
 * 3. Requests with correct key MUST succeed (200)
 * 
 * REQUIREMENTS:
 * - Server must be running with ADMIN_API_KEY set
 * - Set ADMIN_API_KEY in environment before running
 * 
 * USAGE:
 *   ADMIN_API_KEY=your-secret-key npx tsx scripts/test-admin-auth.ts
 */

const API_BASE = "http://localhost:5000";

interface TestResult {
  test: string;
  passed: boolean;
  details: string;
  expected: string;
  actual: string;
}

// Admin routes to test
const ADMIN_ROUTES = [
  { method: "GET", path: "/api/admin/logs", description: "Get admin logs" },
  { method: "GET", path: "/api/admin/campaigns/test-agg-1/escrow", description: "Get escrow ledger" },
  { method: "POST", path: "/api/admin/campaigns/test-agg-1/transition", 
    description: "Transition campaign state",
    body: { newState: "FAILED", reason: "Security test", adminUsername: "security_test" }
  },
  { method: "POST", path: "/api/admin/campaigns", 
    description: "Create campaign",
    body: { adminUsername: "security_test", title: "Security Test", rules: "Test", targetAmount: "1000", unitPrice: "10", aggregationDeadline: new Date(Date.now() + 86400000).toISOString() }
  },
];

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

async function testNoAuthHeader(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  console.log("\n=== Test 1: No x-admin-auth header → MUST FAIL ===\n");

  for (const route of ADMIN_ROUTES) {
    const res = await makeRequest(route.method, route.path, route.body);
    const status = res.status;
    
    // MUST be 401 (missing header) or 503 (key not configured)
    const passed = status === 401 || status === 503;
    
    results.push({
      test: `No auth: ${route.method} ${route.path}`,
      passed,
      details: route.description,
      expected: "401 or 503",
      actual: String(status),
    });
    
    console.log(`${passed ? "✓" : "✗"} ${route.method} ${route.path}: ${status}`);
  }

  return results;
}

async function testWrongAuthHeader(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  console.log("\n=== Test 2: Wrong x-admin-auth header → MUST FAIL ===\n");

  for (const route of ADMIN_ROUTES) {
    const res = await makeRequest(
      route.method, 
      route.path, 
      route.body,
      { "x-admin-auth": "wrong-key-12345" }
    );
    const status = res.status;
    
    // MUST be 401 (wrong key) or 503 (key not configured)
    const passed = status === 401 || status === 503;
    
    results.push({
      test: `Wrong auth: ${route.method} ${route.path}`,
      passed,
      details: route.description,
      expected: "401 or 503",
      actual: String(status),
    });
    
    console.log(`${passed ? "✓" : "✗"} ${route.method} ${route.path}: ${status}`);
  }

  return results;
}

async function testCorrectAuthHeader(adminApiKey: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  console.log("\n=== Test 3: Correct x-admin-auth header → MUST SUCCEED ===\n");

  // Use only GET endpoints for "success" tests to avoid side effects
  const safeRoutes = ADMIN_ROUTES.filter(r => r.method === "GET");

  for (const route of safeRoutes) {
    const res = await makeRequest(
      route.method, 
      route.path, 
      route.body,
      { "x-admin-auth": adminApiKey }
    );
    const status = res.status;
    
    // Should return 200 with correct key
    const passed = status === 200;
    
    results.push({
      test: `Correct auth: ${route.method} ${route.path}`,
      passed,
      details: route.description,
      expected: "200",
      actual: String(status),
    });
    
    console.log(`${passed ? "✓" : "✗"} ${route.method} ${route.path}: ${status}`);
  }

  return results;
}

async function testDataIsolation(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  console.log("\n=== Test 4: Data isolation - public endpoints ===\n");

  // Test 1: Status lookup by reference should not enumerate other commitments
  console.log("Testing reference number lookup isolation...");
  const fakeRefRes = await makeRequest("GET", "/api/commitments/FAKE-REF-12345");
  const fakeStatus = fakeRefRes.status;
  
  const refIsolationPassed = fakeStatus === 404;
  results.push({
    test: "Fake reference number returns 404",
    passed: refIsolationPassed,
    details: "Status lookup by reference should not enumerate commitments",
    expected: "404",
    actual: String(fakeStatus),
  });
  console.log(`${refIsolationPassed ? "✓" : "✗"} Fake reference: ${fakeStatus}`);

  // Test 2: Public campaign list should NOT include admin_action_logs
  console.log("Testing campaign list data scope...");
  const campaignsRes = await makeRequest("GET", "/api/campaigns");
  if (campaignsRes.ok) {
    const campaigns = await campaignsRes.json();
    const hasAdminLogs = JSON.stringify(campaigns).includes("admin_action_logs");
    const hasSupplierAcceptances = JSON.stringify(campaigns).includes("supplier_acceptances");
    
    const noLeakagePassed = !hasAdminLogs && !hasSupplierAcceptances;
    results.push({
      test: "Campaign list has no admin data leakage",
      passed: noLeakagePassed,
      details: "Public campaign list should not include admin_action_logs or supplier_acceptances",
      expected: "No admin data",
      actual: hasAdminLogs ? "Contains admin_action_logs" : (hasSupplierAcceptances ? "Contains supplier_acceptances" : "Clean"),
    });
    console.log(`${noLeakagePassed ? "✓" : "✗"} Campaign list data scope: ${noLeakagePassed ? "Clean" : "Leakage detected"}`);
  }

  // Test 3: Escrow endpoint must require admin auth
  console.log("Testing escrow endpoint protection...");
  const escrowRes = await makeRequest("GET", "/api/admin/campaigns/test-agg-1/escrow");
  const escrowProtected = escrowRes.status === 401 || escrowRes.status === 503;
  
  results.push({
    test: "Escrow ledger requires admin auth",
    passed: escrowProtected,
    details: "Escrow data should only be accessible to authenticated admins",
    expected: "401 or 503",
    actual: String(escrowRes.status),
  });
  console.log(`${escrowProtected ? "✓" : "✗"} Escrow endpoint: ${escrowRes.status}`);

  return results;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Phase 1 Security Audit - STRICT Admin Authentication       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const adminApiKey = process.env.ADMIN_API_KEY;
  
  if (!adminApiKey) {
    console.log("\n🔴 ERROR: ADMIN_API_KEY not set in environment");
    console.log("   Run with: ADMIN_API_KEY=your-key npx tsx scripts/test-admin-auth.ts\n");
    process.exit(1);
  }
  
  console.log(`\n✓ ADMIN_API_KEY configured: ${adminApiKey.substring(0, 4)}...`);

  const allResults: TestResult[] = [];

  // Test 1: No auth header - MUST FAIL
  const noAuthResults = await testNoAuthHeader();
  allResults.push(...noAuthResults);

  // Test 2: Wrong auth header - MUST FAIL
  const wrongAuthResults = await testWrongAuthHeader();
  allResults.push(...wrongAuthResults);

  // Test 3: Correct auth header - MUST SUCCEED
  const correctAuthResults = await testCorrectAuthHeader(adminApiKey);
  allResults.push(...correctAuthResults);

  // Test 4: Data isolation
  const isolationResults = await testDataIsolation();
  allResults.push(...isolationResults);

  // Summary
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                      TEST SUMMARY                             ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;

  for (const result of allResults) {
    const icon = result.passed ? "✓" : "✗";
    console.log(`${icon} ${result.test}`);
    if (!result.passed) {
      console.log(`  Expected: ${result.expected}, Got: ${result.actual}`);
    }
  }

  console.log(`\nTotal: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("\n🔴 SECURITY AUDIT FAILED");
    console.log("   Some admin endpoints may not be properly protected.");
    process.exit(1);
  } else {
    console.log("\n🟢 SECURITY AUDIT PASSED");
    console.log("   All admin endpoints are properly protected.");
    process.exit(0);
  }
}

main().catch(console.error);
