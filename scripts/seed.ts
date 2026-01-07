import { db } from "../server/db";
import { campaigns, commitments, escrowLedger, adminActionLogs } from "../shared/schema";

async function seed() {
  console.log("Seeding database with 6 sample campaigns...");

  // Clear existing data
  await db.delete(escrowLedger);
  await db.delete(commitments);
  await db.delete(adminActionLogs);
  await db.delete(campaigns);

  const now = new Date();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const sampleCampaigns = [
    {
      title: "Bulk Solar Panel Purchase",
      description: "Collective purchase of high-efficiency solar panels for residential installation. By aggregating our buying power, we can negotiate better terms with the manufacturer and reduce individual costs.",
      rules: `CAMPAIGN RULES - SOLAR PANEL COLLECTIVE PURCHASE

1. ELIGIBILITY
   - Open to residents within the continental United States
   - Participants must have suitable roof space for installation
   - Professional site assessment required after campaign success

2. COMMITMENT TERMS
   - Minimum commitment: $2,500 (1 panel system)
   - Maximum commitment: $25,000 (10 panel system)
   - Unit price: $2,500 per panel system
   - All commitments are binding once confirmed

3. TARGET & TIMELINE
   - Campaign target: $250,000 total commitments
   - Aggregation period: 30 days from campaign start
   - If target not met by deadline, all funds refunded

4. FULFILLMENT
   - Upon success, manufacturer has 90 days to deliver
   - Installation scheduling handled individually
   - Funds released to supplier only after delivery confirmation

5. REFUND POLICY
   - Campaign failure: 100% refund within 5 business days
   - Quality issues: Dispute resolution through platform`,
      targetAmount: "250000.00",
      minCommitment: "2500.00",
      maxCommitment: "25000.00",
      unitPrice: "2500.00",
      state: "AGGREGATION" as const,
      aggregationDeadline: futureDate,
    },
    {
      title: "Organic Coffee Bean Import",
      description: "Direct import of certified organic coffee beans from a cooperative in Colombia. Bypassing traditional supply chains means fresher beans at fair prices for farmers.",
      rules: `CAMPAIGN RULES - ORGANIC COFFEE IMPORT

1. PRODUCT SPECIFICATION
   - Origin: Huila Region, Colombia
   - Certification: USDA Organic, Fair Trade
   - Roast: Green beans (unroasted), roasted on delivery
   - Packaging: 5lb vacuum-sealed bags

2. COMMITMENT TERMS
   - Minimum commitment: $75 (1 bag)
   - Maximum commitment: $750 (10 bags)
   - Unit price: $75 per 5lb bag
   - All prices include shipping

3. TARGET REQUIREMENTS
   - Campaign target: $15,000 (200 bags minimum order)
   - Aggregation period: 21 days
   - Cooperative requires minimum order quantity

4. DELIVERY
   - Estimated delivery: 45 days after campaign success
   - Roasted to order before shipping
   - Tracking provided for all shipments

5. QUALITY GUARANTEE
   - Cupping score: Minimum 84 points
   - Sample roasts available for quality verification
   - Full refund for quality issues below specification`,
      targetAmount: "15000.00",
      minCommitment: "75.00",
      maxCommitment: "750.00",
      unitPrice: "75.00",
      state: "AGGREGATION" as const,
      aggregationDeadline: futureDate,
    },
    {
      title: "Electric Cargo Bikes for Local Delivery",
      description: "Group purchase of commercial-grade electric cargo bikes for local businesses. Reduce delivery costs and environmental impact through collective buying.",
      rules: `CAMPAIGN RULES - ELECTRIC CARGO BIKE PURCHASE

1. SPECIFICATIONS
   - Model: Urban Cargo Pro E-Bike
   - Payload capacity: 300 lbs
   - Range: 60 miles per charge
   - Warranty: 2 years comprehensive

2. COMMITMENT TERMS
   - Unit price: $3,500 per bike
   - Minimum commitment: $3,500 (1 bike)
   - Maximum commitment: $17,500 (5 bikes)
   - Bulk discount reflected in unit price (normally $4,200)

3. CAMPAIGN REQUIREMENTS
   - Target: $70,000 (20 bikes minimum)
   - Aggregation deadline: 45 days
   - Manufacturer requires batch order

4. PICKUP & DELIVERY
   - Central pickup location after success
   - Optional delivery: $150 per bike within 50 miles
   - Assembly and orientation included

5. SUPPORT
   - Local dealer partnership for service
   - Spare parts availability guaranteed for 5 years
   - Training session for all participants`,
      targetAmount: "70000.00",
      minCommitment: "3500.00",
      maxCommitment: "17500.00",
      unitPrice: "3500.00",
      state: "SUCCESS" as const,
      aggregationDeadline: pastDate,
      supplierAccepted: true,
    },
    {
      title: "Artisan Olive Oil from Puglia",
      description: "Premium extra virgin olive oil directly from a family-owned estate in Puglia, Italy. Single-origin, cold-pressed, delivered fresh from the latest harvest.",
      rules: `CAMPAIGN RULES - ARTISAN OLIVE OIL IMPORT

1. PRODUCT DETAILS
   - Estate: Masseria del Vento, Puglia, Italy
   - Variety: Coratina olives (single estate)
   - Extraction: Cold-pressed within 4 hours of harvest
   - Acidity: < 0.3% (Extra Virgin certification)

2. PACKAGING OPTIONS
   - 750ml bottles: $45 each
   - 3L tin: $120 each
   - Minimum order: $45
   - Maximum order: $600

3. CAMPAIGN GOAL
   - Target: $12,000 minimum
   - This ensures bulk shipping costs are viable
   - Aggregation period: 28 days

4. SHIPPING & HANDLING
   - Temperature-controlled shipping from Italy
   - Estimated delivery: 6-8 weeks after success
   - Customs and import duties included in price

5. AUTHENTICITY
   - Certificate of origin provided
   - Lab analysis report available
   - Harvest date clearly marked on each container`,
      targetAmount: "12000.00",
      minCommitment: "45.00",
      maxCommitment: "600.00",
      unitPrice: "45.00",
      state: "AGGREGATION" as const,
      aggregationDeadline: futureDate,
    },
    {
      title: "Community Tool Library Equipment",
      description: "Collective purchase of high-quality power tools for a community tool library. Members can borrow tools instead of buying seldom-used equipment.",
      rules: `CAMPAIGN RULES - COMMUNITY TOOL LIBRARY

1. PURPOSE
   - Establishing shared tool library for neighborhood
   - Professional-grade tools available for member borrowing
   - Reduce individual ownership, increase access

2. CONTRIBUTION TIERS
   - Founding Member: $250 (lifetime borrowing privileges)
   - Supporter: $100 (1 year borrowing privileges)
   - Sponsor: $500+ (lifetime privileges + name recognition)

3. TOOL SELECTION
   - Circular saw, miter saw, drill press
   - Power sanders, routers, jigsaws
   - Specialized tools added based on demand
   - Maintenance supplies and safety equipment

4. CAMPAIGN REQUIREMENTS
   - Target: $8,000 for initial tool collection
   - Location secured at community center
   - Volunteer coordinators confirmed

5. GOVERNANCE
   - Member-run nonprofit structure
   - Democratic tool acquisition decisions
   - Insurance and liability coverage included`,
      targetAmount: "8000.00",
      minCommitment: "100.00",
      maxCommitment: "1000.00",
      unitPrice: "100.00",
      state: "FAILED" as const,
      aggregationDeadline: pastDate,
    },
    {
      title: "Sustainable Bamboo Furniture Set",
      description: "Handcrafted bamboo furniture from a certified sustainable workshop. Includes dining table, chairs, and storage pieces designed for longevity.",
      rules: `CAMPAIGN RULES - BAMBOO FURNITURE COLLECTIVE

1. PRODUCT LINE
   - Dining table (seats 6): $1,200
   - Chair set (4 chairs): $600
   - Sideboard/storage: $800
   - Coffee table: $400
   - All pieces use FSC-certified bamboo

2. ORDERING
   - Minimum order: $400 (any single piece)
   - Maximum order: $5,000 (multiple sets)
   - Mix and match pieces allowed

3. CRAFTSMANSHIP
   - Handcrafted by skilled artisans
   - Traditional joinery techniques (no nails/screws)
   - Natural oil finish, no synthetic coatings
   - Each piece numbered and signed

4. CAMPAIGN PARAMETERS
   - Target: $50,000 minimum order
   - Enables workshop to dedicate full production run
   - Aggregation period: 60 days

5. DELIVERY
   - White glove delivery included
   - Assembly-free (arrives fully constructed)
   - Estimated lead time: 90 days after campaign success
   - Inspection period: 14 days after delivery`,
      targetAmount: "50000.00",
      minCommitment: "400.00",
      maxCommitment: "5000.00",
      unitPrice: "400.00",
      state: "FULFILLMENT" as const,
      aggregationDeadline: pastDate,
      supplierAccepted: true,
    },
  ];

  for (const campaign of sampleCampaigns) {
    await db.insert(campaigns).values(campaign);
  }

  console.log("Seeding complete! Created 6 sample campaigns:");
  console.log("- 3 in AGGREGATION state (accepting commitments)");
  console.log("- 1 in SUCCESS state (target met, pending fulfillment)");
  console.log("- 1 in FAILED state (did not meet target)");
  console.log("- 1 in FULFILLMENT state (being delivered)");
}

seed()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
