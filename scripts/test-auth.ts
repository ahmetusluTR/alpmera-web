/**
 * User Authentication Test Script
 * Tests the passwordless login flow:
 * 1. Start auth (request code)
 * 2. Get code from dev endpoint
 * 3. Verify code and receive session cookie
 * 4. Access protected /api/me endpoint
 * 5. Update profile
 * 6. Logout
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const TEST_EMAIL = `test-user-${Date.now()}@example.com`;

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

// Extract cookies from Set-Cookie header
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

// Format cookies for request header
function formatCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function runTests() {
  log(`Starting auth tests with email: ${TEST_EMAIL}`);
  log(`Base URL: ${BASE_URL}`);
  log("");
  
  let sessionCookies: Record<string, string> = {};
  let devCode: string = "";
  
  // Test 1: Start auth
  log("Test 1: Start Authentication");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // In dev mode, code is returned in response
      if (data.devCode) {
        devCode = data.devCode;
        logSuccess("Start Auth", `Code generated: ${devCode}`);
      } else {
        logSuccess("Start Auth", "Code sent (production mode - no dev code)");
      }
    } else {
      logFailure("Start Auth", `Failed: ${JSON.stringify(data)}`);
      return;
    }
  } catch (error) {
    logFailure("Start Auth", `Error: ${error}`);
    return;
  }
  
  // Test 2: Get code from dev endpoint (backup)
  if (!devCode) {
    log("Test 2: Fetch Dev Code");
    try {
      const response = await fetch(`${BASE_URL}/api/auth/dev-code/${encodeURIComponent(TEST_EMAIL)}`);
      
      if (response.ok) {
        const data = await response.json();
        devCode = data.code;
        logSuccess("Fetch Dev Code", `Retrieved code: ${devCode}`);
      } else {
        logFailure("Fetch Dev Code", "No code available - may be production mode");
        return;
      }
    } catch (error) {
      logFailure("Fetch Dev Code", `Error: ${error}`);
      return;
    }
  } else {
    log("Test 2: Skipping dev code fetch (already have code from start response)");
    logSuccess("Skip Dev Code", "Code already available");
  }
  
  // Test 3: Verify code and get session
  log("Test 3: Verify Code");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, code: devCode }),
    });
    
    const data = await response.json();
    
    // Extract session cookie
    const setCookie = response.headers.get("set-cookie");
    sessionCookies = extractCookies(setCookie || undefined);
    
    if (response.ok && data.success && sessionCookies.alpmera_user) {
      logSuccess("Verify Code", `Logged in as ${data.user.email}, session cookie received`);
    } else if (response.ok && data.success) {
      logFailure("Verify Code", "Login succeeded but no session cookie received");
      console.log("  Response headers:", Object.fromEntries(response.headers.entries()));
      return;
    } else {
      logFailure("Verify Code", `Failed: ${JSON.stringify(data)}`);
      return;
    }
  } catch (error) {
    logFailure("Verify Code", `Error: ${error}`);
    return;
  }
  
  // Test 4: SECURITY - Attempt to reuse the same code (should fail)
  log("Test 4: Code Reuse Prevention (SECURITY)");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, code: devCode }),
    });
    
    if (response.status === 401) {
      const data = await response.json();
      logSuccess("Code Reuse Prevention", `Correctly rejected reused code: ${data.error}`);
    } else {
      logFailure("Code Reuse Prevention", `SECURITY ISSUE: Code was reused! Status ${response.status}`);
    }
  } catch (error) {
    logFailure("Code Reuse Prevention", `Error: ${error}`);
  }
  
  // Test 5: Check session status
  log("Test 5: Check Session Status");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { "Cookie": formatCookieHeader(sessionCookies) },
    });
    
    const data = await response.json();
    
    if (data.authenticated && data.user) {
      logSuccess("Session Check", `Authenticated as ${data.user.email}`);
    } else {
      logFailure("Session Check", `Not authenticated: ${JSON.stringify(data)}`);
      return;
    }
  } catch (error) {
    logFailure("Session Check", `Error: ${error}`);
    return;
  }
  
  // Test 6: Access protected /api/me endpoint
  log("Test 6: Access /api/me (Protected)");
  try {
    const response = await fetch(`${BASE_URL}/api/me`, {
      headers: { "Cookie": formatCookieHeader(sessionCookies) },
    });
    
    const data = await response.json();
    
    if (response.ok && data.email) {
      logSuccess("Get User", `User: ${data.email}, Profile exists: ${!!data.profile}`);
    } else {
      logFailure("Get User", `Failed: ${JSON.stringify(data)}`);
      return;
    }
  } catch (error) {
    logFailure("Get User", `Error: ${error}`);
    return;
  }
  
  // Test 7: Update profile
  log("Test 7: Update Profile");
  try {
    const profileData = {
      fullName: "Test User",
      phone: "+1-555-123-4567",
      defaultAddressLine1: "123 Test Street",
      city: "Test City",
      state: "TS",
      zip: "12345",
      country: "USA",
    };
    
    const response = await fetch(`${BASE_URL}/api/me/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": formatCookieHeader(sessionCookies),
      },
      body: JSON.stringify(profileData),
    });
    
    const data = await response.json();
    
    if (response.ok && data.fullName === profileData.fullName) {
      logSuccess("Update Profile", `Profile updated: ${data.fullName}, ${data.city}`);
    } else {
      logFailure("Update Profile", `Failed: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    logFailure("Update Profile", `Error: ${error}`);
  }
  
  // Test 8: Verify profile was saved
  log("Test 8: Verify Profile Update");
  try {
    const response = await fetch(`${BASE_URL}/api/me`, {
      headers: { "Cookie": formatCookieHeader(sessionCookies) },
    });
    
    const data = await response.json();
    
    if (response.ok && data.profile?.fullName === "Test User") {
      logSuccess("Verify Profile", `Profile verified: ${data.profile.fullName}`);
    } else {
      logFailure("Verify Profile", `Profile not updated correctly: ${JSON.stringify(data.profile)}`);
    }
  } catch (error) {
    logFailure("Verify Profile", `Error: ${error}`);
  }
  
  // Test 9: Access /api/me without auth (should fail)
  log("Test 9: Access /api/me Without Auth (Should Fail)");
  try {
    const response = await fetch(`${BASE_URL}/api/me`);
    
    if (response.status === 401) {
      logSuccess("Unauthenticated Access", "Correctly rejected with 401");
    } else {
      logFailure("Unauthenticated Access", `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    logFailure("Unauthenticated Access", `Error: ${error}`);
  }
  
  // Test 10: Logout
  log("Test 10: Logout");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Cookie": formatCookieHeader(sessionCookies) },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      logSuccess("Logout", "Logged out successfully");
    } else {
      logFailure("Logout", `Failed: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    logFailure("Logout", `Error: ${error}`);
  }
  
  // Test 11: Verify session is invalidated
  log("Test 11: Verify Session Invalidated");
  try {
    const response = await fetch(`${BASE_URL}/api/me`, {
      headers: { "Cookie": formatCookieHeader(sessionCookies) },
    });
    
    if (response.status === 401) {
      logSuccess("Session Invalidated", "Session correctly invalidated after logout");
    } else {
      logFailure("Session Invalidated", `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    logFailure("Session Invalidated", `Error: ${error}`);
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
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error("Test runner error:", error);
  process.exit(1);
});
