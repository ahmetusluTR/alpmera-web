/**
 * Test: Commitment User Linking
 * 
 * Tests:
 * 1. Login as User A
 * 2. Create commitment as User A
 * 3. Assert commitment.user_id = userA.id
 * 4. Login as User B
 * 5. Confirm User B cannot see User A's commitments via /api/account/commitments
 * 6. Create commitment as User B
 * 7. Confirm User B only sees their own commitment
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const USER_A_EMAIL = `test-user-a-${Date.now()}@example.com`;
const USER_B_EMAIL = `test-user-b-${Date.now()}@example.com`;

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[TEST] ${message}`);
}

function logSuccess(name: string, message: string) {
  console.log(`  ✓ ${name}: ${message}`);
  results.push({ name, passed: true, message });
}

function logFailure(name: string, message: string) {
  console.log(`  ✗ ${name}: ${message}`);
  results.push({ name, passed: false, message });
}

function extractCookies(setCookieHeader: string | string[] | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!setCookieHeader) return cookies;
  
  const headerArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  
  for (const cookie of headerArray) {
    const [nameValue] = cookie.split(";");
    const [name, value] = nameValue.split("=");
    if (name && value) {
      cookies[name.trim()] = value.trim();
    }
  }
  
  return cookies;
}

function formatCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function loginUser(email: string): Promise<{ userId: string; cookies: Record<string, string> } | null> {
  // Start auth
  const startResponse = await fetch(`${BASE_URL}/api/auth/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  
  const startData = await startResponse.json();
  if (!startResponse.ok || !startData.devCode) {
    console.error(`Failed to start auth for ${email}:`, startData);
    return null;
  }
  
  // Verify code
  const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code: startData.devCode }),
  });
  
  const verifyData = await verifyResponse.json();
  const setCookie = verifyResponse.headers.get("set-cookie");
  const cookies = extractCookies(setCookie || undefined);
  
  if (!verifyResponse.ok || !cookies.alpmera_user) {
    console.error(`Failed to verify code for ${email}:`, verifyData);
    return null;
  }
  
  return { userId: verifyData.user.id, cookies };
}

async function getFirstAggregationCampaign(): Promise<{ id: string; unitPrice: string; minCommitment: string } | null> {
  const response = await fetch(`${BASE_URL}/api/campaigns`);
  const campaigns = await response.json();
  
  const aggregationCampaign = campaigns.find((c: any) => c.state === "AGGREGATION");
  if (!aggregationCampaign) {
    console.error("No AGGREGATION campaign found");
    return null;
  }
  
  return {
    id: aggregationCampaign.id,
    unitPrice: aggregationCampaign.unitPrice,
    minCommitment: aggregationCampaign.minCommitment,
  };
}

async function runTests() {
  log(`Starting commitment user linking tests`);
  log(`User A: ${USER_A_EMAIL}`);
  log(`User B: ${USER_B_EMAIL}`);
  log(`Base URL: ${BASE_URL}`);
  log("");
  
  // Get a campaign in AGGREGATION state
  const campaign = await getFirstAggregationCampaign();
  if (!campaign) {
    logFailure("Setup", "No AGGREGATION campaign available for testing");
    return;
  }
  logSuccess("Setup", `Using campaign ${campaign.id}`);
  
  // Calculate quantity to meet minimum commitment
  const unitPrice = parseFloat(campaign.unitPrice);
  const minCommitment = parseFloat(campaign.minCommitment);
  const quantity = Math.ceil(minCommitment / unitPrice);
  
  // Test 1: Login as User A
  log("Test 1: Login as User A");
  const userA = await loginUser(USER_A_EMAIL);
  if (!userA) {
    logFailure("Login User A", "Failed to login as User A");
    return;
  }
  logSuccess("Login User A", `Logged in as ${USER_A_EMAIL}, ID: ${userA.userId}`);
  
  // Test 2: Create commitment as User A
  log("Test 2: Create commitment as User A");
  let userACommitment: any;
  try {
    const response = await fetch(`${BASE_URL}/api/campaigns/${campaign.id}/commit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": formatCookieHeader(userA.cookies),
        "x-idempotency-key": `test-user-a-commitment-${Date.now()}`,
      },
      body: JSON.stringify({
        participantName: "User A Test",
        participantEmail: USER_A_EMAIL,
        quantity,
      }),
    });
    
    userACommitment = await response.json();
    
    if (response.ok && userACommitment.id) {
      logSuccess("Create Commitment A", `Reference: ${userACommitment.referenceNumber}`);
    } else {
      logFailure("Create Commitment A", `Failed: ${JSON.stringify(userACommitment)}`);
      return;
    }
  } catch (error) {
    logFailure("Create Commitment A", `Error: ${error}`);
    return;
  }
  
  // Test 3: Verify commitment.user_id = userA.id
  log("Test 3: Verify commitment has user_id");
  try {
    const response = await fetch(`${BASE_URL}/api/account/commitments`, {
      headers: { "Cookie": formatCookieHeader(userA.cookies) },
    });
    
    const commitments = await response.json();
    const foundCommitment = commitments.find((c: any) => c.id === userACommitment.id);
    
    if (foundCommitment && foundCommitment.userId === userA.userId) {
      logSuccess("User ID Linked", `Commitment ${foundCommitment.referenceNumber} has userId: ${foundCommitment.userId}`);
    } else if (foundCommitment) {
      logFailure("User ID Linked", `Commitment found but userId mismatch: expected ${userA.userId}, got ${foundCommitment.userId}`);
    } else {
      logFailure("User ID Linked", `Commitment not found in user's commitments`);
    }
  } catch (error) {
    logFailure("User ID Linked", `Error: ${error}`);
  }
  
  // Test 4: Login as User B
  log("Test 4: Login as User B");
  const userB = await loginUser(USER_B_EMAIL);
  if (!userB) {
    logFailure("Login User B", "Failed to login as User B");
    return;
  }
  logSuccess("Login User B", `Logged in as ${USER_B_EMAIL}, ID: ${userB.userId}`);
  
  // Test 5: User B cannot see User A's commitments
  log("Test 5: User B cannot see User A's commitments");
  try {
    const response = await fetch(`${BASE_URL}/api/account/commitments`, {
      headers: { "Cookie": formatCookieHeader(userB.cookies) },
    });
    
    const commitments = await response.json();
    const foundUserACommitment = commitments.find((c: any) => c.id === userACommitment.id);
    
    if (!foundUserACommitment) {
      logSuccess("User Isolation", `User B correctly cannot see User A's commitment (${commitments.length} commitments visible)`);
    } else {
      logFailure("User Isolation", `SECURITY ISSUE: User B can see User A's commitment!`);
    }
  } catch (error) {
    logFailure("User Isolation", `Error: ${error}`);
  }
  
  // Test 6: Create commitment as User B
  log("Test 6: Create commitment as User B");
  let userBCommitment: any;
  try {
    const response = await fetch(`${BASE_URL}/api/campaigns/${campaign.id}/commit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": formatCookieHeader(userB.cookies),
        "x-idempotency-key": `test-user-b-commitment-${Date.now()}`,
      },
      body: JSON.stringify({
        participantName: "User B Test",
        participantEmail: USER_B_EMAIL,
        quantity,
      }),
    });
    
    userBCommitment = await response.json();
    
    if (response.ok && userBCommitment.id) {
      logSuccess("Create Commitment B", `Reference: ${userBCommitment.referenceNumber}`);
    } else {
      logFailure("Create Commitment B", `Failed: ${JSON.stringify(userBCommitment)}`);
      return;
    }
  } catch (error) {
    logFailure("Create Commitment B", `Error: ${error}`);
    return;
  }
  
  // Test 7: User B only sees their own commitment
  log("Test 7: User B only sees their own commitments");
  try {
    const response = await fetch(`${BASE_URL}/api/account/commitments`, {
      headers: { "Cookie": formatCookieHeader(userB.cookies) },
    });
    
    const commitments = await response.json();
    const hasOwnCommitment = commitments.some((c: any) => c.id === userBCommitment.id);
    const hasUserACommitment = commitments.some((c: any) => c.id === userACommitment.id);
    
    if (hasOwnCommitment && !hasUserACommitment) {
      logSuccess("User B Scoped View", `User B sees ${commitments.length} commitment(s), only their own`);
    } else if (!hasOwnCommitment) {
      logFailure("User B Scoped View", "User B cannot see their own commitment");
    } else {
      logFailure("User B Scoped View", "SECURITY ISSUE: User B can still see User A's commitment");
    }
  } catch (error) {
    logFailure("User B Scoped View", `Error: ${error}`);
  }
  
  // Test 8: User A still sees only their own commitment
  log("Test 8: User A still sees only their own commitment");
  try {
    const response = await fetch(`${BASE_URL}/api/account/commitments`, {
      headers: { "Cookie": formatCookieHeader(userA.cookies) },
    });
    
    const commitments = await response.json();
    const hasOwnCommitment = commitments.some((c: any) => c.id === userACommitment.id);
    const hasUserBCommitment = commitments.some((c: any) => c.id === userBCommitment.id);
    
    if (hasOwnCommitment && !hasUserBCommitment) {
      logSuccess("User A Scoped View", `User A sees ${commitments.length} commitment(s), only their own`);
    } else if (!hasOwnCommitment) {
      logFailure("User A Scoped View", "User A cannot see their own commitment");
    } else {
      logFailure("User A Scoped View", "SECURITY ISSUE: User A can see User B's commitment");
    }
  } catch (error) {
    logFailure("User A Scoped View", `Error: ${error}`);
  }
  
  // Summary
  log("");
  log("========================================");
  log("TEST SUMMARY");
  log("========================================");
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`  Total: ${results.length}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  
  if (failed > 0) {
    log("");
    log("FAILED TESTS:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else {
    log("");
    log("All tests passed!");
    
    // Print file paths and line ranges
    log("");
    log("========================================");
    log("IMPLEMENTATION DETAILS");
    log("========================================");
    console.log("  user_id set in: server/routes.ts lines 653-672");
    console.log("  storage method: server/storage.ts lines 195-210");
    console.log("  account endpoint: server/routes.ts lines 506-518");
    console.log("  test file: scripts/test-commitment-user-linking.ts");
    
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error("Test runner error:", error);
  process.exit(1);
});
