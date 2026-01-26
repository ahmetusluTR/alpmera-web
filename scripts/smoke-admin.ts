/**
 * ADMIN SMOKE TESTS
 *
 * Lightweight smoke tests for key admin API endpoints
 * Validates endpoints are reachable and return expected status codes
 *
 * USAGE:
 *   npm run smoke:admin
 *
 * ENVIRONMENT VARIABLES:
 *   ADMIN_BASE_URL - Base URL for admin API (default: http://localhost:5000)
 *   ADMIN_API_KEY - Admin API key for authentication (from .env)
 */

const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || "http://localhost:5000";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

interface TestResult {
  name: string;
  endpoint: string;
  passed: boolean;
  status?: number;
  error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  endpoint: string,
  expectedStatus: number = 200
): Promise<TestResult> {
  try {
    const url = `${ADMIN_BASE_URL}${endpoint}`;
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`   URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${ADMIN_API_KEY}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const passed = response.status === expectedStatus;
    const result: TestResult = {
      name,
      endpoint,
      passed,
      status: response.status,
    };

    if (passed) {
      console.log(`   ✅ PASS (status: ${response.status})`);
    } else {
      console.log(`   ❌ FAIL (expected: ${expectedStatus}, got: ${response.status})`);
      result.error = `Expected status ${expectedStatus}, got ${response.status}`;
    }

    return result;
  } catch (error) {
    console.log(`   ❌ FAIL (error: ${error instanceof Error ? error.message : String(error)})`);
    return {
      name,
      endpoint,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runSmokeTests() {
  console.log("🌱 Admin Smoke Tests");
  console.log("==================\n");
  console.log(`Base URL: ${ADMIN_BASE_URL}`);
  console.log(`API Key: ${ADMIN_API_KEY ? "***" + ADMIN_API_KEY.slice(-4) : "NOT SET"}\n`);

  if (!ADMIN_API_KEY) {
    console.error("❌ ERROR: ADMIN_API_KEY not set in environment");
    console.error("Set it in .env file or pass as environment variable");
    process.exit(1);
  }

  // Test 1: Credits ledger list
  results.push(
    await testEndpoint(
      "Credits Ledger List",
      "/api/admin/credits?limit=10&offset=0",
      200
    )
  );

  // Test 2: Participant credit summary (using demo user)
  results.push(
    await testEndpoint(
      "Participant Credit Summary",
      "/api/admin/credits/participant/demo_user_alice/summary",
      200
    )
  );

  // Test 3: Refunds list
  results.push(
    await testEndpoint(
      "Refunds List",
      "/api/admin/refunds",
      200
    )
  );

  // Test 4: Campaigns list
  results.push(
    await testEndpoint(
      "Campaigns List",
      "/api/admin/campaigns",
      200
    )
  );

  // Test 5: Products list
  results.push(
    await testEndpoint(
      "Products List",
      "/api/admin/products",
      200
    )
  );

  // Summary
  console.log("\n\n📊 Test Summary");
  console.log("================\n");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\n\n❌ Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`\n  ${r.name}`);
        console.log(`    Endpoint: ${r.endpoint}`);
        console.log(`    Status: ${r.status || "N/A"}`);
        console.log(`    Error: ${r.error || "Unknown"}`);
      });

    console.log("\n\n❌ Smoke tests FAILED");
    process.exit(1);
  } else {
    console.log("\n\n✅ All smoke tests PASSED");
    process.exit(0);
  }
}

// Run tests
runSmokeTests().catch((error) => {
  console.error("\n\n❌ Smoke tests encountered an error:", error);
  process.exit(1);
});
