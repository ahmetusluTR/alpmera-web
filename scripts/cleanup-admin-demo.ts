/**
 * ADMIN DEMO DATA CLEANUP
 *
 * Removes all demo data seeded by seed-admin-demo.ts
 *
 * SAFETY:
 * - Only deletes records with demo_ prefix in IDs
 * - Only runs when APP_ENV !== 'production'
 * - Respects foreign key constraints (deletes in correct order)
 *
 * USAGE:
 *   npm run seed:admin-demo:cleanup
 */

import { db } from "../server/db";
import { sql } from "drizzle-orm";

// Environment guard
const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || "development";

if (APP_ENV === "production") {
  console.error("❌ ABORT: Cleanup is not allowed in production");
  process.exit(1);
}

console.log(`✅ Environment check passed: ${APP_ENV}`);
console.log("🧹 Starting admin demo data cleanup...\n");

const DEMO_PREFIX = "demo_";

async function cleanupDemoData() {
  try {
    console.log("⚠️  This will delete ALL demo data (IDs starting with 'demo_')");
    console.log("⏳ Waiting 3 seconds... (Ctrl+C to abort)\n");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("📝 Step 1: Deleting admin action logs...");
    const deletedActionLogs = await db.execute(
      sql`DELETE FROM admin_action_logs WHERE campaign_id LIKE ${DEMO_PREFIX + "%"}`
    );
    console.log(`✅ Deleted admin action logs`);

    console.log("📝 Step 2: Deleting credit ledger entries...");
    const deletedCreditLedger = await db.execute(
      sql`DELETE FROM credit_ledger_entries WHERE participant_id LIKE ${DEMO_PREFIX + "%"}`
    );
    console.log(`✅ Deleted credit ledger entries`);

    console.log("📝 Step 3: Deleting escrow ledger entries...");
    const deletedEscrowLedger = await db.execute(
      sql`DELETE FROM escrow_ledger WHERE campaign_id LIKE ${DEMO_PREFIX + "%"}`
    );
    console.log(`✅ Deleted escrow ledger entries`);

    console.log("📝 Step 4: Deleting commitments...");
    const deletedCommitments = await db.execute(
      sql`DELETE FROM commitments WHERE id LIKE ${DEMO_PREFIX + "%"}`
    );
    console.log(`✅ Deleted commitments`);

    console.log("📝 Step 5: Deleting campaigns...");
    const deletedCampaigns = await db.execute(
      sql`DELETE FROM campaigns WHERE id LIKE ${DEMO_PREFIX + "%"}`
    );
    console.log(`✅ Deleted campaigns`);

    console.log("📝 Step 6: Deleting consolidation points...");
    const deletedConsolidationPoints = await db.execute(
      sql`DELETE FROM consolidation_points WHERE id LIKE ${DEMO_PREFIX + "%"}`
    );
    console.log(`✅ Deleted consolidation points`);

    console.log("📝 Step 7: Deleting products...");
    const deletedProducts = await db.execute(
      sql`DELETE FROM products WHERE id LIKE ${DEMO_PREFIX + "%"}`
    );
    console.log(`✅ Deleted products`);

    console.log("📝 Step 8: Deleting suppliers...");
    const deletedSuppliers = await db.execute(
      sql`DELETE FROM suppliers WHERE id LIKE ${DEMO_PREFIX + "%"}`
    );
    console.log(`✅ Deleted suppliers`);

    console.log("📝 Step 9: Deleting user profiles...");
    const deletedUserProfiles = await db.execute(
      sql`DELETE FROM user_profiles WHERE user_id LIKE ${DEMO_PREFIX + "%"}`
    );
    console.log(`✅ Deleted user profiles`);

    console.log("📝 Step 10: Deleting users...");
    const deletedUsers = await db.execute(
      sql`DELETE FROM users WHERE id LIKE ${DEMO_PREFIX + "%"}`
    );
    console.log(`✅ Deleted users`);

    console.log("\n✅ Cleanup complete!");
    console.log("All demo data has been removed from the database.");
  } catch (error) {
    console.error("❌ Error cleaning up demo data:", error);
    throw error;
  }
}

// Run cleanup
cleanupDemoData()
  .then(() => {
    console.log("\n✅ Cleanup successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Cleanup failed:", error);
    process.exit(1);
  });
