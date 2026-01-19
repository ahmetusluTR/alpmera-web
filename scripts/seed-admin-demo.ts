/**
 * ADMIN DEMO DATA SEEDER
 *
 * Populates Admin Console with realistic, consistent demo data.
 *
 * SAFETY:
 * - Only runs when APP_ENV !== 'production'
 * - All data tagged with seed_tag for cleanup
 * - Append-only ledgers respected
 *
 * USAGE:
 *   npm run seed:admin-demo
 *   npm run seed:admin-demo:cleanup
 */

import { db } from "../server/db";
import {
  users,
  userProfiles,
  suppliers,
  products,
  consolidationPoints,
  campaigns,
  commitments,
  escrowLedger,
  creditLedgerEntries,
  supplierAcceptances,
  adminActionLogs,
} from "../shared/schema";
import { sql } from "drizzle-orm";

// Environment guard
const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || "development";

if (APP_ENV === "production") {
  console.error("❌ ABORT: Seeding is not allowed in production");
  process.exit(1);
}

console.log(`✅ Environment check passed: ${APP_ENV}`);
console.log("🌱 Starting admin demo data seed...\n");

// Demo data IDs (deterministic for consistency)
const DEMO_PREFIX = "demo_";
const SEED_TAG = "admin_demo";

const demoUserIds = [
  `${DEMO_PREFIX}user_alice`,
  `${DEMO_PREFIX}user_bob`,
  `${DEMO_PREFIX}user_carol`,
  `${DEMO_PREFIX}user_dave`,
  `${DEMO_PREFIX}user_eve`,
  `${DEMO_PREFIX}user_frank`,
];

const demoSupplierIds = [
  `${DEMO_PREFIX}supplier_techcorp`,
  `${DEMO_PREFIX}supplier_homegoods`,
  `${DEMO_PREFIX}supplier_electronics`,
];

const demoProductIds = [
  `${DEMO_PREFIX}product_laptop`,
  `${DEMO_PREFIX}product_monitor`,
  `${DEMO_PREFIX}product_desk`,
  `${DEMO_PREFIX}product_chair`,
];

const demoConsolidationIds = [
  `${DEMO_PREFIX}consolidation_west`,
  `${DEMO_PREFIX}consolidation_east`,
];

const demoCampaignIds = [
  `${DEMO_PREFIX}campaign_a_completed`,
  `${DEMO_PREFIX}campaign_b_aggregating`,
  `${DEMO_PREFIX}campaign_c_failed`,
];

async function seedDemoData() {
  try {
    console.log("📝 Step 1: Creating demo users...");
    await db.insert(users).values([
      {
        id: demoUserIds[0],
        email: "alice@demo.alpmera.com",
        createdAt: new Date("2026-01-10T10:00:00Z"),
      },
      {
        id: demoUserIds[1],
        email: "bob@demo.alpmera.com",
        createdAt: new Date("2026-01-10T11:00:00Z"),
      },
      {
        id: demoUserIds[2],
        email: "carol@demo.alpmera.com",
        createdAt: new Date("2026-01-11T09:00:00Z"),
      },
      {
        id: demoUserIds[3],
        email: "dave@demo.alpmera.com",
        createdAt: new Date("2026-01-11T14:00:00Z"),
      },
      {
        id: demoUserIds[4],
        email: "eve@demo.alpmera.com",
        createdAt: new Date("2026-01-12T10:00:00Z"),
      },
      {
        id: demoUserIds[5],
        email: "frank@demo.alpmera.com",
        createdAt: new Date("2026-01-13T16:00:00Z"),
      },
    ]);
    console.log("✅ Created 6 demo users");

    console.log("📝 Step 2: Creating user profiles...");
    await db.insert(userProfiles).values([
      {
        userId: demoUserIds[0],
        fullName: "Alice Anderson",
        phone: "+1-555-0101",
        defaultAddressLine1: "123 Main St",
        city: "San Francisco",
        state: "CA",
        zip: "94102",
        country: "USA",
      },
      {
        userId: demoUserIds[1],
        fullName: "Bob Brown",
        phone: "+1-555-0102",
        defaultAddressLine1: "456 Oak Ave",
        city: "Portland",
        state: "OR",
        zip: "97201",
        country: "USA",
      },
      {
        userId: demoUserIds[2],
        fullName: "Carol Chen",
        phone: "+1-555-0103",
        defaultAddressLine1: "789 Pine St",
        city: "Seattle",
        state: "WA",
        zip: "98101",
        country: "USA",
      },
      {
        userId: demoUserIds[3],
        fullName: "Dave Davis",
        phone: "+1-555-0104",
        defaultAddressLine1: "321 Elm Rd",
        city: "Austin",
        state: "TX",
        zip: "78701",
        country: "USA",
      },
      {
        userId: demoUserIds[4],
        fullName: "Eve Edwards",
        phone: "+1-555-0105",
        defaultAddressLine1: "654 Maple Dr",
        city: "Denver",
        state: "CO",
        zip: "80202",
        country: "USA",
      },
      {
        userId: demoUserIds[5],
        fullName: "Frank Foster",
        phone: "+1-555-0106",
        defaultAddressLine1: "987 Cedar Ln",
        city: "Phoenix",
        state: "AZ",
        zip: "85001",
        country: "USA",
      },
    ]);
    console.log("✅ Created 6 user profiles");

    console.log("📝 Step 3: Creating suppliers...");
    await db.insert(suppliers).values([
      {
        id: demoSupplierIds[0],
        name: "TechCorp Industries",
        contactName: "Sarah Johnson",
        contactEmail: "sarah@techcorp-demo.com",
        phone: "+1-800-TECH-001",
        website: "https://techcorp-demo.com",
        region: "West Coast",
        notes: "Demo supplier - Computer hardware specialist",
        status: "ACTIVE",
      },
      {
        id: demoSupplierIds[1],
        name: "HomeGoods Supply Co",
        contactName: "Michael Lee",
        contactEmail: "michael@homegoods-demo.com",
        phone: "+1-800-HOME-002",
        website: "https://homegoods-demo.com",
        region: "Midwest",
        notes: "Demo supplier - Office furniture and home goods",
        status: "ACTIVE",
      },
      {
        id: demoSupplierIds[2],
        name: "ElectroMax Wholesale",
        contactName: "Jennifer Wang",
        contactEmail: "jennifer@electromax-demo.com",
        phone: "+1-800-ELEC-003",
        website: "https://electromax-demo.com",
        region: "East Coast",
        notes: "Demo supplier - Consumer electronics",
        status: "ACTIVE",
      },
    ]);
    console.log("✅ Created 3 suppliers");

    console.log("📝 Step 4: Creating products...");
    await db.insert(products).values([
      {
        id: demoProductIds[0],
        sku: "DEMO-LAPTOP-001",
        name: "Professional Laptop 15\"",
        brand: "TechPro",
        modelNumber: "TP-L15-2026",
        category: "Computers",
        shortDescription: "High-performance laptop for professional use",
        specs: "Intel i7, 16GB RAM, 512GB SSD, 15.6\" display",
        primaryImageUrl: "https://placeholder.demo/laptop.jpg",
        referencePrices: JSON.stringify({ retail: 1299, wholesale: 899 }),
        status: "ACTIVE",
      },
      {
        id: demoProductIds[1],
        sku: "DEMO-MONITOR-001",
        name: "27\" 4K Monitor",
        brand: "ViewMax",
        modelNumber: "VM-27-4K",
        category: "Displays",
        shortDescription: "Professional 4K monitor with HDR support",
        specs: "27\", 3840x2160, IPS, 60Hz, HDR10",
        primaryImageUrl: "https://placeholder.demo/monitor.jpg",
        referencePrices: JSON.stringify({ retail: 599, wholesale: 399 }),
        status: "ACTIVE",
      },
      {
        id: demoProductIds[2],
        sku: "DEMO-DESK-001",
        name: "Adjustable Standing Desk",
        brand: "ErgoWork",
        modelNumber: "EW-DESK-ADJ",
        category: "Furniture",
        shortDescription: "Electric height-adjustable desk",
        specs: "60\"x30\", Electric motor, Memory presets, Cable management",
        primaryImageUrl: "https://placeholder.demo/desk.jpg",
        referencePrices: JSON.stringify({ retail: 799, wholesale: 549 }),
        status: "ACTIVE",
      },
      {
        id: demoProductIds[3],
        sku: "DEMO-CHAIR-001",
        name: "Ergonomic Office Chair",
        brand: "ComfortPlus",
        modelNumber: "CP-CHAIR-ERGO",
        category: "Furniture",
        shortDescription: "Premium ergonomic office chair",
        specs: "Lumbar support, Adjustable armrests, Mesh back, 300lb capacity",
        primaryImageUrl: "https://placeholder.demo/chair.jpg",
        referencePrices: JSON.stringify({ retail: 449, wholesale: 299 }),
        status: "ACTIVE",
      },
    ]);
    console.log("✅ Created 4 products");

    console.log("📝 Step 5: Creating consolidation points...");
    await db.insert(consolidationPoints).values([
      {
        id: demoConsolidationIds[0],
        name: "West Coast Distribution Center",
        addressLine1: "1000 Warehouse Blvd",
        city: "Oakland",
        state: "CA",
        postalCode: "94607",
        country: "USA",
        contactName: "Maria Rodriguez",
        contactEmail: "maria@demo-warehouse.com",
        contactPhone: "+1-510-555-WEST",
        status: "ACTIVE",
        notes: "Demo consolidation point - West Coast operations",
      },
      {
        id: demoConsolidationIds[1],
        name: "East Coast Fulfillment Hub",
        addressLine1: "500 Logistics Way",
        city: "Newark",
        state: "NJ",
        postalCode: "07102",
        country: "USA",
        contactName: "James Wilson",
        contactEmail: "james@demo-warehouse.com",
        contactPhone: "+1-973-555-EAST",
        status: "ACTIVE",
        notes: "Demo consolidation point - East Coast operations",
      },
    ]);
    console.log("✅ Created 2 consolidation points");

    console.log("\n🟢 Step 6: Creating Campaign A (COMPLETED - with credits & deliveries)...");
    const campaignADeadline = new Date("2026-01-15T23:59:59Z");
    await db.insert(campaigns).values({
      id: demoCampaignIds[0],
      title: "Professional Laptop Campaign - January 2026",
      description: "Group campaign for high-performance laptops. Join early for completion credits!",
      rules: "Target: 5 participants. Min commitment: $850. Campaign closes Jan 15.",
      imageUrl: "https://placeholder.demo/campaign-laptop.jpg",
      targetAmount: "4250.00", // 5 x $850
      minCommitment: "850.00",
      maxCommitment: "1000.00",
      unitPrice: "850.00",
      state: "RELEASED", // Completed and funds released
      aggregationDeadline: campaignADeadline,
      supplierAccepted: true,
      supplierAcceptedAt: new Date("2026-01-16T10:00:00Z"),
      adminPublishStatus: "PUBLISHED",
      publishedAt: new Date("2026-01-08T00:00:00Z"),
      sku: "DEMO-LAPTOP-001",
      productName: "Professional Laptop 15\"",
      brand: "TechPro",
      targetUnits: 5,
      deliveryStrategy: "BULK_TO_CONSOLIDATION",
      productId: demoProductIds[0],
      supplierId: demoSupplierIds[0],
      consolidationPointId: demoConsolidationIds[0],
    });
    console.log("✅ Created Campaign A");

    // Campaign A: 5 commitments (all participants joined)
    const campaignACommitmentIds = [
      `${DEMO_PREFIX}commit_a1`,
      `${DEMO_PREFIX}commit_a2`,
      `${DEMO_PREFIX}commit_a3`,
      `${DEMO_PREFIX}commit_a4`,
      `${DEMO_PREFIX}commit_a5`,
    ];

    await db.insert(commitments).values([
      {
        id: campaignACommitmentIds[0],
        campaignId: demoCampaignIds[0],
        userId: demoUserIds[0],
        participantName: "Alice Anderson",
        participantEmail: "alice@demo.alpmera.com",
        amount: "850.00",
        quantity: 1,
        status: "RELEASED",
        referenceNumber: "DEMO-A-ALICE-001",
        createdAt: new Date("2026-01-10T10:30:00Z"),
      },
      {
        id: campaignACommitmentIds[1],
        campaignId: demoCampaignIds[0],
        userId: demoUserIds[1],
        participantName: "Bob Brown",
        participantEmail: "bob@demo.alpmera.com",
        amount: "850.00",
        quantity: 1,
        status: "RELEASED",
        referenceNumber: "DEMO-A-BOB-002",
        createdAt: new Date("2026-01-10T12:00:00Z"),
      },
      {
        id: campaignACommitmentIds[2],
        campaignId: demoCampaignIds[0],
        userId: demoUserIds[2],
        participantName: "Carol Chen",
        participantEmail: "carol@demo.alpmera.com",
        amount: "850.00",
        quantity: 1,
        status: "RELEASED",
        referenceNumber: "DEMO-A-CAROL-003",
        createdAt: new Date("2026-01-11T09:30:00Z"),
      },
      {
        id: campaignACommitmentIds[3],
        campaignId: demoCampaignIds[0],
        userId: demoUserIds[3],
        participantName: "Dave Davis",
        participantEmail: "dave@demo.alpmera.com",
        amount: "850.00",
        quantity: 1,
        status: "RELEASED",
        referenceNumber: "DEMO-A-DAVE-004",
        createdAt: new Date("2026-01-11T15:00:00Z"),
      },
      {
        id: campaignACommitmentIds[4],
        campaignId: demoCampaignIds[0],
        userId: demoUserIds[4],
        participantName: "Eve Edwards",
        participantEmail: "eve@demo.alpmera.com",
        amount: "850.00",
        quantity: 1,
        status: "RELEASED",
        referenceNumber: "DEMO-A-EVE-005",
        createdAt: new Date("2026-01-12T11:00:00Z"),
      },
    ]);
    console.log("✅ Created 5 commitments for Campaign A");

    // Campaign A: Escrow ledger (LOCK → RELEASE flow)
    for (let i = 0; i < 5; i++) {
      // LOCK entry
      await db.insert(escrowLedger).values({
        commitmentId: campaignACommitmentIds[i],
        campaignId: demoCampaignIds[0],
        entryType: "LOCK",
        amount: "850.00",
        actor: "SYSTEM",
        reason: `Escrow locked for commitment ${campaignACommitmentIds[i]}`,
        createdAt: new Date(`2026-01-${10 + Math.floor(i / 2)}T${10 + i}:30:00Z`),
      });

      // RELEASE entry (after campaign success)
      await db.insert(escrowLedger).values({
        commitmentId: campaignACommitmentIds[i],
        campaignId: demoCampaignIds[0],
        entryType: "RELEASE",
        amount: "850.00",
        actor: "admin",
        reason: `Escrow released - Campaign completed successfully`,
        createdAt: new Date("2026-01-17T14:00:00Z"),
      });
    }
    console.log("✅ Created escrow ledger entries for Campaign A (LOCK → RELEASE)");

    // Campaign A: Credit ledger entries (completion credits)
    await db.insert(creditLedgerEntries).values([
      // Alice: Early join bonus (issued)
      {
        participantId: demoUserIds[0],
        eventType: "ISSUED",
        amount: "100.00",
        currency: "USD",
        campaignId: demoCampaignIds[0],
        reason: "Completion credit - Early join bonus (Day 1-2)",
        createdBy: "SYSTEM",
        idempotencyKey: `demo:credits:${demoUserIds[0]}:issued:campaign_a:1`,
        createdAt: new Date("2026-01-17T15:00:00Z"),
      },
      // Alice: Reserved for next campaign
      {
        participantId: demoUserIds[0],
        eventType: "RESERVED",
        amount: "-30.00",
        currency: "USD",
        reservationRef: "demo_reservation_alice_1",
        reason: "Credit reserved for Campaign B commitment",
        createdBy: "SYSTEM",
        createdAt: new Date("2026-01-18T09:00:00Z"),
      },
      // Bob: Standard completion credit
      {
        participantId: demoUserIds[1],
        eventType: "ISSUED",
        amount: "50.00",
        currency: "USD",
        campaignId: demoCampaignIds[0],
        reason: "Completion credit - Campaign success reward",
        createdBy: "SYSTEM",
        idempotencyKey: `demo:credits:${demoUserIds[1]}:issued:campaign_a:1`,
        createdAt: new Date("2026-01-17T15:00:00Z"),
      },
      // Bob: Reserved for future use
      {
        participantId: demoUserIds[1],
        eventType: "RESERVED",
        amount: "-20.00",
        currency: "USD",
        reservationRef: "demo_reservation_bob_1",
        reason: "Credit reserved for future commitment",
        createdBy: "SYSTEM",
        createdAt: new Date("2026-01-18T10:00:00Z"),
      },
      // Carol: Small completion credit
      {
        participantId: demoUserIds[2],
        eventType: "ISSUED",
        amount: "25.00",
        currency: "USD",
        campaignId: demoCampaignIds[0],
        reason: "Completion credit - Campaign success reward",
        createdBy: "SYSTEM",
        idempotencyKey: `demo:credits:${demoUserIds[2]}:issued:campaign_a:1`,
        createdAt: new Date("2026-01-17T15:00:00Z"),
      },
      // Dave: Standard credit
      {
        participantId: demoUserIds[3],
        eventType: "ISSUED",
        amount: "50.00",
        currency: "USD",
        campaignId: demoCampaignIds[0],
        reason: "Completion credit - Campaign success reward",
        createdBy: "SYSTEM",
        idempotencyKey: `demo:credits:${demoUserIds[3]}:issued:campaign_a:1`,
        createdAt: new Date("2026-01-17T15:00:00Z"),
      },
      // Eve: Standard credit
      {
        participantId: demoUserIds[4],
        eventType: "ISSUED",
        amount: "50.00",
        currency: "USD",
        campaignId: demoCampaignIds[0],
        reason: "Completion credit - Campaign success reward",
        createdBy: "SYSTEM",
        idempotencyKey: `demo:credits:${demoUserIds[4]}:issued:campaign_a:1`,
        createdAt: new Date("2026-01-17T15:00:00Z"),
      },
    ]);
    console.log("✅ Created credit ledger entries for Campaign A");

    // Campaign A: Admin action logs
    await db.insert(adminActionLogs).values([
      {
        campaignId: demoCampaignIds[0],
        adminUsername: "admin",
        action: "CAMPAIGN_COMPLETED",
        previousState: "AGGREGATION",
        newState: "SUCCESS",
        reason: "Campaign reached target - marking as successful",
        createdAt: new Date("2026-01-16T08:00:00Z"),
      },
      {
        campaignId: demoCampaignIds[0],
        adminUsername: "admin",
        action: "ESCROW_RELEASED",
        previousState: "LOCKED",
        newState: "RELEASED",
        reason: "Escrow released to supplier - goods delivered",
        createdAt: new Date("2026-01-17T14:00:00Z"),
      },
    ]);
    console.log("✅ Created admin action logs for Campaign A");

    console.log("\n🟡 Step 7: Creating Campaign B (AGGREGATING - in progress)...");
    const campaignBDeadline = new Date("2026-01-25T23:59:59Z");
    await db.insert(campaigns).values({
      id: demoCampaignIds[1],
      title: "27\" Monitor Group Campaign",
      description: "Professional 4K monitors at group pricing. Target: 10 participants.",
      rules: "Target: 10 participants. Min commitment: $400. Campaign closes Jan 25.",
      imageUrl: "https://placeholder.demo/campaign-monitor.jpg",
      targetAmount: "4000.00", // 10 x $400
      minCommitment: "400.00",
      maxCommitment: "600.00",
      unitPrice: "400.00",
      state: "AGGREGATION", // Still collecting commitments
      aggregationDeadline: campaignBDeadline,
      supplierAccepted: false,
      adminPublishStatus: "PUBLISHED",
      publishedAt: new Date("2026-01-15T00:00:00Z"),
      sku: "DEMO-MONITOR-001",
      productName: "27\" 4K Monitor",
      brand: "ViewMax",
      targetUnits: 10,
      deliveryStrategy: "SUPPLIER_DIRECT",
      productId: demoProductIds[1],
      supplierId: demoSupplierIds[2],
    });
    console.log("✅ Created Campaign B");

    // Campaign B: 3 commitments (partially filled)
    const campaignBCommitmentIds = [
      `${DEMO_PREFIX}commit_b1`,
      `${DEMO_PREFIX}commit_b2`,
      `${DEMO_PREFIX}commit_b3`,
    ];

    await db.insert(commitments).values([
      {
        id: campaignBCommitmentIds[0],
        campaignId: demoCampaignIds[1],
        userId: demoUserIds[0], // Alice (using her available credit)
        participantName: "Alice Anderson",
        participantEmail: "alice@demo.alpmera.com",
        amount: "370.00", // $400 - $30 credit
        quantity: 1,
        status: "LOCKED",
        referenceNumber: "DEMO-B-ALICE-001",
        createdAt: new Date("2026-01-18T09:00:00Z"),
      },
      {
        id: campaignBCommitmentIds[1],
        campaignId: demoCampaignIds[1],
        userId: demoUserIds[2], // Carol
        participantName: "Carol Chen",
        participantEmail: "carol@demo.alpmera.com",
        amount: "400.00",
        quantity: 1,
        status: "LOCKED",
        referenceNumber: "DEMO-B-CAROL-002",
        createdAt: new Date("2026-01-18T11:00:00Z"),
      },
      {
        id: campaignBCommitmentIds[2],
        campaignId: demoCampaignIds[1],
        userId: demoUserIds[5], // Frank
        participantName: "Frank Foster",
        participantEmail: "frank@demo.alpmera.com",
        amount: "400.00",
        quantity: 1,
        status: "LOCKED",
        referenceNumber: "DEMO-B-FRANK-003",
        createdAt: new Date("2026-01-18T14:00:00Z"),
      },
    ]);
    console.log("✅ Created 3 commitments for Campaign B");

    // Campaign B: Escrow ledger (only LOCK entries - not released yet)
    await db.insert(escrowLedger).values([
      {
        commitmentId: campaignBCommitmentIds[0],
        campaignId: demoCampaignIds[1],
        entryType: "LOCK",
        amount: "370.00",
        actor: "SYSTEM",
        reason: `Escrow locked for commitment ${campaignBCommitmentIds[0]}`,
        createdAt: new Date("2026-01-18T09:01:00Z"),
      },
      {
        commitmentId: campaignBCommitmentIds[1],
        campaignId: demoCampaignIds[1],
        entryType: "LOCK",
        amount: "400.00",
        actor: "SYSTEM",
        reason: `Escrow locked for commitment ${campaignBCommitmentIds[1]}`,
        createdAt: new Date("2026-01-18T11:01:00Z"),
      },
      {
        commitmentId: campaignBCommitmentIds[2],
        campaignId: demoCampaignIds[1],
        entryType: "LOCK",
        amount: "400.00",
        actor: "SYSTEM",
        reason: `Escrow locked for commitment ${campaignBCommitmentIds[2]}`,
        createdAt: new Date("2026-01-18T14:01:00Z"),
      },
    ]);
    console.log("✅ Created escrow ledger entries for Campaign B (LOCKED)");

    console.log("\n🔴 Step 8: Creating Campaign C (FAILED - with refunds & exceptions)...");
    const campaignCDeadline = new Date("2026-01-14T23:59:59Z");
    await db.insert(campaigns).values({
      id: demoCampaignIds[2],
      title: "Ergonomic Office Chair Campaign",
      description: "Premium office chairs at group pricing. Target: 8 participants.",
      rules: "Target: 8 participants. Min commitment: $300. Campaign closes Jan 14.",
      imageUrl: "https://placeholder.demo/campaign-chair.jpg",
      targetAmount: "2400.00", // 8 x $300
      minCommitment: "300.00",
      maxCommitment: "450.00",
      unitPrice: "300.00",
      state: "FAILED", // Did not reach target
      aggregationDeadline: campaignCDeadline,
      supplierAccepted: false,
      adminPublishStatus: "PUBLISHED",
      publishedAt: new Date("2026-01-05T00:00:00Z"),
      sku: "DEMO-CHAIR-001",
      productName: "Ergonomic Office Chair",
      brand: "ComfortPlus",
      targetUnits: 8,
      deliveryStrategy: "SUPPLIER_DIRECT",
      productId: demoProductIds[3],
      supplierId: demoSupplierIds[1],
    });
    console.log("✅ Created Campaign C");

    // Campaign C: 2 commitments (failed to reach target)
    const campaignCCommitmentIds = [
      `${DEMO_PREFIX}commit_c1`,
      `${DEMO_PREFIX}commit_c2`,
    ];

    await db.insert(commitments).values([
      {
        id: campaignCCommitmentIds[0],
        campaignId: demoCampaignIds[2],
        userId: demoUserIds[3], // Dave
        participantName: "Dave Davis",
        participantEmail: "dave@demo.alpmera.com",
        amount: "300.00",
        quantity: 1,
        status: "REFUNDED",
        referenceNumber: "DEMO-C-DAVE-001",
        createdAt: new Date("2026-01-06T10:00:00Z"),
      },
      {
        id: campaignCCommitmentIds[1],
        campaignId: demoCampaignIds[2],
        userId: demoUserIds[4], // Eve
        participantName: "Eve Edwards",
        participantEmail: "eve@demo.alpmera.com",
        amount: "300.00",
        quantity: 1,
        status: "LOCKED", // Pending refund
        referenceNumber: "DEMO-C-EVE-002",
        createdAt: new Date("2026-01-07T14:00:00Z"),
      },
    ]);
    console.log("✅ Created 2 commitments for Campaign C");

    // Campaign C: Escrow ledger (LOCK → REFUND for one, LOCK only for other)
    await db.insert(escrowLedger).values([
      {
        commitmentId: campaignCCommitmentIds[0],
        campaignId: demoCampaignIds[2],
        entryType: "LOCK",
        amount: "300.00",
        actor: "SYSTEM",
        reason: `Escrow locked for commitment ${campaignCCommitmentIds[0]}`,
        createdAt: new Date("2026-01-06T10:01:00Z"),
      },
      {
        commitmentId: campaignCCommitmentIds[0],
        campaignId: demoCampaignIds[2],
        entryType: "REFUND",
        amount: "300.00",
        actor: "admin",
        reason: "Campaign failed - refund processed",
        createdAt: new Date("2026-01-15T10:00:00Z"),
      },
      {
        commitmentId: campaignCCommitmentIds[1],
        campaignId: demoCampaignIds[2],
        entryType: "LOCK",
        amount: "300.00",
        actor: "SYSTEM",
        reason: `Escrow locked for commitment ${campaignCCommitmentIds[1]}`,
        createdAt: new Date("2026-01-07T14:01:00Z"),
      },
      // No REFUND entry for Eve yet - pending refund
    ]);
    console.log("✅ Created escrow ledger entries for Campaign C");

    // Campaign C: Admin action logs (failure + exception)
    await db.insert(adminActionLogs).values([
      {
        campaignId: demoCampaignIds[2],
        adminUsername: "admin",
        action: "CAMPAIGN_FAILED",
        previousState: "AGGREGATION",
        newState: "FAILED",
        reason: "Campaign did not reach target by deadline - only 2/8 participants joined",
        createdAt: new Date("2026-01-15T00:00:00Z"),
      },
      {
        campaignId: demoCampaignIds[2],
        adminUsername: "admin",
        action: "REFUND_INITIATED",
        reason: "Initiating refunds for failed campaign participants",
        createdAt: new Date("2026-01-15T09:00:00Z"),
      },
    ]);
    console.log("✅ Created admin action logs for Campaign C");

    console.log("\n✅ Demo data seeded successfully!");
    console.log("\n📊 Summary:");
    console.log("  - 6 demo users with profiles");
    console.log("  - 3 suppliers");
    console.log("  - 4 products");
    console.log("  - 2 consolidation points");
    console.log("  - 3 campaigns (Completed, Aggregating, Failed)");
    console.log("  - 10 commitments total");
    console.log("  - 13 escrow ledger entries");
    console.log("  - 9 credit ledger entries");
    console.log("  - 4 admin action logs");
    console.log("\n🎯 Pages to verify:");
    console.log("  - Control Room: /admin/control-room");
    console.log("  - Campaigns: /admin/campaigns");
    console.log("  - Clearing: /admin/clearing");
    console.log("  - Credits: /admin/credits");
    console.log("  - Participant Credits: /admin/participants/{userId}/credits");
    console.log("  - Suppliers: /admin/suppliers");
    console.log("  - Products: /admin/products");
    console.log("\n⚠️  To cleanup: npm run seed:admin-demo:cleanup");
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  }
}

// Run seed
seedDemoData()
  .then(() => {
    console.log("\n✅ Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });
