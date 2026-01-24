import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { storage } from "./storage";
import { db } from "./db";
import { parseListQuery } from "./list-query-builder";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import {
  type CampaignState,
  type CommitmentStatus,
  VALID_TRANSITIONS,
  insertCommitmentSchema,
  updateUserProfileSchema,
  escrowLedger,
  commitments,
  campaigns,
  campaignAdminEvents,
  insertProductSchema,
  updateProductSchema,
  insertSupplierSchema,
  updateSupplierSchema,
  insertConsolidationPointSchema,
  updateConsolidationPointSchema,
  landingSubscribers,
  users,
  userProfiles
} from "@shared/schema";
import { z } from "zod";
import { and, asc, count, countDistinct, desc, eq, gte, ilike, isNotNull, isNull, lte, or, sql, sum } from "drizzle-orm";
import { createHash, randomBytes, randomInt, randomUUID } from "crypto";

// Auth request schemas
const authStartSchema = z.object({
  email: z.string().email("Valid email is required"),
});

const authVerifySchema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().length(6, "Code must be 6 digits"),
});

const LANDING_ALLOWED_TAGS = [
  "Electronics",
  "Home",
  "Kitchen",
  "Outdoors",
  "Fitness",
  "Kids",
  "Office",
  "Tools",
  "Pets",
  "Other"
];

const LANDING_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const LANDING_RATE_LIMIT_MAX = 10;
const landingRateLimit = new Map<string, { count: number; resetAt: number }>();

function isLandingRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = landingRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    landingRateLimit.set(ip, { count: 1, resetAt: now + LANDING_RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= LANDING_RATE_LIMIT_MAX) {
    return true;
  }
  entry.count += 1;
  return false;
}

// Generate a random 6-digit code
function generateAuthCode(): string {
  return String(randomInt(100000, 999999));
}

// Hash a code for storage (using SHA-256 with salt)
function hashAuthCode(code: string, salt: string): string {
  return createHash("sha256").update(code + salt).digest("hex");
}

// Generate a secure session token
function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Dev-only: Store codes in memory for test access (cleared on restart)
const devAuthCodes: Map<string, string> = new Map();

// Helper to compute request hash for idempotency verification
function computeRequestHash(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

// Commitment request schema with server-side validation
const commitmentRequestSchema = z.object({
  participantName: z.string().min(1, "Name is required"),
  participantEmail: z.string().email("Valid email is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

// Admin transition request schema
const transitionRequestSchema = z.object({
  newState: z.enum(["AGGREGATION", "SUCCESS", "FAILED", "FULFILLMENT", "RELEASED"]),
  reason: z.string().min(1, "Reason is required for audit trail"),
  adminUsername: z.string().min(1, "Admin username is required"),
});

// Reference price type for validation
interface ReferencePrice {
  amount: number;
  currency?: string;
  source: "MSRP" | "RETAILER_LISTING" | "SUPPLIER_QUOTE" | "OTHER";
  url?: string;
  capturedAt?: string;
  note?: string;
}

// Validate campaign is ready to publish
// Returns { ok: boolean, missing: string[] }
function validateCampaignPublishable(campaign: any): { ok: boolean; missing: string[] } {
  const missing: string[] = [];

  // Core required fields
  if (!campaign.title?.trim()) missing.push("campaignName");
  if (!campaign.sku?.trim()) missing.push("sku");
  if (!campaign.productName?.trim()) missing.push("productName");
  if (!campaign.aggregationDeadline) missing.push("aggregationDeadline");
  if (!campaign.targetAmount || parseFloat(campaign.targetAmount) <= 0) missing.push("targetAmount");
  if (!campaign.unitPrice || parseFloat(campaign.unitPrice) <= 0) missing.push("unitPrice");
  if (!campaign.minCommitment || parseFloat(campaign.minCommitment) <= 0) missing.push("minCommitment");
  if (!campaign.deliveryStrategy) missing.push("deliveryStrategy");

  // Image required
  if (!campaign.primaryImageUrl?.trim()) missing.push("primaryImageUrl");

  // Reference prices validation
  let referencePrices: ReferencePrice[] = [];
  if (campaign.referencePrices) {
    try {
      referencePrices = typeof campaign.referencePrices === "string"
        ? JSON.parse(campaign.referencePrices)
        : campaign.referencePrices;
    } catch {
      referencePrices = [];
    }
  }
  const validPrices = referencePrices.filter(p => p.amount && p.amount > 0 && p.source);
  if (validPrices.length === 0) missing.push("referencePrices");

  // Delivery strategy specific validation - BULK_TO_CONSOLIDATION requires consolidation details
  if (campaign.deliveryStrategy === "BULK_TO_CONSOLIDATION") {
    if (!campaign.consolidationCompany?.trim()) missing.push("consolidationCompanyName");
    if (!campaign.consolidationContactName?.trim()) missing.push("consolidationContactName");
    if (!campaign.consolidationContactEmail?.trim()) missing.push("consolidationContactEmail");
    if (!campaign.consolidationPhone?.trim()) missing.push("consolidationContactPhone");
    if (!campaign.consolidationAddressLine1?.trim()) missing.push("consolidationAddressLine1");
    if (!campaign.consolidationCity?.trim()) missing.push("consolidationCity");
    if (!campaign.consolidationState?.trim()) missing.push("consolidationState");
    if (!campaign.consolidationPostalCode?.trim()) missing.push("consolidationPostalCode");
    if (!campaign.consolidationCountry?.trim()) missing.push("consolidationCountry");
  }

  // Supplier direct requires confirmation
  if (campaign.deliveryStrategy === "SUPPLIER_DIRECT" && !campaign.supplierDirectConfirmed) {
    missing.push("supplierDirectConfirmed");
  }

  // Prerequisites validation (Phase 1.5)
  if (!campaign.productId) missing.push("productId");
  if (!campaign.supplierId) missing.push("supplierId");
  if (!campaign.consolidationPointId) missing.push("consolidationPointId");

  return { ok: missing.length === 0, missing };
}

// Normalize value for comparison (parse JSON strings, sort arrays)
function normalizeForComparison(val: any): string {
  if (val === null || val === undefined) return "null";
  if (typeof val === "string") {
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(sortObject(parsed));
    } catch {
      return val.trim();
    }
  }
  return JSON.stringify(sortObject(val));
}

// Sort objects/arrays for consistent comparison
function sortObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }
  if (obj && typeof obj === "object") {
    const sorted: any = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortObject(obj[key]);
    });
    return sorted;
  }
  return obj;
}

function getFirstGalleryImageUrl(value: unknown): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const first = value.find((url) => typeof url === "string" && url.trim().length > 0);
    return typeof first === "string" ? first.trim() : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const first = parsed.find((url) => typeof url === "string" && url.trim().length > 0);
        return typeof first === "string" ? first.trim() : null;
      }
    } catch {
      // Fall back to delimited values.
    }
    const first = trimmed.split(/[|,]/).map((url) => url.trim()).find(Boolean);
    return first || null;
  }
  return null;
}

// Get changed fields between old and new campaign data
function getChangedFields(oldData: any, newData: any): string[] {
  const changed: string[] = [];
  const compareFields = [
    "title", "description", "rules", "imageUrl", "targetAmount", "minCommitment",
    "maxCommitment", "unitPrice", "aggregationDeadline", "sku", "productName",
    "brand", "modelNumber", "variant", "shortDescription", "specs",
    "primaryImageUrl", "galleryImageUrls", "referencePrices", "deliveryStrategy",
    "deliveryCostHandling", "supplierDirectConfirmed", "consolidationContactName",
    "consolidationCompany", "consolidationContactEmail", "consolidationAddressLine1",
    "consolidationAddressLine2", "consolidationCity", "consolidationState",
    "consolidationPostalCode", "consolidationCountry", "consolidationPhone",
    "deliveryWindow", "fulfillmentNotes"
  ];

  for (const field of compareFields) {
    if (newData[field] !== undefined) {
      const oldVal = normalizeForComparison(oldData[field]);
      const newVal = normalizeForComparison(newData[field]);
      if (oldVal !== newVal) {
        changed.push(field);
      }
    }
  }

  return changed;
}

// Locked fields when campaign is PUBLISHED
const PUBLISHED_LOCKED_FIELDS = [
  "title", "sku", "productName", "aggregationDeadline",
  "targetAmount", "unitPrice", "minCommitment"
];

// Admin authentication middleware
// SECURITY: STRICT enforcement - NO dev mode bypass allowed
// All /api/admin/* endpoints require one of:
// 1. Valid admin session (from /api/admin/login), OR
// 2. x-admin-auth header matching ADMIN_API_KEY exactly
// All admin access attempts are logged for audit trail
const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminHeader = req.headers["x-admin-auth"] as string | undefined;
  const adminApiKey = process.env.ADMIN_API_KEY;

  // SECURITY CHECK 1: ADMIN_API_KEY must be configured
  if (!adminApiKey) {
    console.error(`[SECURITY] ADMIN_API_KEY not configured - admin endpoints disabled`);
    return res.status(503).json({
      error: "Admin endpoints disabled",
      message: "Admin endpoints disabled: ADMIN_API_KEY not configured"
    });
  }

  // AUTH METHOD 1: Check for valid admin session
  if (req.session?.isAdmin === true) {
    console.log(`[ADMIN] Authenticated access via session: ${req.method} ${req.path}`);
    return next();
  }

  // AUTH METHOD 2: Check x-admin-auth header
  if (adminHeader) {
    if (adminHeader === adminApiKey) {
      console.log(`[ADMIN] Authenticated access via API key: ${req.method} ${req.path}`);
      return next();
    } else {
      console.warn(`[SECURITY] Invalid admin API key attempt: ${req.method} ${req.path} from ${req.ip}`);
      return res.status(401).json({
        error: "Admin authentication failed",
        message: "Invalid admin credentials. This attempt has been logged."
      });
    }
  }

  // No valid authentication method found
  console.warn(`[SECURITY] Missing admin auth: ${req.method} ${req.path} from ${req.ip}`);
  return res.status(401).json({
    error: "Admin authentication required",
    message: "Please log in or provide valid admin credentials."
  });
};

// User authentication middleware
// Checks for valid user session via alpmera_user cookie
const requireUserAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionToken = req.cookies?.alpmera_user;

  if (!sessionToken) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please log in to access this resource."
    });
  }

  try {
    const session = await storage.getUserSession(sessionToken);

    if (!session) {
      return res.status(401).json({
        error: "Invalid session",
        message: "Your session is invalid. Please log in again."
      });
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await storage.deleteUserSession(sessionToken);
      return res.status(401).json({
        error: "Session expired",
        message: "Your session has expired. Please log in again."
      });
    }

    // Attach user info to request for downstream handlers
    (req as any).userId = session.userId;
    (req as any).sessionToken = sessionToken;

    next();
  } catch (error) {
    console.error("[AUTH] Session verification error:", error);
    return res.status(500).json({
      error: "Authentication error",
      message: "An error occurred during authentication."
    });
  }
};

// ============================================
// HEALTH CHECK HELPERS
// ============================================

// Compute version and commit once at startup
let appVersion = "unknown";
try {
  const packageJsonPath = join(process.cwd(), "package.json");
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    appVersion = packageJson.version || "unknown";
  }
} catch (e) {
  console.error("[HEALTH] Failed to read package.json version", e);
}

let appCommit = process.env.GIT_COMMIT || "unknown";
if (appCommit === "unknown") {
  try {
    // attempt git rev-parse --short HEAD
    // stdio ignore to prevent error output if git is not present/fails
    const gitOutput = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1000 // avoid hanging
    });
    appCommit = gitOutput.trim();
  } catch (e) {
    // ignore git error, fallback to unknown
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check endpoint
  // Must be public (no auth) and not hit DB
  app.get("/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      ok: true,
      service: "alpmera-api",
      env: process.env.APP_ENV || process.env.NODE_ENV || "unknown",
      version: appVersion,
      commit: appCommit,
      uptimeSeconds: Math.floor(process.uptime())
    });
  });

  // Landing subscriber count (public)
  app.get("/api/landing/subscriber-count", async (req, res) => {
    try {
      const result = await db
        .select({ count: count() })
        .from(landingSubscribers)
        .where(eq(landingSubscribers.status, "active"));

      return res.json({ count: result[0]?.count || 0 });
    } catch (error) {
      log(`Error fetching subscriber count: ${error}`);
      return res.status(500).json({ error: "Failed to fetch count" });
    }
  });

  // Landing notify (public)
  app.post("/api/landing/notify", async (req, res) => {
    try {
      const forwardedFor = req.headers["x-forwarded-for"];
      const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
        ?.split(",")[0]
        ?.trim() || req.ip || "unknown";

      if (isLandingRateLimited(ip)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }

      const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!rawEmail || !emailRegex.test(rawEmail)) {
        return res.status(400).json({ error: "Valid email is required" });
      }

      const rawTags = Array.isArray(req.body?.interestTags) ? req.body.interestTags : [];
      const normalizedTags = rawTags
        .filter((tag: unknown) => typeof tag === "string")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      const invalidTags = normalizedTags.filter((tag) => !LANDING_ALLOWED_TAGS.includes(tag));
      if (invalidTags.length > 0) {
        return res.status(400).json({ error: "Invalid interest tags" });
      }

      const notesRaw = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
      if (notesRaw.length > 500) {
        return res.status(400).json({ error: "Notes must be 500 characters or less" });
      }

      let recommendationOptIn = false;
      if (typeof req.body?.recommendationOptIn === "boolean") {
        recommendationOptIn = req.body.recommendationOptIn;
      } else if (typeof req.body?.recommendationOptIn === "string") {
        recommendationOptIn = req.body.recommendationOptIn.toLowerCase() === "true";
      }

      const now = new Date();
      const interestTags = normalizedTags.length > 0 ? normalizedTags : null;
      const notes = notesRaw.length > 0 ? notesRaw : null;

      const existing = await db
        .select({ id: landingSubscribers.id, status: landingSubscribers.status })
        .from(landingSubscribers)
        .where(eq(landingSubscribers.email, rawEmail))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(landingSubscribers).values({
          email: rawEmail,
          status: "active",
          source: "alpmera.com",
          interestTags,
          notes,
          recommendationOptIn,
          createdAt: now,
          unsubscribedAt: null,
          lastSubmittedAt: now,
        });
      } else {
        const existingRecord = existing[0];
        await db
          .update(landingSubscribers)
          .set({
            status: "active",
            unsubscribedAt: null,
            interestTags,
            notes,
            recommendationOptIn,
            lastSubmittedAt: now,
          })
          .where(eq(landingSubscribers.id, existingRecord.id));
      }

      return res.json({ ok: true });
    } catch (error) {
      console.error("Error handling landing notify:", error);
      return res.status(500).json({ error: "Failed to process request" });
    }
  });

  // Landing form submission proxy (public)
  app.post("/api/landing/submit-form", async (req, res) => {
    try {
      const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

      if (!GOOGLE_SCRIPT_URL) {
        console.error('GOOGLE_SCRIPT_URL environment variable not configured');
        return res.status(500).json({ success: false, error: 'Form not configured' });
      }

      // Forward the request to Google Apps Script
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const result = await response.json();
      return res.json(result);
    } catch (error) {
      console.error("Error proxying to Google Apps Script:", error);
      return res.status(500).json({ success: false, error: 'Network error. Please try again.' });
    }
  });

  // ============================================
  // ADMIN SECURITY BARRIER
  // ============================================
  // Enforce admin authentication for ALL /api/admin routes
  // Except explicit allowlist (login/logout/session checks)
  app.use("/api/admin", (req, res, next) => {
    const path = req.path.replace(/\/$/, ""); // trim trailing slash
    if (["/login", "/logout", "/session"].includes(path)) {
      return next();
    }
    requireAdminAuth(req, res, next);
  });

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Admin login - validates API key and creates session
  app.post("/api/admin/login", (req, res) => {
    const { apiKey, username } = req.body;
    const adminApiKey = process.env.ADMIN_API_KEY;

    if (!adminApiKey) {
      console.error(`[SECURITY] ADMIN_API_KEY not configured`);
      return res.status(503).json({
        error: "Admin login disabled",
        message: "Admin API key not configured"
      });
    }

    if (!apiKey || apiKey !== adminApiKey) {
      console.warn(`[SECURITY] Failed admin login attempt from ${req.ip}`);
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid admin credentials"
      });
    }

    // Create admin session
    req.session.isAdmin = true;
    req.session.adminUsername = username || "admin";

    // CRITICAL: Save session before responding to ensure session is persisted
    // This prevents race condition where frontend checks session before it's saved
    req.session.save((err) => {
      if (err) {
        console.error(`[ADMIN] Session save error:`, err);
        return res.status(500).json({
          error: "Login failed",
          message: "Failed to create admin session"
        });
      }

      console.log(`[ADMIN] Successful login: ${req.session.adminUsername} from ${req.ip}`);
      res.json({
        success: true,
        message: "Admin logged in successfully",
        username: req.session.adminUsername
      });
    });
  });

  // Admin logout - destroys session
  app.post("/api/admin/logout", (req, res) => {
    const username = req.session?.adminUsername || "unknown";
    req.session.destroy((err) => {
      if (err) {
        console.error(`[ADMIN] Logout error:`, err);
        return res.status(500).json({ error: "Logout failed" });
      }
      console.log(`[ADMIN] Logout: ${username}`);
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // ============================================
  // ADMIN CREDIT LEDGER (Protected, Read-Only)
  // ============================================

  // LIST CREDIT LEDGER ENTRIES
  app.get("/api/admin/credits", requireAdminAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          created_desc: "created_desc",
        },
        defaultSort: "created_desc",
      });

      const participantId = typeof req.query.participantId === "string" ? req.query.participantId.trim() : undefined;
      const campaignId = typeof req.query.campaignId === "string" ? req.query.campaignId.trim() : undefined;
      const eventTypeRaw = typeof req.query.eventType === "string" ? req.query.eventType.trim() : listQuery.params.status;
      const eventType = eventTypeRaw && eventTypeRaw !== "all" ? eventTypeRaw : undefined;

      const conditions: any[] = [];
      if (participantId) {
        conditions.push(eq(creditLedgerEntries.participantId, participantId));
      }
      if (campaignId) {
        conditions.push(eq(creditLedgerEntries.campaignId, campaignId));
      }
      if (eventType) {
        conditions.push(eq(creditLedgerEntries.eventType, eventType as any));
      }
      if (listQuery.params.search) {
        const searchValue = `%${listQuery.params.search}%`;
        conditions.push(
          or(
            ilike(creditLedgerEntries.participantId, searchValue),
            ilike(users.email, searchValue)
          )
        );
      }
      if (listQuery.params.createdFrom) {
        const fromDate = new Date(listQuery.params.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        conditions.push(gte(creditLedgerEntries.createdAt, fromDate));
      }
      if (listQuery.params.createdTo) {
        const toDate = new Date(listQuery.params.createdTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(creditLedgerEntries.createdAt, toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: count() })
        .from(creditLedgerEntries)
        .leftJoin(users, eq(creditLedgerEntries.participantId, users.id))
        .where(whereClause);

      const rows = await db
        .select({
          id: creditLedgerEntries.id,
          participantId: creditLedgerEntries.participantId,
          participantEmail: users.email,
          eventType: creditLedgerEntries.eventType,
          amount: creditLedgerEntries.amount,
          currency: creditLedgerEntries.currency,
          campaignId: creditLedgerEntries.campaignId,
          campaignName: campaigns.title,
          reason: creditLedgerEntries.reason,
          createdAt: creditLedgerEntries.createdAt,
        })
        .from(creditLedgerEntries)
        .leftJoin(users, eq(creditLedgerEntries.participantId, users.id))
        .leftJoin(campaigns, eq(creditLedgerEntries.campaignId, campaigns.id))
        .where(whereClause)
        .orderBy(desc(creditLedgerEntries.createdAt), desc(creditLedgerEntries.id))
        .limit(listQuery.limit)
        .offset(listQuery.offset);

      res.json({
        rows,
        total: countResult?.count || 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
          participantId: participantId || null,
          campaignId: campaignId || null,
          eventType: eventType || null,
        },
      });
    } catch (error) {
      console.error("[ADMIN] Error listing credit ledger entries:", error);
      res.status(500).json({ error: "Failed to list credit ledger entries" });
    }
  });

  // GET CREDIT LEDGER ENTRY DETAIL
  app.get("/api/admin/credits/:id", requireAdminAuth, async (req, res) => {
    try {
      const entry = await storage.getCreditLedgerEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Credit ledger entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("[ADMIN] Error getting credit ledger entry:", error);
      res.status(500).json({ error: "Failed to get credit ledger entry" });
    }
  });

  // GET PARTICIPANT CREDIT BALANCE
  app.get("/api/admin/credits/participant/:participantId/balance", requireAdminAuth, async (req, res) => {
    try {
      const balance = await storage.getParticipantCreditBalance(req.params.participantId);
      res.json({ balance: balance.toFixed(2), currency: "USD" });
    } catch (error) {
      console.error("[ADMIN] Error getting participant credit balance:", error);
      res.status(500).json({ error: "Failed to get participant credit balance" });
    }
  });

  // GET PARTICIPANT CREDIT SUMMARY
  app.get("/api/admin/credits/participant/:participantId/summary", requireAdminAuth, async (req, res) => {
    try {
      const summary = await storage.getParticipantCreditSummary(req.params.participantId);
      res.json(summary);
    } catch (error) {
      if (error instanceof Error && error.message === "Participant not found") {
        res.status(404).json({ error: "Participant not found" });
      } else {
        console.error("[ADMIN] Error getting participant credit summary:", error);
        res.status(500).json({ error: "Failed to get participant credit summary" });
      }
    }
  });

  // ============================================
  // ADMIN PARTICIPANT MANAGEMENT (Protected)
  // ============================================

  // LIST PARTICIPANTS (search + pagination)
  app.get("/api/admin/participants", requireAdminAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          created_desc: "created_desc",
        },
        defaultSort: "created_desc",
      });

      const conditions: any[] = [];
      if (listQuery.params.search) {
        const searchValue = `%${listQuery.params.search}%`;
        conditions.push(
          or(
            ilike(users.id, searchValue),
            ilike(users.email, searchValue),
            ilike(userProfiles.fullName, searchValue)
          )
        );
      }
      if (listQuery.params.createdFrom) {
        const fromDate = new Date(listQuery.params.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        conditions.push(gte(users.createdAt, fromDate));
      }
      if (listQuery.params.createdTo) {
        const toDate = new Date(listQuery.params.createdTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(users.createdAt, toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: count() })
        .from(users)
        .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(whereClause);

      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: userProfiles.fullName,
          createdAt: users.createdAt,
          phoneNumber: userProfiles.phone,
        })
        .from(users)
        .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(whereClause)
        .orderBy(desc(users.createdAt), desc(users.id))
        .limit(listQuery.limit)
        .offset(listQuery.offset);

      res.json({
        rows,
        total: countResult?.count || 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: listQuery.filtersApplied,
      });
    } catch (error) {
      console.error("[ADMIN] Error listing participants:", error);
      res.status(500).json({ error: "Failed to list participants" });
    }
  });

  // GET PARTICIPANT DETAIL (identity + summary)
  app.get("/api/admin/participants/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Get user identity
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: userProfiles.fullName,
          phoneNumber: userProfiles.phone,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(eq(users.id, id));

      if (!user) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Get user profile if exists
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, id));

      // Get summary statistics
      // 1. Active commitments count
      const [activeCommitmentsResult] = await db
        .select({ count: count() })
        .from(commitments)
        .where(
          and(
            eq(commitments.userId, id),
            eq(commitments.status, "LOCKED")
          )
        );

      // 2. Total committed to escrow (lifetime)
      const [totalEscrowResult] = await db
        .select({ total: sum(escrowLedger.amount) })
        .from(escrowLedger)
        .innerJoin(commitments, eq(escrowLedger.commitmentId, commitments.id))
        .where(
          and(
            eq(commitments.userId, id),
            eq(escrowLedger.entryType, "LOCK")
          )
        );

      // 3. Credit balance (use existing summary endpoint logic)
      let creditSummary = null;
      try {
        creditSummary = await storage.getParticipantCreditSummary(id);
      } catch (error) {
        // Participant may not have credits yet
        console.log(`[ADMIN] No credit summary for participant ${id}`);
      }

      // 4. Refunds pending count
      const [refundsPendingResult] = await db
        .select({ count: count() })
        .from(escrowLedger)
        .innerJoin(commitments, eq(escrowLedger.commitmentId, commitments.id))
        .where(
          and(
            eq(commitments.userId, id),
            eq(escrowLedger.entryType, "REFUND")
          )
        );

      res.json({
        identity: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt,
          profile: profile || null,
        },
        summary: {
          activeCommitmentsCount: activeCommitmentsResult?.count || 0,
          totalCommittedEscrow: totalEscrowResult?.total || "0",
          creditBalance: creditSummary?.totalBalance || "0",
          creditCurrency: creditSummary?.currency || "USD",
          refundsPending: refundsPendingResult?.count || 0,
        },
      });
    } catch (error) {
      console.error("[ADMIN] Error getting participant detail:", error);
      res.status(500).json({ error: "Failed to get participant detail" });
    }
  });

  // GET PARTICIPANT COMMITMENTS
  app.get("/api/admin/participants/:id/commitments", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = "50", offset = "0" } = req.query;

      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      const participantCommitments = await db
        .select({
          id: commitments.id,
          referenceNumber: commitments.referenceNumber,
          campaignId: commitments.campaignId,
          campaignTitle: campaigns.title,
          quantity: commitments.quantity,
          amount: commitments.amount,
          status: commitments.status,
          createdAt: commitments.createdAt,
        })
        .from(commitments)
        .leftJoin(campaigns, eq(commitments.campaignId, campaigns.id))
        .where(eq(commitments.userId, id))
        .orderBy(
          sql`case when ${commitments.status} = 'LOCKED' then 0 else 1 end`,
          desc(commitments.createdAt)
        )
        .limit(limitNum)
        .offset(offsetNum);

      const [countResult] = await db
        .select({ count: count() })
        .from(commitments)
        .where(eq(commitments.userId, id));

      res.json({
        commitments: participantCommitments,
        total: countResult?.count || 0,
        limit: limitNum,
        offset: offsetNum,
      });
    } catch (error) {
      console.error("[ADMIN] Error getting participant commitments:", error);
      res.status(500).json({ error: "Failed to get participant commitments" });
    }
  });

  // GET PARTICIPANT REFUNDS
  app.get("/api/admin/participants/:id/refunds", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const participantRefunds = await db
        .select({
          id: escrowLedger.id,
          amount: escrowLedger.amount,
          createdAt: escrowLedger.createdAt,
          reason: escrowLedger.reason,
          campaignId: escrowLedger.campaignId,
          commitmentId: escrowLedger.commitmentId,
        })
        .from(escrowLedger)
        .innerJoin(commitments, eq(escrowLedger.commitmentId, commitments.id))
        .where(
          and(
            eq(commitments.userId, id),
            eq(escrowLedger.entryType, "REFUND")
          )
        )
        .orderBy(desc(escrowLedger.createdAt))
        .limit(50);

      // Enrich with campaign and commitment details
      const enriched = await Promise.all(
        participantRefunds.map(async (refund) => {
          const [campaign] = await db
            .select({ title: campaigns.title })
            .from(campaigns)
            .where(eq(campaigns.id, refund.campaignId));

          const [commitment] = await db
            .select({ referenceNumber: commitments.referenceNumber })
            .from(commitments)
            .where(eq(commitments.id, refund.commitmentId));

          return {
            ...refund,
            campaignTitle: campaign?.title || "Unknown",
            commitmentReference: commitment?.referenceNumber || "Unknown",
          };
        })
      );

      res.json({ refunds: enriched });
    } catch (error) {
      console.error("[ADMIN] Error getting participant refunds:", error);
      res.status(500).json({ error: "Failed to get participant refunds" });
    }
  });

  // ============================================
  // ADMIN COMMITMENTS (High-volume list + detail)
  // ============================================

  app.get("/api/admin/commitments", requireAdminAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          status_created_desc: "status_created_desc",
        },
        defaultSort: "status_created_desc",
      });

      const campaignId = typeof req.query.campaignId === "string" ? req.query.campaignId.trim() : undefined;

      const conditions: any[] = [];
      if (listQuery.params.status) {
        conditions.push(eq(commitments.status, listQuery.params.status as any));
      }
      if (campaignId) {
        conditions.push(eq(commitments.campaignId, campaignId));
      }
      if (listQuery.params.search) {
        const searchValue = `%${listQuery.params.search}%`;
        conditions.push(
          or(
            ilike(commitments.referenceNumber, searchValue),
            ilike(commitments.participantEmail, searchValue),
            ilike(commitments.participantName, searchValue),
            ilike(commitments.id, searchValue)
          )
        );
      }
      if (listQuery.params.createdFrom) {
        const fromDate = new Date(listQuery.params.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        conditions.push(gte(commitments.createdAt, fromDate));
      }
      if (listQuery.params.createdTo) {
        const toDate = new Date(listQuery.params.createdTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(commitments.createdAt, toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: commitments.id,
          referenceNumber: commitments.referenceNumber,
          participantName: commitments.participantName,
          participantEmail: commitments.participantEmail,
          campaignId: commitments.campaignId,
          campaignTitle: campaigns.title,
          quantity: commitments.quantity,
          amount: commitments.amount,
          status: commitments.status,
          createdAt: commitments.createdAt,
        })
        .from(commitments)
        .leftJoin(campaigns, eq(commitments.campaignId, campaigns.id))
        .where(whereClause)
        .orderBy(
          sql`case when ${commitments.status} = 'LOCKED' then 0 else 1 end`,
          desc(commitments.createdAt),
          desc(commitments.id)
        )
        .limit(listQuery.limit)
        .offset(listQuery.offset);

      const [countResult] = await db
        .select({ count: count() })
        .from(commitments)
        .where(whereClause);

      res.json({
        rows,
        total: countResult?.count || 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
          campaignId: campaignId || null,
        },
      });
    } catch (error) {
      console.error("[ADMIN] Error listing commitments:", error);
      res.status(500).json({ error: "Failed to list commitments" });
    }
  });

  app.get("/api/admin/commitments/:id", requireAdminAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const { id } = req.params;
      const [commitment] = await db
        .select({
          id: commitments.id,
          referenceNumber: commitments.referenceNumber,
          participantName: commitments.participantName,
          participantEmail: commitments.participantEmail,
          userId: commitments.userId,
          campaignId: commitments.campaignId,
          campaignTitle: campaigns.title,
          quantity: commitments.quantity,
          amount: commitments.amount,
          status: commitments.status,
          createdAt: commitments.createdAt,
        })
        .from(commitments)
        .leftJoin(campaigns, eq(commitments.campaignId, campaigns.id))
        .where(eq(commitments.id, id))
        .limit(1);

      if (!commitment) {
        return res.status(404).json({ error: "Commitment not found" });
      }

      res.json(commitment);
    } catch (error) {
      console.error("[ADMIN] Error getting commitment detail:", error);
      res.status(500).json({ error: "Failed to get commitment detail" });
    }
  });

  // ============================================
  // ADMIN SUPPLIER MANAGEMENT (Protected)
  // ============================================

  // LIST SUPPLIERS (HVLC)
  app.get("/api/admin/suppliers", requireAdminAuth, async (req, res) => {
    try {
      if (req.query.mode === "legacy") {
        const suppliers = await storage.getSuppliers();
        return res.json(suppliers);
      }

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          name_asc: "name_asc",
          name_desc: "name_desc",
          status_asc: "status_asc",
          status_desc: "status_desc",
          created_asc: "created_asc",
          created_desc: "created_desc",
        },
        defaultSort: "created_desc",
      });

      const conditions: any[] = [];
      if (listQuery.params.status) {
        conditions.push(eq(suppliers.status, listQuery.params.status as any));
      }
      if (listQuery.params.search) {
        const searchValue = `%${listQuery.params.search}%`;
        conditions.push(
          or(
            ilike(suppliers.name, searchValue),
            ilike(suppliers.contactName, searchValue),
            ilike(suppliers.contactEmail, searchValue),
            ilike(suppliers.phone, searchValue)
          )
        );
      }
      if (listQuery.params.createdFrom) {
        const fromDate = new Date(listQuery.params.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        conditions.push(gte(suppliers.createdAt, fromDate));
      }
      if (listQuery.params.createdTo) {
        const toDate = new Date(listQuery.params.createdTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(suppliers.createdAt, toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: count(suppliers.id) })
        .from(suppliers)
        .where(whereClause);

      let orderByClause = [desc(suppliers.createdAt), desc(suppliers.id)];
      switch (listQuery.sortApplied) {
        case "name_asc":
          orderByClause = [asc(suppliers.name), desc(suppliers.createdAt), desc(suppliers.id)];
          break;
        case "name_desc":
          orderByClause = [desc(suppliers.name), desc(suppliers.createdAt), desc(suppliers.id)];
          break;
        case "status_asc":
          orderByClause = [asc(suppliers.status), desc(suppliers.createdAt), desc(suppliers.id)];
          break;
        case "status_desc":
          orderByClause = [desc(suppliers.status), desc(suppliers.createdAt), desc(suppliers.id)];
          break;
        case "created_asc":
          orderByClause = [asc(suppliers.createdAt), desc(suppliers.id)];
          break;
        default:
          break;
      }

      const rows = await db
        .select({
          id: suppliers.id,
          name: suppliers.name,
          contactName: suppliers.contactName,
          contactEmail: suppliers.contactEmail,
          phone: suppliers.phone,
          website: suppliers.website,
          region: suppliers.region,
          status: suppliers.status,
          createdAt: suppliers.createdAt,
        })
        .from(suppliers)
        .where(whereClause)
        .orderBy(...orderByClause)
        .limit(listQuery.limit)
        .offset(listQuery.offset);

      res.json({
        rows,
        total: countResult?.count || 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
        },
      });
    } catch (error) {
      console.error("[ADMIN] Error listing suppliers:", error);
      res.status(500).json({ error: "Failed to list suppliers" });
    }
  });

  // CREATE SUPPLIER
  app.post("/api/admin/suppliers", requireAdminAuth, async (req, res) => {
    try {
      const parsed = insertSupplierSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid supplier data",
          details: parsed.error.flatten()
        });
      }

      const supplier = await storage.createSupplier(parsed.data);
      console.log(`[ADMIN] Created supplier: ${supplier.id} (${supplier.name})`);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("[ADMIN] Error creating supplier:", error);
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  // GET SUPPLIER BY ID
  app.get("/api/admin/suppliers/:id", requireAdminAuth, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier" });
    }
  });

  // UPDATE SUPPLIER
  app.patch("/api/admin/suppliers/:id", requireAdminAuth, async (req, res) => {
    try {
      console.log(`[ADMIN] UPDATING SUPPLIER ${req.params.id} ...`);
      console.log(`[ADMIN] RAW BODY:`, JSON.stringify(req.body, null, 2));

      const parsed = updateSupplierSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error("[ADMIN] Validation failed:", parsed.error.format());
        return res.status(400).json({
          error: "Invalid update data",
          details: parsed.error.flatten()
        });
      }

      console.log(`[ADMIN] PARSED DATA:`, JSON.stringify(parsed.data, null, 2));
      const updated = await storage.updateSupplier(req.params.id, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      console.log(`[ADMIN] DB RESULT:`, JSON.stringify(updated, null, 2));
      res.json(updated);
    } catch (error) {
      console.error("[ADMIN] Error updating supplier:", error);
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  // ARCHIVE SUPPLIER
  app.delete("/api/admin/suppliers/:id", requireAdminAuth, async (req, res) => {
    try {
      const archived = await storage.archiveSupplier(req.params.id);
      if (!archived) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(archived);
    } catch (error) {
      console.error("[ADMIN] Error archiving supplier:", error);
      res.status(500).json({ error: "Failed to archive supplier" });
    }
  });

  // BULK IMPORT SUPPLIERS (CSV)
  app.post("/api/admin/suppliers/bulk", requireAdminAuth, async (req, res) => {
    try {
      const supplierRows = req.body;

      if (!Array.isArray(supplierRows) || supplierRows.length === 0) {
        return res.status(400).json({ error: "Suppliers array is required" });
      }

      const results = {
        total: supplierRows.length,
        successful: 0,
        errors: 0,
        details: [] as { row: number; name: string; status: string; success: boolean; error?: string }[],
      };

      for (let i = 0; i < supplierRows.length; i++) {
        const row = supplierRows[i];
        const rowNum = i + 1;

        try {
          if (!row.name?.trim()) {
            results.errors++;
            results.details.push({ row: rowNum, name: "", status: "", success: false, error: "Name is required" });
            continue;
          }

          const supplierData = {
            name: row.name.trim(),
            contactName: row.contactName?.trim() || null,
            contactEmail: row.contactEmail?.trim() || null,
            phone: row.phone?.trim() || null,
            website: row.website?.trim() || null,
            region: row.region?.trim() || null,
            notes: row.notes?.trim() || null,
            status: row.status?.trim() || "ACTIVE",
          };

          const parsed = insertSupplierSchema.safeParse(supplierData);
          if (!parsed.success) {
            results.errors++;
            results.details.push({ row: rowNum, name: row.name, status: supplierData.status, success: false, error: parsed.error.errors[0]?.message || "Validation failed" });
            continue;
          }

          await storage.createSupplier(parsed.data);
          results.successful++;
          results.details.push({ row: rowNum, name: row.name, status: supplierData.status, success: true });
        } catch (err: any) {
          results.errors++;
          results.details.push({ row: rowNum, name: row.name || "", status: "", success: false, error: err.message || "Unknown error" });
        }
      }

      return res.json(results);
    } catch (error) {
      console.error("[ADMIN] Error in bulk supplier import:", error);
      return res.status(500).json({ error: "Failed to process bulk import" });
    }
  });


  // ============================================
  // ADMIN CONSOLIDATION POINTS (Protected)
  // ============================================

  // LIST CONSOLIDATION POINTS
  app.get("/api/admin/consolidation-points", async (req, res) => {
    try {
      const points = await storage.getConsolidationPoints();
      res.json(points);
    } catch (error) {
      console.error("[ADMIN] Error listing consolidation points:", error);
      res.status(500).json({ error: "Failed to list consolidation points" });
    }
  });

  // CREATE CONSOLIDATION POINT
  app.post("/api/admin/consolidation-points", async (req, res) => {
    try {
      const parsed = insertConsolidationPointSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid consolidation point data",
          details: parsed.error.flatten()
        });
      }

      const point = await storage.createConsolidationPoint(parsed.data);
      res.status(201).json(point);
    } catch (error) {
      console.error("[ADMIN] Error creating consolidation point:", error);
      res.status(500).json({ error: "Failed to create consolidation point" });
    }
  });

  // GET CONSOLIDATION POINT BY ID
  app.get("/api/admin/consolidation-points/:id", async (req, res) => {
    try {
      const point = await storage.getConsolidationPoint(req.params.id);
      if (!point) {
        return res.status(404).json({ error: "Consolidation point not found" });
      }
      res.json(point);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consolidation point" });
    }
  });

  // UPDATE CONSOLIDATION POINT
  app.patch("/api/admin/consolidation-points/:id", async (req, res) => {
    try {
      console.log(`[ADMIN] UPDATING CONSOLIDATION POINT ${req.params.id} ...`);
      console.log(`[ADMIN] RAW BODY:`, JSON.stringify(req.body, null, 2));

      const parsed = updateConsolidationPointSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error("[ADMIN] Validation failed:", parsed.error.format());
        return res.status(400).json({
          error: "Invalid update data",
          details: parsed.error.flatten()
        });
      }

      console.log(`[ADMIN] PARSED DATA:`, JSON.stringify(parsed.data, null, 2));
      const updated = await storage.updateConsolidationPoint(req.params.id, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: "Consolidation point not found" });
      }

      console.log(`[ADMIN] DB RESULT:`, JSON.stringify(updated, null, 2));
      res.json(updated);
    } catch (error) {
      console.error("[ADMIN] Error updating consolidation point:", error);
      res.status(500).json({ error: "Failed to update consolidation point" });
    }
  });

  // ARCHIVE CONSOLIDATION POINT
  app.delete("/api/admin/consolidation-points/:id", async (req, res) => {
    try {
      const archived = await storage.archiveConsolidationPoint(req.params.id);
      if (!archived) {
        return res.status(404).json({ error: "Consolidation point not found" });
      }
      console.log(`[ADMIN] Archived consolidation point: ${archived.id}`);
      res.json({ success: true, message: "Consolidation point archived" });
    } catch (error) {
      console.error("[ADMIN] Error archiving consolidation point:", error);
      res.status(500).json({ error: "Failed to archive consolidation point" });
    }
  });

  // BULK IMPORT CONSOLIDATION POINTS (CSV)
  app.post("/api/admin/consolidation-points/bulk", requireAdminAuth, async (req, res) => {
    try {
      const pointRows = req.body;

      if (!Array.isArray(pointRows) || pointRows.length === 0) {
        return res.status(400).json({ error: "Consolidation points array is required" });
      }

      const results = {
        total: pointRows.length,
        successful: 0,
        errors: 0,
        details: [] as { row: number; name: string; status: string; success: boolean; error?: string }[],
      };

      for (let i = 0; i < pointRows.length; i++) {
        const row = pointRows[i];
        const rowNum = i + 1;

        try {
          // Check required field (name or location_name)
          const name = row.name?.trim() || row.location_name?.trim();
          if (!name) {
            results.errors++;
            results.details.push({ row: rowNum, name: "", status: "", success: false, error: "Name is required" });
            continue;
          }

          const pointData = {
            name,
            addressLine1: row.addressLine1?.trim() || row.address_line1?.trim() || null,
            addressLine2: row.addressLine2?.trim() || row.address_line2?.trim() || null,
            city: row.city?.trim() || null,
            state: row.state?.trim() || null,
            postalCode: row.postalCode?.trim() || row.postal_code?.trim() || null,
            country: row.country?.trim() || null,
            contactName: row.contactName?.trim() || row.contact_name?.trim() || null,
            contactEmail: row.contactEmail?.trim() || row.contact_email?.trim() || null,
            contactPhone: row.contactPhone?.trim() || row.contact_phone?.trim() || null,
            notes: row.notes?.trim() || null,
            status: row.status?.trim() || "ACTIVE",
          };

          const parsed = insertConsolidationPointSchema.safeParse(pointData);
          if (!parsed.success) {
            results.errors++;
            results.details.push({ row: rowNum, name, status: pointData.status, success: false, error: parsed.error.errors[0]?.message || "Validation failed" });
            continue;
          }

          await storage.createConsolidationPoint(parsed.data);
          results.successful++;
          results.details.push({ row: rowNum, name, status: pointData.status, success: true });
        } catch (err: any) {
          results.errors++;
          results.details.push({ row: rowNum, name: row.name || row.location_name || "", status: "", success: false, error: err.message || "Unknown error" });
        }
      }

      return res.json(results);
    } catch (error) {
      console.error("[ADMIN] Error in bulk consolidation point import:", error);
      return res.status(500).json({ error: "Failed to process bulk import" });
    }
  });

  // Check admin session status
  app.get("/api/admin/session", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    if (req.session?.isAdmin === true) {
      res.json({
        authenticated: true,
        username: req.session.adminUsername
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // ============================================
  // USER AUTHENTICATION ENDPOINTS
  // ============================================

  // Start passwordless auth - generates 6-digit code
  // POST /api/auth/start { email }
  app.post("/api/auth/start", async (req, res) => {
    try {
      const parsed = authStartSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parsed.error.flatten()
        });
      }

      const email = parsed.data.email.toLowerCase();

      // Generate 6-digit code
      const code = generateAuthCode();
      if (process.env.APP_ENV === "staging") {
        console.log(`[STAGING OTP] email=${email} code=${code}`);
      }
      const salt = randomBytes(16).toString("hex");
      const codeHash = hashAuthCode(code, salt);

      // Set expiration to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Store the hashed code with salt embedded (format: salt:hash)
      await storage.createAuthCode({
        email,
        codeHash: `${salt}:${codeHash}`,
        expiresAt,
        used: false,
      });

      // DEV MODE: Log code to console and store in memory for tests
      if (process.env.NODE_ENV !== "production") {
        console.log(`[AUTH DEV] Code for ${email}: ${code}`);
        devAuthCodes.set(email, code);
      }

      // In production, this would send an email
      // For now, we just return success
      console.log(`[AUTH] Code generated for ${email}, expires at ${expiresAt.toISOString()}`);

      res.json({
        success: true,
        message: "Verification code sent to your email.",
        // DEV ONLY: Include code in response for easier testing
        ...(process.env.NODE_ENV !== "production" && { devCode: code })
      });
    } catch (error) {
      console.error("[AUTH] Error starting auth:", error);
      res.status(500).json({ error: "Failed to start authentication" });
    }
  });

  // Verify auth code and create session
  // POST /api/auth/verify { email, code }
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const parsed = authVerifySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parsed.error.flatten()
        });
      }

      const email = parsed.data.email.toLowerCase();
      const code = parsed.data.code;

      // Get the latest valid auth code for this email
      const authCode = await storage.getValidAuthCode(email);

      // SECURITY: getValidAuthCode already filters by email, used=false, and expiresAt > now in SQL
      if (!authCode) {
        console.warn(`[AUTH] No valid code found for ${email}`);
        return res.status(401).json({
          error: "Invalid or expired code",
          message: "Please request a new verification code."
        });
      }

      // Verify the code hash
      const [salt, storedHash] = authCode.codeHash.split(":");
      const providedHash = hashAuthCode(code, salt);

      if (providedHash !== storedHash) {
        console.warn(`[AUTH] Invalid code attempt for ${email}`);
        return res.status(401).json({
          error: "Invalid code",
          message: "The code you entered is incorrect."
        });
      }

      // SECURITY: Atomically mark code as used with optimistic locking
      // This prevents race conditions where same code is used twice
      const marked = await storage.markAuthCodeUsed(authCode.id);
      if (!marked) {
        console.warn(`[AUTH] Code already used (race condition prevented) for ${email}`);
        return res.status(401).json({
          error: "Code already used",
          message: "This code has already been used. Please request a new one."
        });
      }

      // Get or create user
      let user = await storage.getUserByEmail(email);
      if (!user) {
        // Create new user
        user = await storage.createUser({ email });
        // Create empty profile
        await storage.createUserProfile({ userId: user.id });
        console.log(`[AUTH] New user created: ${user.id} (${email})`);
      }

      // Create session (30 days expiry)
      const sessionToken = generateSessionToken();
      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await storage.createUserSession({
        userId: user.id,
        sessionToken,
        expiresAt: sessionExpiresAt,
      });

      // Set httpOnly cookie
      res.cookie("alpmera_user", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      console.log(`[AUTH] User logged in: ${user.id} (${email})`);

      // Clean up dev code store
      if (process.env.NODE_ENV !== "production") {
        devAuthCodes.delete(email);
      }

      res.json({
        success: true,
        message: "Logged in successfully",
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error("[AUTH] Error verifying code:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  // Check user session status
  // GET /api/auth/session
  app.get("/api/auth/session", async (req, res) => {
    const sessionToken = req.cookies?.alpmera_user;

    if (!sessionToken) {
      return res.json({ authenticated: false });
    }

    try {
      const session = await storage.getUserSession(sessionToken);

      if (!session || new Date(session.expiresAt) < new Date()) {
        if (session) {
          await storage.deleteUserSession(sessionToken);
        }
        return res.json({ authenticated: false });
      }

      const user = await storage.getUserWithProfile(session.userId);

      if (!user) {
        return res.json({ authenticated: false });
      }

      res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          profile: user.profile
        }
      });
    } catch (error) {
      console.error("[AUTH] Session check error:", error);
      res.json({ authenticated: false });
    }
  });

  // User logout
  // POST /api/auth/logout
  app.post("/api/auth/logout", async (req, res) => {
    const sessionToken = req.cookies?.alpmera_user;

    if (sessionToken) {
      try {
        await storage.deleteUserSession(sessionToken);
        console.log(`[AUTH] User logged out`);
      } catch (error) {
        console.error("[AUTH] Logout error:", error);
      }
    }

    res.clearCookie("alpmera_user", { path: "/" });
    res.json({ success: true, message: "Logged out successfully" });
  });

  // DEV ONLY: Get auth code for testing
  // GET /api/auth/dev-code/:email
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/auth/dev-code/:email", (req, res) => {
      const email = req.params.email.toLowerCase();
      const code = devAuthCodes.get(email);

      if (code) {
        res.json({ code });
      } else {
        res.status(404).json({ error: "No code found for this email" });
      }
    });
  }

  // ============================================
  // USER PROFILE ENDPOINTS (Protected)
  // ============================================

  // Get current user info and profile
  // GET /api/me
  app.get("/api/me", requireUserAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUserWithProfile(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        profile: user.profile,
        isAdmin: req.session?.isAdmin === true
      });
    } catch (error) {
      console.error("[USER] Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user profile
  // PATCH /api/me/profile
  app.patch("/api/me/profile", requireUserAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;

      const parsed = updateUserProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parsed.error.flatten()
        });
      }

      // Check if profile exists, create if not
      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ userId });
      }

      // Update profile
      const updated = await storage.updateUserProfile(userId, parsed.data);

      if (!updated) {
        return res.status(500).json({ error: "Failed to update profile" });
      }

      console.log(`[USER] Profile updated for user ${userId}`);
      res.json(updated);
    } catch (error) {
      console.error("[USER] Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Get user's own commitments with campaign info and last status update
  // GET /api/account/commitments
  app.get("/api/account/commitments", requireUserAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const userCommitments = await storage.getCommitmentsByUserId(userId);

      // Enrich with last campaign status update timestamp
      const enrichedCommitments = await Promise.all(
        userCommitments.map(async (commitment) => {
          // Get last status transition from admin logs
          const adminLogs = await storage.getAdminActionLogsByCampaign(commitment.campaignId);
          const lastTransition = adminLogs
            .filter(log => log.action === "state_transition" && log.newState)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          return {
            ...commitment,
            lastCampaignStatusUpdate: lastTransition?.createdAt || commitment.campaign.createdAt,
          };
        })
      );

      res.json(enrichedCommitments);
    } catch (error) {
      console.error("[USER] Error fetching user commitments:", error);
      res.status(500).json({ error: "Failed to fetch commitments" });
    }
  });

  // Get single commitment detail by reference number (for user's own commitment)
  // GET /api/account/commitments/:code
  app.get("/api/account/commitments/:code", requireUserAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const code = req.params.code;

      // Get commitment with campaign
      const commitment = await storage.getCommitmentWithCampaign(code);
      if (!commitment) {
        return res.status(404).json({ error: "Commitment not found" });
      }

      // Verify ownership
      if (commitment.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get escrow entries for this commitment
      const escrowEntries = await storage.getEscrowEntriesByCommitment(commitment.id);

      // Get admin action logs for campaign status history (status transitions)
      const adminLogs = await storage.getAdminActionLogsByCampaign(commitment.campaignId);
      const statusTransitions = adminLogs
        .filter(log => log.action === "state_transition" && log.newState)
        .map(log => ({
          state: log.newState!,
          timestamp: log.createdAt,
          reason: log.reason || undefined,
        }));

      // Compute last status update timestamp
      const lastStatusUpdate = statusTransitions.length > 0
        ? statusTransitions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
        : commitment.campaign.createdAt;

      res.json({
        ...commitment,
        escrowEntries,
        statusTransitions,
        lastCampaignStatusUpdate: lastStatusUpdate,
      });
    } catch (error) {
      console.error("[USER] Error fetching commitment detail:", error);
      res.status(500).json({ error: "Failed to fetch commitment" });
    }
  });

  // GET /api/account/escrow - List user's escrow movements (append-only ledger entries)
  app.get("/api/account/escrow", requireUserAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const entries = await storage.getEscrowEntriesByUserId(userId);

      // Map to list format (exclude supplier-private pricing details)
      const movements = entries.map(entry => ({
        id: entry.id,
        entryType: entry.entryType,
        amount: entry.amount,
        createdAt: entry.createdAt,
        reason: entry.reason,
        actor: entry.actor,
        commitmentCode: entry.commitment.referenceNumber,
        campaignId: entry.campaign.id,
        campaignName: entry.campaign.title,
      }));

      res.json(movements);
    } catch (error) {
      console.error("[USER] Error fetching escrow movements:", error);
      res.status(500).json({ error: "Failed to fetch escrow movements" });
    }
  });

  // GET /api/account/escrow/:id - Get single escrow movement detail
  app.get("/api/account/escrow/:id", requireUserAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const entryId = req.params.id;

      const entry = await storage.getEscrowEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ error: "Escrow movement not found" });
      }

      // Verify ownership
      if (entry.commitment.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get all escrow entries for this commitment (for timeline)
      const relatedEntries = await storage.getEscrowEntriesByCommitment(entry.commitmentId);

      res.json({
        id: entry.id,
        entryType: entry.entryType,
        amount: entry.amount,
        createdAt: entry.createdAt,
        reason: entry.reason,
        actor: entry.actor,
        commitmentCode: entry.commitment.referenceNumber,
        commitmentId: entry.commitment.id,
        campaignId: entry.campaign.id,
        campaignName: entry.campaign.title,
        campaignState: entry.campaign.state,
        relatedEntries: relatedEntries.map(e => ({
          id: e.id,
          entryType: e.entryType,
          amount: e.amount,
          createdAt: e.createdAt,
          reason: e.reason,
          actor: e.actor,
        })),
      });
    } catch (error) {
      console.error("[USER] Error fetching escrow movement detail:", error);
      res.status(500).json({ error: "Failed to fetch escrow movement" });
    }
  });

  // GET /api/account/refunds - List user's refund entries (filtered escrow ledger)
  app.get("/api/account/refunds", requireUserAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const entries = await storage.getEscrowEntriesByUserId(userId);

      // Filter to only REFUND entries
      const refunds = entries
        .filter(entry => entry.entryType === "REFUND")
        .map(entry => ({
          id: entry.id,
          entryType: entry.entryType,
          amount: entry.amount,
          createdAt: entry.createdAt,
          reason: entry.reason,
          actor: entry.actor,
          commitmentCode: entry.commitment.referenceNumber,
          campaignId: entry.campaign.id,
          campaignName: entry.campaign.title,
        }));

      res.json(refunds);
    } catch (error) {
      console.error("[USER] Error fetching refunds:", error);
      res.status(500).json({ error: "Failed to fetch refunds" });
    }
  });

  // GET /api/account/refunds/:id - Get single refund detail
  app.get("/api/account/refunds/:id", requireUserAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const refundId = req.params.id;

      const entry = await storage.getEscrowEntryById(refundId);
      if (!entry) {
        return res.status(404).json({ error: "Refund not found" });
      }

      // Verify it's a REFUND type
      if (entry.entryType !== "REFUND") {
        return res.status(404).json({ error: "Refund not found" });
      }

      // Verify ownership
      if (entry.commitment.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get all escrow entries for this commitment (for lifecycle timeline)
      const relatedEntries = await storage.getEscrowEntriesByCommitment(entry.commitmentId);

      res.json({
        id: entry.id,
        entryType: entry.entryType,
        amount: entry.amount,
        createdAt: entry.createdAt,
        reason: entry.reason,
        actor: entry.actor,
        commitmentCode: entry.commitment.referenceNumber,
        commitmentId: entry.commitment.id,
        campaignId: entry.campaign.id,
        campaignName: entry.campaign.title,
        campaignState: entry.campaign.state,
        // Lifecycle timeline: all escrow entries for this commitment
        lifecycleEntries: relatedEntries.map(e => ({
          id: e.id,
          entryType: e.entryType,
          amount: e.amount,
          createdAt: e.createdAt,
          reason: e.reason,
          actor: e.actor,
        })),
      });
    } catch (error) {
      console.error("[USER] Error fetching refund detail:", error);
      res.status(500).json({ error: "Failed to fetch refund" });
    }
  });

  // Get campaigns with stats (public endpoint - HVLC)
  // Only returns PUBLISHED campaigns, redacts monetary fields for list view
  app.get("/api/campaigns", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          created_desc: "created_desc",
          created_asc: "created_asc",
          deadline_asc: "deadline_asc",
          deadline_desc: "deadline_desc",
          title_asc: "title_asc",
          title_desc: "title_desc",
        },
        defaultSort: "created_desc",
      });

      const statusRaw = typeof req.query.status === "string" ? req.query.status.trim() : undefined;
      const statuses = statusRaw
        ? statusRaw.split(",").map((entry) => entry.trim()).filter(Boolean)
        : [];

      const conditions: any[] = [eq(campaigns.adminPublishStatus, "PUBLISHED")];
      if (listQuery.params.search) {
        const searchValue = `%${listQuery.params.search}%`;
        conditions.push(
          or(
            ilike(campaigns.title, searchValue),
            ilike(campaigns.description, searchValue),
            ilike(campaigns.id, searchValue)
          )
        );
      }
      if (statuses.length > 0) {
        conditions.push(
          or(...statuses.map((state) => eq(campaigns.state, state as any)))
        );
      }
      if (listQuery.params.createdFrom) {
        const fromDate = new Date(listQuery.params.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        conditions.push(gte(campaigns.createdAt, fromDate));
      }
      if (listQuery.params.createdTo) {
        const toDate = new Date(listQuery.params.createdTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(campaigns.createdAt, toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: countDistinct(campaigns.id) })
        .from(campaigns)
        .where(whereClause);

      const totalCommittedExpr = sql<number>`coalesce(sum(${commitments.amount}::numeric), 0)::float`;

      let orderByClause = [desc(campaigns.createdAt), desc(campaigns.id)];
      switch (listQuery.sortApplied) {
        case "created_asc":
          orderByClause = [asc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "deadline_asc":
          orderByClause = [asc(campaigns.aggregationDeadline), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "deadline_desc":
          orderByClause = [desc(campaigns.aggregationDeadline), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "title_asc":
          orderByClause = [asc(campaigns.title), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "title_desc":
          orderByClause = [desc(campaigns.title), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        default:
          break;
      }

      const rows = await db
        .select({
          id: campaigns.id,
          title: campaigns.title,
          description: campaigns.description,
          state: campaigns.state,
          imageUrl: campaigns.imageUrl,
          primaryImageUrl: campaigns.primaryImageUrl,
          galleryImageUrls: campaigns.galleryImageUrls,
          targetAmount: campaigns.targetAmount,
          aggregationDeadline: campaigns.aggregationDeadline,
          createdAt: campaigns.createdAt,
          totalCommitted: totalCommittedExpr,
        })
        .from(campaigns)
        .leftJoin(commitments, eq(commitments.campaignId, campaigns.id))
        .where(whereClause)
        .groupBy(
          campaigns.id,
          campaigns.title,
          campaigns.description,
          campaigns.state,
          campaigns.imageUrl,
          campaigns.primaryImageUrl,
          campaigns.galleryImageUrls,
          campaigns.targetAmount,
          campaigns.aggregationDeadline,
          campaigns.createdAt
        )
        .orderBy(...orderByClause)
        .limit(listQuery.limit)
        .offset(listQuery.offset);

      const redactedRows = rows.map((c) => {
        const targetAmount = parseFloat(String(c.targetAmount || 0)) || 0;
        const totalCommitted = c.totalCommitted || 0;
        const progressPercent = targetAmount > 0
          ? Math.min(Math.round((totalCommitted / targetAmount) * 100), 100)
          : 0;
        const galleryFirst = getFirstGalleryImageUrl(c.galleryImageUrls);
        const resolvedImageUrl = c.primaryImageUrl || galleryFirst || c.imageUrl;

        return {
          id: c.id,
          title: c.title,
          description: c.description,
          state: c.state,
          imageUrl: resolvedImageUrl,
          progressPercent,
          aggregationDeadline: c.aggregationDeadline,
          createdAt: c.createdAt,
        };
      });

      res.json({
        rows: redactedRows,
        total: countResult?.count || 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
          status: statuses.length > 0 ? statuses.join(",") : null,
        },
      });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Get single campaign with stats
  // Public users: only see PUBLISHED campaigns with limited data
  // Authenticated members: see full details including pricing
  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaignWithStats(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Check if user is authenticated via alpmera_user cookie
      const sessionToken = req.cookies?.alpmera_user;
      let isAuthenticated = false;

      if (sessionToken) {
        const session = await storage.getUserSession(sessionToken);
        if (session && new Date(session.expiresAt) > new Date()) {
          isAuthenticated = true;
        }
      }

      const publishStatus = (campaign as any).adminPublishStatus || "DRAFT";

      // Non-authenticated users can only see PUBLISHED campaigns
      if (!isAuthenticated && publishStatus !== "PUBLISHED") {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // For authenticated members, return full campaign details (for joining flow)
      if (isAuthenticated) {
        return res.json(campaign);
      }

      // For non-authenticated users, redact monetary fields but include more for detail view
      const targetAmount = parseFloat(campaign.targetAmount) || 0;
      const totalCommitted = campaign.totalCommitted || 0;
      const progressPercent = targetAmount > 0
        ? Math.min(Math.round((totalCommitted / targetAmount) * 100), 100)
        : 0;

      res.json({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        rules: campaign.rules,
        state: campaign.state,
        imageUrl: campaign.imageUrl,
        primaryImageUrl: (campaign as any).primaryImageUrl,
        galleryImageUrls: (campaign as any).galleryImageUrls,
        progressPercent,
        aggregationDeadline: campaign.aggregationDeadline,
        createdAt: campaign.createdAt,
      });
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  // Get commitments for a campaign
  app.get("/api/campaigns/:id/commitments", async (req, res) => {
    try {
      const commitments = await storage.getCommitments(req.params.id);
      res.json(commitments);
    } catch (error) {
      console.error("Error fetching commitments:", error);
      res.status(500).json({ error: "Failed to fetch commitments" });
    }
  });

  // Create a commitment (escrow lock)
  // CRITICAL: Amount is calculated SERVER-SIDE from quantity * unitPrice
  // Client-provided amount is ignored to prevent tampering
  // IDEMPOTENCY: Requires x-idempotency-key header to prevent duplicate LOCK entries
  app.post("/api/campaigns/:id/commit", async (req, res) => {
    try {
      // IDEMPOTENCY CHECK: Require x-idempotency-key header
      const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;
      if (!idempotencyKey) {
        return res.status(400).json({
          error: "x-idempotency-key header is required for commitment operations"
        });
      }

      const scope = `commitment_lock:${req.params.id}`;
      const requestHash = computeRequestHash(req.body);

      // Check if this key+scope already processed
      const existingKey = await storage.getIdempotencyKey(idempotencyKey, scope);
      if (existingKey) {
        // Already processed - return cached response
        if (existingKey.response) {
          try {
            const responseStr = typeof existingKey.response === 'string'
              ? existingKey.response
              : JSON.stringify(existingKey.response);
            const cachedResponse = JSON.parse(responseStr);
            return res.status(200).json({ ...cachedResponse, _idempotent: true });
          } catch {
            console.warn(`[IDEMPOTENCY] Malformed cached response for key ${idempotencyKey}`);
            return res.status(200).json({
              message: "Request already processed",
              _idempotent: true
            });
          }
        }
        // Key exists but no response yet (unlikely race condition) - return safe response
        return res.status(200).json({
          message: "Request already being processed",
          _idempotent: true
        });
      }

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.state !== "AGGREGATION") {
        return res.status(400).json({ error: "Campaign is not accepting commitments" });
      }

      // Validate request using Zod schema
      const parseResult = commitmentRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parseResult.error.flatten()
        });
      }

      const { participantName, participantEmail, quantity } = parseResult.data;

      // SERVER-SIDE CALCULATION: amount = quantity * unitPrice
      // This prevents client-side tampering with commitment amounts
      const unitPrice = parseFloat(campaign.unitPrice);
      const calculatedAmount = quantity * unitPrice;

      const minCommitment = parseFloat(campaign.minCommitment);
      const maxCommitment = campaign.maxCommitment ? parseFloat(campaign.maxCommitment) : null;

      if (calculatedAmount < minCommitment) {
        return res.status(400).json({
          error: `Minimum commitment is ${minCommitment.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`
        });
      }

      if (maxCommitment && calculatedAmount > maxCommitment) {
        return res.status(400).json({
          error: `Maximum commitment is ${maxCommitment.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`
        });
      }

      // Insert idempotency key BEFORE creating commitment (catches duplicates)
      let idempotencyRecord;
      try {
        idempotencyRecord = await storage.createIdempotencyKey({
          key: idempotencyKey,
          scope,
          requestHash,
        });
      } catch (error: any) {
        // Unique constraint violation = duplicate request
        if (error.code === "23505") {
          const existing = await storage.getIdempotencyKey(idempotencyKey, scope);
          if (existing?.response) {
            try {
              const responseStr = typeof existing.response === 'string'
                ? existing.response
                : JSON.stringify(existing.response);
              const cachedResponse = JSON.parse(responseStr);
              return res.status(200).json({ ...cachedResponse, _idempotent: true });
            } catch {
              return res.status(200).json({ message: "Request already processed", _idempotent: true });
            }
          }
          return res.status(200).json({ message: "Request already processed", _idempotent: true });
        }
        throw error;
      }

      // Check if user is authenticated (optional - commitment still works without auth)
      let authenticatedUserId: string | undefined;
      const sessionToken = req.cookies?.alpmera_user;
      if (sessionToken) {
        const session = await storage.getUserSession(sessionToken);
        if (session && new Date(session.expiresAt) > new Date()) {
          authenticatedUserId = session.userId;
        }
      }

      // Create commitment with server-calculated amount
      // If user is authenticated, attach user_id for future account features
      const commitment = await storage.createCommitment({
        campaignId: req.params.id,
        userId: authenticatedUserId, // nullable - only set if user is logged in
        participantName,
        participantEmail,
        amount: calculatedAmount.toFixed(2),
        quantity,
      });

      // Create escrow ledger entry (LOCK) - append-only
      // Balances are DERIVED from summing entries, not stored
      await storage.createEscrowEntry({
        commitmentId: commitment.id,
        campaignId: req.params.id,
        entryType: "LOCK",
        amount: calculatedAmount.toFixed(2),
        actor: participantEmail,
        reason: "commitment_created",
      });

      // Store response in idempotency record for future retries
      await storage.updateIdempotencyKeyResponse(idempotencyRecord.id, JSON.stringify(commitment));

      res.status(201).json(commitment);
    } catch (error) {
      console.error("Error creating commitment:", error);
      res.status(500).json({ error: "Failed to create commitment" });
    }
  });

  // Get commitment by reference number
  app.get("/api/commitments/:reference", async (req, res) => {
    try {
      const commitment = await storage.getCommitmentWithCampaign(req.params.reference);
      if (!commitment) {
        return res.status(404).json({ error: "Commitment not found" });
      }
      res.json(commitment);
    } catch (error) {
      console.error("Error fetching commitment:", error);
      res.status(500).json({ error: "Failed to fetch commitment" });
    }
  });

  // Expose valid transitions for frontend consumption (prevents drift)
  app.get("/api/state-machine", async (req, res) => {
    res.json({ validTransitions: VALID_TRANSITIONS });
  });

  // ============================================
  // ADMIN PRODUCT ENDPOINTS
  // ============================================

  // List products (HVLC)
  app.get("/api/admin/products", requireAdminAuth, async (req, res) => {
    try {
      if (req.query.mode === "legacy") {
        const allProducts = await storage.getProducts();
        return res.json(allProducts);
      }

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          name_asc: "name_asc",
          name_desc: "name_desc",
          sku_asc: "sku_asc",
          sku_desc: "sku_desc",
          status_asc: "status_asc",
          status_desc: "status_desc",
          created_asc: "created_asc",
          created_desc: "created_desc",
        },
        defaultSort: "created_desc",
      });

      const conditions: any[] = [];
      if (listQuery.params.status) {
        conditions.push(eq(products.status, listQuery.params.status as any));
      }
      if (listQuery.params.search) {
        const searchValue = `%${listQuery.params.search}%`;
        conditions.push(
          or(
            ilike(products.name, searchValue),
            ilike(products.sku, searchValue),
            ilike(products.brand, searchValue)
          )
        );
      }
      if (listQuery.params.createdFrom) {
        const fromDate = new Date(listQuery.params.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        conditions.push(gte(products.createdAt, fromDate));
      }
      if (listQuery.params.createdTo) {
        const toDate = new Date(listQuery.params.createdTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(products.createdAt, toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: count(products.id) })
        .from(products)
        .where(whereClause);

      let orderByClause = [desc(products.createdAt), desc(products.id)];
      switch (listQuery.sortApplied) {
        case "name_asc":
          orderByClause = [asc(products.name), desc(products.createdAt), desc(products.id)];
          break;
        case "name_desc":
          orderByClause = [desc(products.name), desc(products.createdAt), desc(products.id)];
          break;
        case "sku_asc":
          orderByClause = [asc(products.sku), desc(products.createdAt), desc(products.id)];
          break;
        case "sku_desc":
          orderByClause = [desc(products.sku), desc(products.createdAt), desc(products.id)];
          break;
        case "status_asc":
          orderByClause = [asc(products.status), desc(products.createdAt), desc(products.id)];
          break;
        case "status_desc":
          orderByClause = [desc(products.status), desc(products.createdAt), desc(products.id)];
          break;
        case "created_asc":
          orderByClause = [asc(products.createdAt), desc(products.id)];
          break;
        default:
          break;
      }

      const rows = await db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          brand: products.brand,
          category: products.category,
          status: products.status,
          createdAt: products.createdAt,
        })
        .from(products)
        .where(whereClause)
        .orderBy(...orderByClause)
        .limit(listQuery.limit)
        .offset(listQuery.offset);

      res.json({
        rows,
        total: countResult?.count || 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
        },
      });
    } catch (error) {
      console.error("[ADMIN] Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get single product
  app.get("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("[ADMIN] Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Create product
  app.post("/api/admin/products", requireAdminAuth, async (req, res) => {
    try {
      const { sku, name, brand, modelNumber, variant, category, shortDescription,
        specs, primaryImageUrl, galleryImageUrls, referencePrices, internalNotes } = req.body;

      // Validate required fields
      if (!sku?.trim()) {
        return res.status(400).json({ error: "SKU is required" });
      }
      if (!name?.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }

      // Check if SKU already exists (case-insensitive)
      const existing = await storage.getProductBySku(sku.trim());
      if (existing) {
        return res.status(409).json({ error: "SKU already exists" });
      }

      // Validate SKU format (alphanumeric, dash, underscore)
      if (!/^[A-Za-z0-9_-]+$/.test(sku.trim())) {
        return res.status(400).json({ error: "SKU must contain only letters, numbers, dashes, and underscores" });
      }

      const product = await storage.createProduct({
        sku: sku.trim(),
        name: name.trim(),
        brand: brand?.trim() || null,
        modelNumber: modelNumber?.trim() || null,
        variant: variant?.trim() || null,
        category: category?.trim() || null,
        shortDescription: shortDescription?.trim() || null,
        specs: specs ? (typeof specs === "string" ? specs : JSON.stringify(specs)) : null,
        primaryImageUrl: primaryImageUrl?.trim() || null,
        galleryImageUrls: galleryImageUrls ? (typeof galleryImageUrls === "string" ? galleryImageUrls : JSON.stringify(galleryImageUrls)) : null,
        referencePrices: referencePrices ? (typeof referencePrices === "string" ? referencePrices : JSON.stringify(referencePrices)) : null,
        internalNotes: internalNotes?.trim() || null,
      });

      console.log(`[ADMIN] Product created: ${product.id} (${product.sku})`);
      res.status(201).json(product);
    } catch (error) {
      console.error("[ADMIN] Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Update product (with append-only reference prices)
  app.patch("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const { sku, name, brand, modelNumber, variant, category, shortDescription,
        specs, primaryImageUrl, galleryImageUrls, newReferencePrice, referencePrices, internalNotes } = req.body;

      // If SKU is changing, validate it's not a duplicate
      if (sku && sku.trim() !== product.sku) {
        const existing = await storage.getProductBySku(sku.trim());
        if (existing && existing.id !== product.id) {
          return res.status(409).json({ error: "SKU already exists" });
        }
        if (!/^[A-Za-z0-9_-]+$/.test(sku.trim())) {
          return res.status(400).json({ error: "SKU must contain only letters, numbers, dashes, and underscores" });
        }
      }

      // Handle reference prices
      let updatedReferencePrices = product.referencePrices;

      // 1. If FULL referencePrices array is provided, use it (Full Override Mode)
      if (referencePrices !== undefined) {
        if (Array.isArray(referencePrices)) {
          // Basic validation of entries
          for (const price of referencePrices) {
            if (!price.amount || price.amount <= 0) {
              return res.status(400).json({ error: "All reference prices must have a positive amount" });
            }
            if (!price.sourceType) {
              return res.status(400).json({ error: "All reference prices must have a sourceType" });
            }
          }
          updatedReferencePrices = JSON.stringify(referencePrices);
        } else if (referencePrices === null) {
          updatedReferencePrices = null;
        } else {
          updatedReferencePrices = typeof referencePrices === "string" ? referencePrices : JSON.stringify(referencePrices);
        }
      }
      // 2. If ONLY newReferencePrice is provided, append it (Legacy/Incremental Mode)
      else if (newReferencePrice) {
        // ... rest of append logic
        if (!newReferencePrice.amount || newReferencePrice.amount <= 0) {
          return res.status(400).json({ error: "Reference price amount is required and must be positive" });
        }
        if (!newReferencePrice.sourceType) {
          return res.status(400).json({ error: "Reference price sourceType is required" });
        }
        if (!["MSRP", "RETAILER_LISTING", "SUPPLIER_QUOTE", "OTHER"].includes(newReferencePrice.sourceType)) {
          return res.status(400).json({ error: "Invalid sourceType. Must be MSRP, RETAILER_LISTING, SUPPLIER_QUOTE, or OTHER" });
        }

        let existingPrices: any[] = [];
        if (product.referencePrices) {
          try {
            existingPrices = typeof product.referencePrices === "string"
              ? JSON.parse(product.referencePrices)
              : product.referencePrices;
          } catch {
            existingPrices = [];
          }
        }

        const priceEntry = {
          amount: newReferencePrice.amount,
          currency: newReferencePrice.currency || "USD",
          sourceType: newReferencePrice.sourceType,
          sourceNameOrUrl: newReferencePrice.sourceNameOrUrl || null,
          capturedAt: new Date().toISOString(),
          capturedBy: req.session?.adminUsername || "admin",
          note: newReferencePrice.note || null,
        };

        existingPrices.push(priceEntry);
        updatedReferencePrices = JSON.stringify(existingPrices);
      }

      const updates: any = {};
      if (sku !== undefined) updates.sku = sku.trim();
      if (name !== undefined) updates.name = name.trim();
      if (brand !== undefined) updates.brand = brand?.trim() || null;
      if (modelNumber !== undefined) updates.modelNumber = modelNumber?.trim() || null;
      if (variant !== undefined) updates.variant = variant?.trim() || null;
      if (category !== undefined) updates.category = category?.trim() || null;
      if (shortDescription !== undefined) updates.shortDescription = shortDescription?.trim() || null;
      if (specs !== undefined) updates.specs = specs ? (typeof specs === "string" ? specs : JSON.stringify(specs)) : null;
      if (primaryImageUrl !== undefined) updates.primaryImageUrl = primaryImageUrl?.trim() || null;
      if (galleryImageUrls !== undefined) updates.galleryImageUrls = galleryImageUrls ? (typeof galleryImageUrls === "string" ? galleryImageUrls : JSON.stringify(galleryImageUrls)) : null;
      if (internalNotes !== undefined) updates.internalNotes = internalNotes?.trim() || null;
      if (updatedReferencePrices !== product.referencePrices) updates.referencePrices = updatedReferencePrices;

      const updated = await storage.updateProduct(product.id, updates);
      console.log(`[ADMIN] Product updated: ${product.id} (${product.sku})`);
      res.json(updated);
    } catch (error) {
      console.error("[ADMIN] Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Archive product (soft delete)
  app.delete("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const archived = await storage.archiveProduct(product.id);
      console.log(`[ADMIN] Product archived: ${product.id} (${product.sku})`);
      res.json(archived);
    } catch (error) {
      console.error("[ADMIN] Error archiving product:", error);
      res.status(500).json({ error: "Failed to archive product" });
    }
  });

  // Bulk product upload (CSV)
  app.post("/api/admin/products/bulk", requireAdminAuth, async (req, res) => {
    try {
      const { products: productRows } = req.body;

      if (!Array.isArray(productRows) || productRows.length === 0) {
        return res.status(400).json({ error: "Products array is required" });
      }

      const results = {
        totalRows: productRows.length,
        created: 0,
        skipped: 0,
        errors: [] as { row: number; sku?: string; error: string }[],
      };

      const adminUsername = req.session?.adminUsername || "admin";

      for (let i = 0; i < productRows.length; i++) {
        const row = productRows[i];
        const rowNum = i + 1;

        try {
          // Validate required fields
          if (!row.sku?.trim()) {
            results.errors.push({ row: rowNum, error: "SKU is required" });
            results.skipped++;
            continue;
          }
          if (!row.name?.trim()) {
            results.errors.push({ row: rowNum, sku: row.sku, error: "Name is required" });
            results.skipped++;
            continue;
          }

          const sku = row.sku.trim();

          // Validate SKU format
          if (!/^[A-Za-z0-9_-]+$/.test(sku)) {
            results.errors.push({ row: rowNum, sku, error: "SKU must contain only letters, numbers, dashes, and underscores" });
            results.skipped++;
            continue;
          }

          // Check if SKU already exists
          const existing = await storage.getProductBySku(sku);
          if (existing) {
            results.errors.push({ row: rowNum, sku, error: "SKU already exists" });
            results.skipped++;
            continue;
          }

          // Parse specs if present
          let specs = null;
          if (row.specs) {
            try {
              const specPairs = row.specs.split("|").map((s: string) => {
                const [key, value] = s.split(":");
                if (!key || !value) throw new Error("Invalid spec format");
                return { key: key.trim(), value: value.trim() };
              });
              specs = JSON.stringify(specPairs);
            } catch {
              results.errors.push({ row: rowNum, sku, error: "Specs must be in key:value format separated by |" });
              results.skipped++;
              continue;
            }
          }

          // Parse gallery URLs if present
          let galleryImageUrls = null;
          if (row.galleryImageUrls) {
            galleryImageUrls = JSON.stringify(row.galleryImageUrls.split("|").map((u: string) => u.trim()));
          }

          // Build reference price if amount and source provided
          let referencePrices = null;
          if (row.referencePriceAmount && row.referencePriceSource) {
            if (!["MSRP", "RETAILER_LISTING", "SUPPLIER_QUOTE", "OTHER"].includes(row.referencePriceSource)) {
              results.errors.push({ row: rowNum, sku, error: "Invalid referencePriceSource" });
              results.skipped++;
              continue;
            }
            referencePrices = JSON.stringify([{
              amount: parseFloat(row.referencePriceAmount),
              currency: "USD",
              sourceType: row.referencePriceSource,
              sourceNameOrUrl: row.referencePriceUrl?.trim() || null,
              capturedAt: new Date().toISOString(),
              capturedBy: adminUsername,
              note: row.referencePriceNote?.trim() || null,
            }]);
          }

          // Create product
          await storage.createProduct({
            sku,
            name: row.name.trim(),
            brand: row.brand?.trim() || null,
            modelNumber: row.modelNumber?.trim() || null,
            variant: row.variant?.trim() || null,
            category: row.category?.trim() || null,
            shortDescription: row.shortDescription?.trim() || null,
            specs,
            primaryImageUrl: row.primaryImageUrl?.trim() || null,
            galleryImageUrls,
            referencePrices,
            internalNotes: null,
          });

          results.created++;
        } catch (error: any) {
          results.errors.push({ row: rowNum, sku: row.sku, error: error.message || "Unknown error" });
          results.skipped++;
        }
      }

      console.log(`[ADMIN] Bulk upload: ${results.created} created, ${results.skipped} skipped`);
      res.json(results);
    } catch (error) {
      console.error("[ADMIN] Error in bulk upload:", error);
      res.status(500).json({ error: "Failed to process bulk upload" });
    }
  });

  // ============================================
  // ADMIN CAMPAIGN ENDPOINTS
  // ============================================

  // Admin: Transition campaign state
  // Protected by requireAdminAuth middleware - all access is logged
  app.post("/api/admin/campaigns/:id/transition", requireAdminAuth, async (req, res) => {
    try {
      // Validate request
      const parseResult = transitionRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parseResult.error.flatten()
        });
      }

      const { newState, reason, adminUsername } = parseResult.data;

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const currentState = campaign.state as CampaignState;
      const validTransitions = VALID_TRANSITIONS[currentState];

      if (!validTransitions.includes(newState as CampaignState)) {
        return res.status(400).json({
          error: `Invalid transition from ${currentState} to ${newState}. Valid transitions: ${validTransitions.join(', ') || 'none'}`
        });
      }

      // Update campaign state
      const updated = await storage.updateCampaignState(req.params.id, newState as CampaignState);

      // Log admin action to append-only audit log
      await storage.createAdminActionLog({
        campaignId: req.params.id,
        adminUsername,
        action: "STATE_TRANSITION",
        previousState: currentState,
        newState: newState,
        reason,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error transitioning campaign:", error);
      res.status(500).json({ error: "Failed to transition campaign" });
    }
  });

  // Admin: Process refunds for failed campaign
  // CRITICAL: Guards against double-processing by checking commitment status
  // IDEMPOTENCY: Requires x-idempotency-key header to prevent duplicate REFUND entries
  // Protected by requireAdminAuth middleware - all access is logged
  app.post("/api/admin/campaigns/:id/refund", requireAdminAuth, async (req, res) => {
    try {
      // IDEMPOTENCY CHECK: Require x-idempotency-key header
      const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;
      if (!idempotencyKey) {
        return res.status(400).json({
          error: "x-idempotency-key header is required for refund operations"
        });
      }

      const scope = `refund:${req.params.id}`;
      const requestHash = computeRequestHash(req.body);

      // Check if this key+scope already processed
      const existingKey = await storage.getIdempotencyKey(idempotencyKey, scope);
      if (existingKey) {
        if (existingKey.response) {
          try {
            const responseStr = typeof existingKey.response === 'string'
              ? existingKey.response
              : JSON.stringify(existingKey.response);
            const cachedResponse = JSON.parse(responseStr);
            return res.status(200).json({ ...cachedResponse, _idempotent: true });
          } catch {
            return res.status(200).json({ message: "Request already processed", _idempotent: true });
          }
        }
        return res.status(200).json({ message: "Request already processed", _idempotent: true });
      }

      const { adminUsername } = req.body;

      if (!adminUsername) {
        return res.status(400).json({ error: "Admin username is required for audit trail" });
      }

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.state !== "FAILED") {
        return res.status(400).json({ error: "Can only process refunds for campaigns in FAILED state" });
      }

      // Insert idempotency key BEFORE processing (catches duplicates)
      let idempotencyRecord;
      try {
        idempotencyRecord = await storage.createIdempotencyKey({
          key: idempotencyKey,
          scope,
          requestHash,
        });
      } catch (error: any) {
        if (error.code === "23505") {
          const existing = await storage.getIdempotencyKey(idempotencyKey, scope);
          if (existing?.response) {
            try {
              const responseStr = typeof existing.response === 'string'
                ? existing.response
                : JSON.stringify(existing.response);
              const cachedResponse = JSON.parse(responseStr);
              return res.status(200).json({ ...cachedResponse, _idempotent: true });
            } catch {
              return res.status(200).json({ message: "Request already processed", _idempotent: true });
            }
          }
          return res.status(200).json({ message: "Request already processed", _idempotent: true });
        }
        throw error;
      }

      const commitmentsList = await storage.getCommitments(req.params.id);
      let currentBalance = await storage.getCampaignEscrowBalance(req.params.id);
      let processedCount = 0;
      let skippedCount = 0;

      for (const commitment of commitmentsList) {
        // DOUBLE-PROCESSING GUARD: Only process LOCKED commitments
        if (commitment.status === "LOCKED") {
          const amountNum = parseFloat(commitment.amount);

          // Validate escrow balance invariant
          if (currentBalance < amountNum) {
            console.error(`Escrow balance invariant violation: balance ${currentBalance} < refund amount ${amountNum}`);
            await storage.createAdminActionLog({
              campaignId: req.params.id,
              commitmentId: commitment.id,
              adminUsername,
              action: "REFUND_INVARIANT_ERROR",
              reason: `Balance invariant violation: balance ${currentBalance} < refund ${amountNum}`,
            });
            continue;
          }

          // Update commitment status
          await storage.updateCommitmentStatus(commitment.id, "REFUNDED");

          // Create escrow ledger entry (REFUND) - append-only
          await storage.createEscrowEntry({
            commitmentId: commitment.id,
            campaignId: req.params.id,
            entryType: "REFUND",
            amount: commitment.amount,
            actor: adminUsername,
            reason: "campaign_failed_refund",
          });

          currentBalance -= amountNum;
          processedCount++;
        } else {
          skippedCount++;
        }
      }

      // Log admin action
      await storage.createAdminActionLog({
        campaignId: req.params.id,
        adminUsername,
        action: "PROCESS_REFUNDS",
        reason: `Processed ${processedCount} refunds, skipped ${skippedCount} (already processed)`,
      });

      const responseData = {
        message: "Refunds processed successfully",
        processed: processedCount,
        skipped: skippedCount,
        finalBalance: currentBalance
      };

      // Store response for future retries
      await storage.updateIdempotencyKeyResponse(idempotencyRecord.id, JSON.stringify(responseData));

      res.json(responseData);
    } catch (error) {
      console.error("Error processing refunds:", error);
      res.status(500).json({ error: "Failed to process refunds" });
    }
  });

  // Admin: Release funds for completed campaign
  // CRITICAL: Guards against double-processing by checking commitment status
  // IDEMPOTENCY: Requires x-idempotency-key header to prevent duplicate RELEASE entries
  // Protected by requireAdminAuth middleware - all access is logged
  app.post("/api/admin/campaigns/:id/release", requireAdminAuth, async (req, res) => {
    try {
      // IDEMPOTENCY CHECK: Require x-idempotency-key header
      const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;
      if (!idempotencyKey) {
        return res.status(400).json({
          error: "x-idempotency-key header is required for release operations"
        });
      }

      const scope = `release:${req.params.id}`;
      const requestHash = computeRequestHash(req.body);

      // Check if this key+scope already processed
      const existingKey = await storage.getIdempotencyKey(idempotencyKey, scope);
      if (existingKey) {
        if (existingKey.response) {
          try {
            const responseStr = typeof existingKey.response === 'string'
              ? existingKey.response
              : JSON.stringify(existingKey.response);
            const cachedResponse = JSON.parse(responseStr);
            return res.status(200).json({ ...cachedResponse, _idempotent: true });
          } catch {
            return res.status(200).json({ message: "Request already processed", _idempotent: true });
          }
        }
        return res.status(200).json({ message: "Request already processed", _idempotent: true });
      }

      const { adminUsername } = req.body;

      if (!adminUsername) {
        return res.status(400).json({ error: "Admin username is required for audit trail" });
      }

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.state !== "RELEASED") {
        return res.status(400).json({ error: "Can only release funds for campaigns in RELEASED state" });
      }

      // Insert idempotency key BEFORE processing (catches duplicates)
      let idempotencyRecord;
      try {
        idempotencyRecord = await storage.createIdempotencyKey({
          key: idempotencyKey,
          scope,
          requestHash,
        });
      } catch (error: any) {
        if (error.code === "23505") {
          const existing = await storage.getIdempotencyKey(idempotencyKey, scope);
          if (existing?.response) {
            try {
              const responseStr = typeof existing.response === 'string'
                ? existing.response
                : JSON.stringify(existing.response);
              const cachedResponse = JSON.parse(responseStr);
              return res.status(200).json({ ...cachedResponse, _idempotent: true });
            } catch {
              return res.status(200).json({ message: "Request already processed", _idempotent: true });
            }
          }
          return res.status(200).json({ message: "Request already processed", _idempotent: true });
        }
        throw error;
      }

      const commitmentsList = await storage.getCommitments(req.params.id);
      let currentBalance = await storage.getCampaignEscrowBalance(req.params.id);
      let processedCount = 0;
      let skippedCount = 0;

      for (const commitment of commitmentsList) {
        // DOUBLE-PROCESSING GUARD: Only process LOCKED commitments
        if (commitment.status === "LOCKED") {
          const amountNum = parseFloat(commitment.amount);

          // Validate escrow balance invariant
          if (currentBalance < amountNum) {
            console.error(`Escrow balance invariant violation: balance ${currentBalance} < release amount ${amountNum}`);
            await storage.createAdminActionLog({
              campaignId: req.params.id,
              commitmentId: commitment.id,
              adminUsername,
              action: "RELEASE_INVARIANT_ERROR",
              reason: `Balance invariant violation: balance ${currentBalance} < release ${amountNum}`,
            });
            continue;
          }

          // Update commitment status
          await storage.updateCommitmentStatus(commitment.id, "RELEASED");

          // Create escrow ledger entry (RELEASE) - append-only
          await storage.createEscrowEntry({
            commitmentId: commitment.id,
            campaignId: req.params.id,
            entryType: "RELEASE",
            amount: commitment.amount,
            actor: adminUsername,
            reason: "admin_release",
          });

          currentBalance -= amountNum;
          processedCount++;
        } else {
          skippedCount++;
        }
      }

      // Log admin action
      await storage.createAdminActionLog({
        campaignId: req.params.id,
        adminUsername,
        action: "RELEASE_FUNDS",
        reason: `Released ${processedCount} commitments to supplier, skipped ${skippedCount} (already processed)`,
      });

      const responseData = {
        message: "Funds released successfully",
        processed: processedCount,
        skipped: skippedCount,
        finalBalance: currentBalance
      };

      // Store response for future retries
      await storage.updateIdempotencyKeyResponse(idempotencyRecord.id, JSON.stringify(responseData));

      res.json(responseData);
    } catch (error) {
      console.error("Error releasing funds:", error);
      res.status(500).json({ error: "Failed to release funds" });
    }
  });

  // Admin: Create new campaign
  // Protected by requireAdminAuth middleware
  // ALWAYS creates campaigns in AGGREGATION state and DRAFT publish status
  app.post("/api/admin/campaigns", requireAdminAuth, async (req, res) => {
    try {
      const {
        adminUsername, title, description, rules, imageUrl, targetAmount,
        minCommitment, maxCommitment, unitPrice, aggregationDeadline,
        sku, productName, deliveryStrategy,
        consolidationContactName, consolidationCompany, consolidationContactEmail, consolidationAddressLine1,
        consolidationAddressLine2, consolidationCity, consolidationState,
        consolidationPostalCode, consolidationCountry, consolidationPhone,
        deliveryWindow, fulfillmentNotes,
        // New product detail fields
        brand, modelNumber, variant, shortDescription, specs,
        primaryImageUrl, galleryImageUrls, referencePrices,
        deliveryCostHandling, supplierDirectConfirmed
      } = req.body;

      // Validate required fields - only title is required for draft creation
      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Use sensible defaults for DRAFT campaigns
      const effectiveUnitPrice = unitPrice && parseFloat(unitPrice) > 0 ? unitPrice : "1";
      const effectiveTargetAmount = targetAmount && parseFloat(targetAmount) > 0
        ? targetAmount
        : effectiveUnitPrice; // Default to 1 unit worth

      // Default deadline: 30 days from now
      let deadlineDate: Date;
      if (aggregationDeadline) {
        deadlineDate = new Date(aggregationDeadline);
        if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
          return res.status(400).json({ error: "Aggregation deadline must be a valid future date" });
        }
      } else {
        deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + 30);
      }

      // Insert directly with all new fields
      const campaignId = crypto.randomUUID();
      const adminUser = adminUsername || (req as any).adminUsername || "admin";

      await db.insert(campaigns).values({
        id: campaignId,
        title: title.trim(),
        description: description?.trim() || "",
        rules: rules?.trim() || "Standard campaign rules apply.",
        imageUrl: imageUrl?.trim() || null,
        targetAmount: effectiveTargetAmount.toString(),
        minCommitment: minCommitment?.toString() || effectiveUnitPrice.toString(),
        maxCommitment: maxCommitment?.toString() || null,
        unitPrice: effectiveUnitPrice.toString(),
        state: "AGGREGATION",
        adminPublishStatus: "DRAFT",
        aggregationDeadline: deadlineDate,
        supplierAccepted: false,
        sku: sku?.trim() || null,
        productName: productName?.trim() || null,
        // Product details
        brand: brand?.trim() || null,
        modelNumber: modelNumber?.trim() || null,
        variant: variant?.trim() || null,
        shortDescription: shortDescription?.trim() || null,
        specs: specs ? (typeof specs === "string" ? specs : JSON.stringify(specs)) : null,
        // Images
        primaryImageUrl: primaryImageUrl?.trim() || null,
        galleryImageUrls: galleryImageUrls ? (typeof galleryImageUrls === "string" ? galleryImageUrls : JSON.stringify(galleryImageUrls)) : null,
        // Reference prices
        referencePrices: referencePrices ? (typeof referencePrices === "string" ? referencePrices : JSON.stringify(referencePrices)) : null,
        // Delivery
        deliveryStrategy: deliveryStrategy || "SUPPLIER_DIRECT",
        deliveryCostHandling: deliveryCostHandling || null,
        supplierDirectConfirmed: supplierDirectConfirmed || false,
        consolidationContactName: consolidationContactName?.trim() || null,
        consolidationCompany: consolidationCompany?.trim() || null,
        consolidationContactEmail: consolidationContactEmail?.trim() || null,
        consolidationAddressLine1: consolidationAddressLine1?.trim() || null,
        consolidationAddressLine2: consolidationAddressLine2?.trim() || null,
        consolidationCity: consolidationCity?.trim() || null,
        consolidationState: consolidationState?.trim() || null,
        consolidationPostalCode: consolidationPostalCode?.trim() || null,
        consolidationCountry: consolidationCountry?.trim() || null,
        consolidationPhone: consolidationPhone?.trim() || null,
        deliveryWindow: deliveryWindow?.trim() || null,
        fulfillmentNotes: fulfillmentNotes?.trim() || null,
        // Prerequisites
        productId: req.body.productId || null,
        supplierId: req.body.supplierId || null,
        consolidationPointId: req.body.consolidationPointId || null,
      });

      const campaignResult = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
      const campaign = campaignResult[0];

      // Add to campaign admin events (append-only)
      await db.insert(campaignAdminEvents).values({
        campaignId: campaign.id,
        adminId: adminUser,
        eventType: "CREATED",
        note: "Campaign created as DRAFT",
      });

      // Log admin action - CAMPAIGN_CREATE
      await storage.createAdminActionLog({
        campaignId: campaign.id,
        adminUsername: adminUser,
        action: "CAMPAIGN_CREATE",
        previousState: null,
        newState: "AGGREGATION",
        reason: "admin_create_campaign",
      });

      console.log(`[ADMIN] Campaign created: ${campaign.id} as DRAFT`);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Zod schema for campaign PATCH updates
  const campaignUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    sku: z.string().optional(),
    productName: z.string().optional(),
    targetUnits: z.number().int().positive().optional(),
    unitPrice: z.string().optional(),
    brand: z.string().optional(),
    modelNumber: z.string().optional(),
    variant: z.string().optional(),
    shortDescription: z.string().optional(),
    primaryImageUrl: z.string().optional(),
    galleryImageUrls: z.string().optional(),
    specs: z.string().optional(),
    referencePrices: z.string().optional(),
    rules: z.string().optional(),
    supplierDirectConfirmed: z.boolean().optional(),
    deliveryStrategy: z.enum(["SUPPLIER_DIRECT", "BULK_TO_CONSOLIDATION"]).optional(),
    deliveryWindow: z.string().optional(),
    fulfillmentNotes: z.string().optional(),
    consolidationContactName: z.string().optional(),
    consolidationCompany: z.string().optional(),
    consolidationContactEmail: z.string().email().optional().or(z.literal("")),
    consolidationAddressLine1: z.string().optional(),
    consolidationAddressLine2: z.string().optional(),
    consolidationCity: z.string().optional(),
    consolidationState: z.string().optional(),
    consolidationPostalCode: z.string().optional(),
    consolidationCountry: z.string().optional(),
    consolidationPhone: z.string().optional(),
    productId: z.string().uuid().nullable().optional(),
    supplierId: z.string().uuid().nullable().optional(),
    consolidationPointId: z.string().uuid().nullable().optional(),
  }).strict();

  // Admin: Update campaign (PATCH for editable fields)
  app.patch("/api/admin/campaigns/:id", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

      if (!campaign[0]) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Validate request body
      const parseResult = campaignUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid update data",
          details: parseResult.error.errors
        });
      }

      const updates = parseResult.data;
      const currentStatus = campaign[0].adminPublishStatus || "DRAFT";

      // Define which fields can be edited per status
      const draftEditableFields = [
        "title", "description", "sku", "productName", "targetUnits", "unitPrice",
        "brand", "modelNumber", "variant", "shortDescription", "primaryImageUrl",
        "galleryImageUrls", "specs", "referencePrices", "rules",
        "supplierDirectConfirmed", "deliveryStrategy", "deliveryWindow", "fulfillmentNotes",
        "consolidationContactName", "consolidationCompany", "consolidationContactEmail",
        "consolidationAddressLine1", "consolidationAddressLine2",
        "consolidationCity", "consolidationState", "consolidationPostalCode",
        "consolidationCountry", "consolidationPhone",
        "productId", "supplierId", "consolidationPointId"
      ];

      // Published campaigns cannot edit core fields or deliveryStrategy
      const publishedEditableFields = [
        "brand", "modelNumber", "variant", "shortDescription", "primaryImageUrl",
        "galleryImageUrls", "specs", "referencePrices", "rules",
        "deliveryWindow", "fulfillmentNotes",
        "consolidationContactName", "consolidationCompany", "consolidationContactEmail",
        "consolidationAddressLine1", "consolidationAddressLine2",
        "consolidationCity", "consolidationState", "consolidationPostalCode",
        "consolidationCountry", "consolidationPhone"
      ];

      const allowedFields = currentStatus === "DRAFT" ? draftEditableFields : publishedEditableFields;

      // Filter to only allowed fields
      const filteredUpdates: Record<string, any> = {};
      for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key) && (updates as any)[key] !== undefined) {
          filteredUpdates[key] = (updates as any)[key];
        }
      }

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      // Apply the updates
      await db.update(campaigns).set(filteredUpdates).where(eq(campaigns.id, campaignId));

      console.log(`[ADMIN] Campaign ${campaignId} updated:`, Object.keys(filteredUpdates));
      res.json({ success: true, updated: Object.keys(filteredUpdates) });
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Admin: Get campaigns list with full details
  app.get("/api/admin/campaigns", requireAdminAuth, async (req, res) => {
    try {
      if (req.query.mode === "legacy") {
        const campaignsList = await storage.getCampaignsWithStats();
        return res.json(campaignsList.map(c => ({
          id: c.id,
          title: c.title,
          state: c.state,
          adminPublishStatus: (c as any).adminPublishStatus || "DRAFT",
          aggregationDeadline: c.aggregationDeadline,
          participantCount: c.participantCount,
          totalCommitted: c.totalCommitted,
          createdAt: c.createdAt,
          productId: (c as any).productId,
          supplierId: (c as any).supplierId,
          consolidationPointId: (c as any).consolidationPointId,
          productName: (c as any).productName,
          supplierName: (c as any).supplierName,
          consolidationPointName: (c as any).consolidationPointName,
          productStatus: (c as any).productStatus,
          supplierStatus: (c as any).supplierStatus,
          consolidationPointStatus: (c as any).consolidationPointStatus,
        })));
      }

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          name_asc: "name_asc",
          name_desc: "name_desc",
          deadline_asc: "deadline_asc",
          deadline_desc: "deadline_desc",
          commitments_asc: "commitments_asc",
          commitments_desc: "commitments_desc",
          escrow_asc: "escrow_asc",
          escrow_desc: "escrow_desc",
          created_asc: "created_asc",
          created_desc: "created_desc",
          state_asc: "state_asc",
          state_desc: "state_desc",
        },
        defaultSort: "created_desc",
      });

      const publishStatus = typeof req.query.publishStatus === "string" ? req.query.publishStatus.trim() : undefined;
      const prerequisite = typeof req.query.prerequisite === "string" ? req.query.prerequisite.trim() : undefined;

      const conditions: any[] = [];
      if (listQuery.params.status) {
        conditions.push(eq(campaigns.state, listQuery.params.status as any));
      }
      if (publishStatus && publishStatus !== "all") {
        conditions.push(eq(campaigns.adminPublishStatus, publishStatus as any));
      }
      if (listQuery.params.search) {
        const searchValue = `%${listQuery.params.search}%`;
        conditions.push(
          or(
            ilike(campaigns.title, searchValue),
            ilike(campaigns.id, searchValue)
          )
        );
      }
      if (prerequisite === "ready") {
        conditions.push(
          and(
            isNotNull(campaigns.productId),
            isNotNull(campaigns.supplierId),
            isNotNull(campaigns.consolidationPointId)
          )
        );
      } else if (prerequisite === "incomplete") {
        conditions.push(
          or(
            isNull(campaigns.productId),
            isNull(campaigns.supplierId),
            isNull(campaigns.consolidationPointId)
          )
        );
      }
      if (listQuery.params.createdFrom) {
        const fromDate = new Date(listQuery.params.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        conditions.push(gte(campaigns.createdAt, fromDate));
      }
      if (listQuery.params.createdTo) {
        const toDate = new Date(listQuery.params.createdTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(campaigns.createdAt, toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const participantCountExpr = sql<number>`count(${commitments.id})::int`;
      const totalCommittedExpr = sql<number>`coalesce(sum(${commitments.amount}::numeric), 0)::float`;

      const [countResult] = await db
        .select({ count: countDistinct(campaigns.id) })
        .from(campaigns)
        .leftJoin(commitments, eq(commitments.campaignId, campaigns.id))
        .leftJoin(products, eq(campaigns.productId, products.id))
        .leftJoin(suppliers, eq(campaigns.supplierId, suppliers.id))
        .leftJoin(consolidationPoints, eq(campaigns.consolidationPointId, consolidationPoints.id))
        .where(whereClause);

      let orderByClause = [desc(campaigns.createdAt), desc(campaigns.id)];
      switch (listQuery.sortApplied) {
        case "name_asc":
          orderByClause = [asc(campaigns.title), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "name_desc":
          orderByClause = [desc(campaigns.title), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "deadline_asc":
          orderByClause = [asc(campaigns.aggregationDeadline), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "deadline_desc":
          orderByClause = [desc(campaigns.aggregationDeadline), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "commitments_asc":
          orderByClause = [asc(participantCountExpr), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "commitments_desc":
          orderByClause = [desc(participantCountExpr), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "escrow_asc":
          orderByClause = [asc(totalCommittedExpr), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "escrow_desc":
          orderByClause = [desc(totalCommittedExpr), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "created_asc":
          orderByClause = [asc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "state_asc":
          orderByClause = [asc(campaigns.state), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "state_desc":
          orderByClause = [desc(campaigns.state), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        default:
          break;
      }

      const rows = await db
        .select({
          id: campaigns.id,
          title: campaigns.title,
          state: campaigns.state,
          adminPublishStatus: campaigns.adminPublishStatus,
          aggregationDeadline: campaigns.aggregationDeadline,
          participantCount: participantCountExpr,
          totalCommitted: totalCommittedExpr,
          targetAmount: campaigns.targetAmount,
          createdAt: campaigns.createdAt,
          productId: campaigns.productId,
          supplierId: campaigns.supplierId,
          consolidationPointId: campaigns.consolidationPointId,
          productName: products.name,
          supplierName: suppliers.name,
          consolidationPointName: consolidationPoints.name,
          productStatus: products.status,
          supplierStatus: suppliers.status,
          consolidationPointStatus: consolidationPoints.status,
        })
        .from(campaigns)
        .leftJoin(commitments, eq(commitments.campaignId, campaigns.id))
        .leftJoin(products, eq(campaigns.productId, products.id))
        .leftJoin(suppliers, eq(campaigns.supplierId, suppliers.id))
        .leftJoin(consolidationPoints, eq(campaigns.consolidationPointId, consolidationPoints.id))
        .where(whereClause)
        .groupBy(
          campaigns.id,
          campaigns.title,
          campaigns.state,
          campaigns.adminPublishStatus,
          campaigns.aggregationDeadline,
          campaigns.targetAmount,
          campaigns.createdAt,
          campaigns.productId,
          campaigns.supplierId,
          campaigns.consolidationPointId,
          products.name,
          suppliers.name,
          consolidationPoints.name,
          products.status,
          suppliers.status,
          consolidationPoints.status
        )
        .orderBy(...orderByClause)
        .limit(listQuery.limit)
        .offset(listQuery.offset);

      res.json({
        rows,
        total: countResult?.count || 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
          publishStatus: publishStatus || null,
          prerequisite: prerequisite || null,
        },
      });
    } catch (error) {
      console.error("Error fetching admin campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Admin: Get single campaign with full details
  app.get("/api/admin/campaigns/:id/detail", requireAdminAuth, async (req, res) => {
    try {
      const campaign = await storage.getCampaignWithStats(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      // Include all campaign fields including publish status and consolidation
      const fullCampaign = await db.select().from(campaigns).where(eq(campaigns.id, req.params.id)).limit(1);
      const campaignData = fullCampaign[0];
      // Get commitment count for deliveryStrategy lock determination
      const campaignCommitments = await storage.getCommitments(req.params.id);
      const hasCommitments = campaignCommitments.length > 0;

      res.json({
        ...campaign,
        adminPublishStatus: campaignData?.adminPublishStatus || "DRAFT",
        // Core fields
        minCommitment: campaignData?.minCommitment,
        sku: campaignData?.sku,
        // Product details
        brand: campaignData?.brand,
        modelNumber: campaignData?.modelNumber,
        variant: campaignData?.variant,
        shortDescription: campaignData?.shortDescription,
        specs: campaignData?.specs,
        // Images
        primaryImageUrl: campaignData?.primaryImageUrl,
        galleryImageUrls: campaignData?.galleryImageUrls,
        // Reference prices
        referencePrices: campaignData?.referencePrices,
        // Delivery
        deliveryStrategy: campaignData?.deliveryStrategy || "SUPPLIER_DIRECT",
        deliveryCostHandling: campaignData?.deliveryCostHandling,
        supplierDirectConfirmed: campaignData?.supplierDirectConfirmed,
        consolidationContactName: campaignData?.consolidationContactName,
        consolidationCompany: campaignData?.consolidationCompany,
        consolidationContactEmail: campaignData?.consolidationContactEmail,
        consolidationAddressLine1: campaignData?.consolidationAddressLine1,
        consolidationAddressLine2: campaignData?.consolidationAddressLine2,
        consolidationCity: campaignData?.consolidationCity,
        consolidationState: campaignData?.consolidationState,
        consolidationPostalCode: campaignData?.consolidationPostalCode,
        consolidationCountry: campaignData?.consolidationCountry,
        consolidationPhone: campaignData?.consolidationPhone,
        deliveryWindow: campaignData?.deliveryWindow,
        fulfillmentNotes: campaignData?.fulfillmentNotes,
        // Prerequisites
        productId: campaignData?.productId,
        supplierId: campaignData?.supplierId,
        consolidationPointId: campaignData?.consolidationPointId,
        productName: (campaign as any).productName,
        supplierName: (campaign as any).supplierName,
        consolidationPointName: (campaign as any).consolidationPointName,
        productStatus: (campaign as any).productStatus,
        supplierStatus: (campaign as any).supplierStatus,
        consolidationPointStatus: (campaign as any).consolidationPointStatus,
        // Publish tracking
        publishedAt: campaignData?.publishedAt,
        publishedByAdminId: campaignData?.publishedByAdminId,
        // Edit permissions
        hasCommitments,
        commitmentCount: campaignCommitments.length,
      });
    } catch (error) {
      console.error("Error fetching admin campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  // Admin: Validate campaign for publishing (precheck)
  app.get("/api/admin/campaigns/:id/publish/validate", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

      if (!campaign[0]) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const validation = validateCampaignPublishable(campaign[0]);
      res.json(validation);
    } catch (error) {
      console.error("Error validating campaign:", error);
      res.status(500).json({ error: "Failed to validate campaign" });
    }
  });

  // Admin: Publish campaign (DRAFT/HIDDEN -> PUBLISHED)
  app.post("/api/admin/campaigns/:id/publish", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

      if (!campaign[0]) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const currentStatus = campaign[0].adminPublishStatus || "DRAFT";
      if (currentStatus === "PUBLISHED") {
        return res.status(400).json({ error: "Campaign is already published" });
      }

      // Validate campaign is ready to publish
      const validation = validateCampaignPublishable(campaign[0]);
      if (!validation.ok) {
        return res.status(400).json({
          error: "Campaign not ready to publish",
          missing: validation.missing
        });
      }

      const adminUsername = (req as any).adminUsername || "admin";

      await db.update(campaigns)
        .set({
          adminPublishStatus: "PUBLISHED",
          publishedAt: new Date(),
          publishedByAdminId: adminUsername,
        })
        .where(eq(campaigns.id, campaignId));

      // Add to campaign admin events (append-only)
      await db.insert(campaignAdminEvents).values({
        campaignId,
        adminId: adminUsername,
        eventType: "PUBLISHED",
        note: `Campaign published (was ${currentStatus})`,
      });

      await storage.createAdminActionLog({
        campaignId,
        adminUsername,
        action: "CAMPAIGN_PUBLISHED",
        reason: `Campaign published (was ${currentStatus})`,
      });

      res.json({ success: true, adminPublishStatus: "PUBLISHED" });
    } catch (error) {
      console.error("Error publishing campaign:", error);
      res.status(500).json({ error: "Failed to publish campaign" });
    }
  });

  // Admin: Hide campaign (PUBLISHED -> HIDDEN)
  app.post("/api/admin/campaigns/:id/hide", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

      if (!campaign[0]) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const currentStatus = campaign[0].adminPublishStatus || "DRAFT";
      if (currentStatus !== "PUBLISHED") {
        return res.status(400).json({ error: "Can only hide published campaigns" });
      }

      await db.update(campaigns)
        .set({ adminPublishStatus: "HIDDEN" })
        .where(eq(campaigns.id, campaignId));

      await storage.createAdminActionLog({
        campaignId,
        adminUsername: (req as any).adminUsername || "admin",
        action: "CAMPAIGN_HIDDEN",
        reason: "Campaign hidden from public view",
      });

      res.json({ success: true, adminPublishStatus: "HIDDEN" });
    } catch (error) {
      console.error("Error hiding campaign:", error);
      res.status(500).json({ error: "Failed to hide campaign" });
    }
  });

  // Fields editable when published (delivery + product details)
  const PUBLISHED_EDITABLE_FIELDS = [
    // Delivery fields
    "consolidationContactName", "consolidationCompany", "consolidationContactEmail",
    "consolidationAddressLine1", "consolidationAddressLine2", "consolidationCity",
    "consolidationState", "consolidationPostalCode", "consolidationCountry",
    "consolidationPhone", "deliveryWindow", "fulfillmentNotes", "deliveryCostHandling",
    "supplierDirectConfirmed",
    // Product detail fields (editable when published)
    "brand", "modelNumber", "variant", "shortDescription", "specs", "variations", "media",
    "primaryImageUrl", "galleryImageUrls", "referencePrices", "description"
  ];

  // Fields locked after publish (core campaign config)
  const PUBLISHED_LOCKED_FIELDS_SET = new Set([
    "title", "sku", "productName", "aggregationDeadline",
    "targetAmount", "targetUnits", "unitPrice", "minCommitment", "maxCommitment"
  ]);

  // deliveryStrategy can only be changed if no commitments exist
  const COMMITMENT_DEPENDENT_FIELDS = ["deliveryStrategy"];

  // Admin: Update campaign with field locking enforcement
  app.patch("/api/admin/campaigns/:id", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

      if (!campaign[0]) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const adminPublishStatus = campaign[0].adminPublishStatus || "DRAFT";
      const campaignState = campaign[0].state;
      const isPublished = adminPublishStatus === "PUBLISHED";
      const isFulfillmentPhase = campaignState === "FULFILLMENT" || campaignState === "RELEASED";

      const updateFields = req.body;
      const disallowedFields: string[] = [];
      const adminUsername = (req as any).adminUsername || "admin";

      // Get commitment count for deliveryStrategy change validation
      let commitmentCount = 0;
      if (updateFields.deliveryStrategy && updateFields.deliveryStrategy !== campaign[0].deliveryStrategy) {
        const commitmentsResult = await storage.getCommitments(campaignId);
        commitmentCount = commitmentsResult.length;
      }

      // Validate field locks
      for (const field of Object.keys(updateFields)) {
        // Lock core fields when published
        if (isPublished && PUBLISHED_LOCKED_FIELDS_SET.has(field)) {
          disallowedFields.push(field);
        }
        // Lock deliveryStrategy when published AND has commitments
        if (isPublished && COMMITMENT_DEPENDENT_FIELDS.includes(field) && commitmentCount > 0) {
          disallowedFields.push(`${field} (has ${commitmentCount} commitments)`);
        }
        // Lock consolidation fields during fulfillment phase
        if (isFulfillmentPhase && field.startsWith("consolidation")) {
          disallowedFields.push(field);
        }
      }

      if (disallowedFields.length > 0) {
        const message = isFulfillmentPhase
          ? `Campaign is in fulfillment; these fields are locked: ${disallowedFields.join(", ")}`
          : `Campaign is published; these fields are locked: ${disallowedFields.join(", ")}`;
        return res.status(400).json({ error: "Field update not allowed", message, disallowedFields });
      }

      // Get changed fields for audit
      const changedFields = getChangedFields(campaign[0], updateFields);

      // Build safe update object
      const safeUpdate: Record<string, any> = {};
      for (const [key, value] of Object.entries(updateFields)) {
        // Skip locked fields
        if (isPublished && PUBLISHED_LOCKED_FIELDS_SET.has(key)) continue;
        // Map camelCase to snake_case for DB
        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        safeUpdate[dbKey] = value;
      }

      if (Object.keys(safeUpdate).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      await db.update(campaigns)
        .set(safeUpdate)
        .where(eq(campaigns.id, campaignId));

      // Add to campaign admin events (append-only) for PUBLISHED campaigns
      if (isPublished && changedFields.length > 0) {
        await db.insert(campaignAdminEvents).values({
          campaignId,
          adminId: adminUsername,
          eventType: "UPDATED",
          changedFields: JSON.stringify(changedFields),
          note: `Updated ${changedFields.length} field(s)`,
        });
      }

      await storage.createAdminActionLog({
        campaignId,
        adminUsername,
        action: "CAMPAIGN_UPDATED",
        reason: `Updated fields: ${Object.keys(updateFields).join(", ")}`,
      });

      const updated = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Admin: Get commitments for a campaign
  app.get("/api/admin/campaigns/:id/commitments", requireAdminAuth, async (req, res) => {
    try {
      const commitmentsList = await storage.getCommitments(req.params.id);
      res.json(commitmentsList.map(c => ({
        id: c.id,
        referenceNumber: c.referenceNumber,
        participantName: c.participantName,
        participantEmail: c.participantEmail,
        quantity: c.quantity,
        amount: c.amount,
        status: c.status,
        createdAt: c.createdAt,
        deliveryId: null,
      })));
    } catch (error) {
      console.error("Error fetching admin commitments:", error);
      res.status(500).json({ error: "Failed to fetch commitments" });
    }
  });

  // Admin: Perform campaign action (unified action endpoint)
  // Maps action codes to state transitions
  app.post("/api/admin/campaigns/:id/action", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const { actionCode } = req.body;
      const adminUsername = (req as any).adminUsername || "admin";

      if (!actionCode) {
        return res.status(400).json({ error: "actionCode is required" });
      }

      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const currentState = campaign.state as CampaignState;
      let newState: CampaignState | null = null;
      let reason = "";

      // Map action codes to state transitions
      switch (actionCode) {
        case "MARK_FUNDED":
          if (currentState !== "AGGREGATION") {
            return res.status(400).json({ error: "Campaign must be in AGGREGATION state to mark as funded" });
          }
          newState = "SUCCESS";
          reason = "Target met, campaign marked as funded by admin";
          break;

        case "START_FULFILLMENT":
          if (currentState !== "SUCCESS") {
            return res.status(400).json({ error: "Campaign must be in SUCCESS (funded) state to start fulfillment" });
          }
          if (!campaign.supplierAcceptedAt) {
            return res.status(400).json({ error: "Supplier must accept before fulfillment can start" });
          }
          newState = "FULFILLMENT";
          reason = "Fulfillment started by admin";
          break;

        case "RELEASE_ESCROW":
          if (currentState !== "FULFILLMENT") {
            return res.status(400).json({ error: "Campaign must be in FULFILLMENT state to release escrow" });
          }
          newState = "RELEASED";
          reason = "Escrow released by admin after fulfillment";
          break;

        case "FAIL_CAMPAIGN":
          if (currentState === "RELEASED" || currentState === "FAILED") {
            return res.status(400).json({ error: "Cannot fail a campaign that is already released or failed" });
          }
          newState = "FAILED";
          reason = "Campaign failed by admin";
          break;

        default:
          return res.status(400).json({ error: `Unknown action code: ${actionCode}` });
      }

      // Check valid transitions
      const validTransitions = VALID_TRANSITIONS[currentState];
      if (!validTransitions.includes(newState)) {
        return res.status(400).json({
          error: `Invalid transition: ${currentState} -> ${newState}`,
          allowedTransitions: validTransitions
        });
      }

      // Perform the transition
      await storage.updateCampaignState(campaignId, newState);

      // Log the action
      await storage.createAdminActionLog({
        campaignId,
        adminUsername,
        action: "state_transition",
        previousState: currentState,
        newState,
        reason,
      });

      res.json({
        success: true,
        previousState: currentState,
        newState,
        message: `Campaign transitioned from ${currentState} to ${newState}`
      });
    } catch (error) {
      console.error("Error performing admin action:", error);
      res.status(500).json({ error: "Failed to perform action" });
    }
  });

  // Admin: Get action logs (append-only audit trail)
  // Protected by requireAdminAuth middleware
  app.get("/api/admin/logs", requireAdminAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          created_desc: "created_desc",
        },
        defaultSort: "created_desc",
      });

      const campaignId = typeof req.query.campaignId === "string" ? req.query.campaignId.trim() : undefined;
      const commitmentId = typeof req.query.commitmentId === "string" ? req.query.commitmentId.trim() : undefined;

      const conditions: any[] = [];
      if (campaignId) {
        conditions.push(eq(adminActionLogs.campaignId, campaignId));
      }
      if (commitmentId) {
        conditions.push(eq(adminActionLogs.commitmentId, commitmentId));
      }
      if (listQuery.params.search) {
        const searchValue = `%${listQuery.params.search}%`;
        conditions.push(
          or(
            ilike(adminActionLogs.adminUsername, searchValue),
            ilike(adminActionLogs.action, searchValue),
            ilike(adminActionLogs.reason, searchValue),
            ilike(adminActionLogs.campaignId, searchValue),
            ilike(adminActionLogs.commitmentId, searchValue)
          )
        );
      }
      if (listQuery.params.createdFrom) {
        const fromDate = new Date(listQuery.params.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        conditions.push(gte(adminActionLogs.createdAt, fromDate));
      }
      if (listQuery.params.createdTo) {
        const toDate = new Date(listQuery.params.createdTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(adminActionLogs.createdAt, toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: count() })
        .from(adminActionLogs)
        .where(whereClause);

      const rows = await db
        .select({
          id: adminActionLogs.id,
          adminUsername: adminActionLogs.adminUsername,
          action: adminActionLogs.action,
          previousState: adminActionLogs.previousState,
          newState: adminActionLogs.newState,
          reason: adminActionLogs.reason,
          campaignId: adminActionLogs.campaignId,
          commitmentId: adminActionLogs.commitmentId,
          createdAt: adminActionLogs.createdAt,
        })
        .from(adminActionLogs)
        .where(whereClause)
        .orderBy(desc(adminActionLogs.createdAt), desc(adminActionLogs.id))
        .limit(listQuery.limit)
        .offset(listQuery.offset);

      res.json({
        rows,
        total: countResult?.count || 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
          campaignId: campaignId || null,
          commitmentId: commitmentId || null,
        },
      });
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ error: "Failed to fetch admin logs" });
    }
  });

  // Admin: Get escrow ledger for campaign (append-only transparency)
  // Protected by requireAdminAuth middleware
  app.get("/api/admin/campaigns/:id/escrow", requireAdminAuth, async (req, res) => {
    try {
      const entries = await storage.getEscrowEntries(req.params.id);
      const balance = await storage.getCampaignEscrowBalance(req.params.id);
      res.json({ entries, currentBalance: balance });
    } catch (error) {
      console.error("Error fetching escrow entries:", error);
      res.status(500).json({ error: "Failed to fetch escrow entries" });
    }
  });

  // Admin: Control Room - Overview tiles and queues
  app.get("/api/admin/control-room", requireAdminAuth, async (req, res) => {
    try {
      const campaigns = await storage.getCampaignsWithStats();
      const allEntries = await db.select().from(escrowLedger);

      const inAggregation = campaigns.filter(c => c.state === "AGGREGATION").length;
      const needsAction = campaigns.filter(c =>
        c.state === "SUCCESS" ||
        (c.state === "AGGREGATION" && new Date(c.aggregationDeadline) < new Date())
      ).length;

      const totalLocked = allEntries
        .filter(e => e.entryType === "LOCK")
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalReturned = allEntries
        .filter(e => e.entryType === "REFUND")
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalReleased = allEntries
        .filter(e => e.entryType === "RELEASE")
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

      res.json({
        tiles: {
          campaignsInAggregation: inAggregation,
          campaignsNeedingAction: needsAction,
          pendingRefunds: 0,
          overdueDeliveries: 0,
          totalEscrowLocked: totalLocked - totalReturned - totalReleased,
        },
        queues: {
          needsAction: campaigns
            .filter(c => c.state === "SUCCESS" || (c.state === "AGGREGATION" && new Date(c.aggregationDeadline) < new Date()))
            .slice(0, 5)
            .map(c => ({ id: c.id, title: c.title, state: c.state, deadline: c.aggregationDeadline })),
          recentRefunds: [],
          overdueDeliveries: [],
        },
      });
    } catch (error) {
      console.error("Error fetching control room:", error);
      res.status(500).json({ error: "Failed to fetch control room data" });
    }
  });

  // Admin: Clearing Snapshot
  app.get("/api/admin/clearing/snapshot", requireAdminAuth, async (req, res) => {
    try {
      const allEntries = await db.select().from(escrowLedger);

      const totalLocked = allEntries
        .filter(e => e.entryType === "LOCK")
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalReturned = allEntries
        .filter(e => e.entryType === "REFUND")
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalReleased = allEntries
        .filter(e => e.entryType === "RELEASE")
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

      res.json({
        inEscrow: totalLocked - totalReturned - totalReleased,
        released: totalReleased,
        returned: totalReturned,
        currency: "USD",
      });
    } catch (error) {
      console.error("Error fetching clearing snapshot:", error);
      res.status(500).json({ error: "Failed to fetch clearing snapshot" });
    }
  });

  // Admin: Clearing Ledger Explorer
  app.get("/api/admin/clearing/ledger", requireAdminAuth, async (req, res) => {
    try {
      const entries = await db.select().from(escrowLedger).orderBy(desc(escrowLedger.createdAt)).limit(500);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching clearing ledger:", error);
      res.status(500).json({ error: "Failed to fetch clearing ledger" });
    }
  });

  // Admin: Refunds list (REFUND type entries from escrow ledger)
  app.get("/api/admin/refunds", requireAdminAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          created_desc: "created_desc",
          amount_desc: "amount_desc",
        },
        defaultSort: "created_desc",
      });

      const reason = typeof req.query.reason === "string" ? req.query.reason.trim() : undefined;
      const commitmentCode = typeof req.query.commitmentCode === "string" ? req.query.commitmentCode.trim() : undefined;
      const campaignId = typeof req.query.campaignId === "string" ? req.query.campaignId.trim() : undefined;

      const conditions: any[] = [eq(escrowLedger.entryType, "REFUND")];
      if (reason) {
        conditions.push(eq(escrowLedger.reason, reason));
      }
      if (campaignId) {
        conditions.push(eq(escrowLedger.campaignId, campaignId));
      }
      if (listQuery.params.search) {
        const searchValue = `%${listQuery.params.search}%`;
        conditions.push(
          or(
            ilike(commitments.referenceNumber, searchValue),
            ilike(campaigns.title, searchValue)
          )
        );
      }
      if (commitmentCode) {
        conditions.push(ilike(commitments.referenceNumber, `%${commitmentCode}%`));
      }
      if (listQuery.params.createdFrom) {
        const fromDate = new Date(listQuery.params.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        conditions.push(gte(escrowLedger.createdAt, fromDate));
      }
      if (listQuery.params.createdTo) {
        const toDate = new Date(listQuery.params.createdTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(escrowLedger.createdAt, toDate));
      }

      const whereClause = and(...conditions);

      const [countResult] = await db
        .select({ count: count() })
        .from(escrowLedger)
        .leftJoin(commitments, eq(escrowLedger.commitmentId, commitments.id))
        .leftJoin(campaigns, eq(escrowLedger.campaignId, campaigns.id))
        .where(whereClause);

      const rows = await db
        .select({
          id: escrowLedger.id,
          amount: escrowLedger.amount,
          createdAt: escrowLedger.createdAt,
          reason: escrowLedger.reason,
          status: sql`'COMPLETED'`.as("status"),
          campaignId: escrowLedger.campaignId,
          campaignName: campaigns.title,
          commitmentCode: commitments.referenceNumber,
        })
        .from(escrowLedger)
        .leftJoin(commitments, eq(escrowLedger.commitmentId, commitments.id))
        .leftJoin(campaigns, eq(escrowLedger.campaignId, campaigns.id))
        .where(whereClause)
        .orderBy(desc(escrowLedger.createdAt), desc(escrowLedger.id))
        .limit(listQuery.limit)
        .offset(listQuery.offset);

      res.json({
        rows,
        total: countResult?.count || 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
          reason: reason || null,
          campaignId: campaignId || null,
          commitmentCode: commitmentCode || null,
        },
      });
    } catch (error) {
      console.error("Error fetching admin refunds:", error);
      res.status(500).json({ error: "Failed to fetch refunds" });
    }
  });

  // Admin: Refund Plans list (placeholder - returns empty for now)
  app.get("/api/admin/refund-plans", requireAdminAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          created_desc: "created_desc",
        },
        defaultSort: "created_desc",
      });

      res.json({
        rows: [],
        total: 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
        },
      });
    } catch (error) {
      console.error("Error fetching refund plans:", error);
      res.status(500).json({ error: "Failed to fetch refund plans" });
    }
  });

  // Admin: Refund Plan detail (placeholder)
  app.get("/api/admin/refund-plans/:id", requireAdminAuth, async (req, res) => {
    res.status(404).json({ error: "Refund plan not found" });
  });

  // Admin: Exceptions list (placeholder HVLC contract)
  app.get("/api/admin/exceptions", requireAdminAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          created_desc: "created_desc",
        },
        defaultSort: "created_desc",
      });

      res.json({
        rows: [],
        total: 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
        },
      });
    } catch (error) {
      console.error("Error fetching admin exceptions:", error);
      res.status(500).json({ error: "Failed to fetch exceptions" });
    }
  });

  // Admin: Refund Plan rows (placeholder)
  app.get("/api/admin/refund-plans/:id/rows", requireAdminAuth, async (req, res) => {
    res.json([]);
  });

  // Admin: Import Refund Plan (CSV)
  app.post("/api/admin/refund-plans/import", requireAdminAuth, async (req, res) => {
    try {
      res.status(501).json({ error: "CSV import not yet implemented. Plan creation requires schema extension." });
    } catch (error) {
      console.error("Error importing refund plan:", error);
      res.status(500).json({ error: "Failed to import refund plan" });
    }
  });

  // Admin: Refund reason reference table export (codes ↔ labels)
  // This is the authoritative source for operators to find valid reason codes
  app.get("/api/admin/refunds/reasons/export", requireAdminAuth, async (req, res) => {
    try {
      const reasons = [
        { reason_code: "campaign_failed_refund", label: "Campaign Failed", description: "Bulk refund when campaign fails to reach target", scope: "campaign", active: "true" },
        { reason_code: "admin_manual_refund", label: "Manual Refund", description: "Manual refund initiated by administrator", scope: "commitment", active: "true" },
        { reason_code: "commitment_cancelled", label: "Commitment Cancelled", description: "Refund due to commitment cancellation", scope: "commitment", active: "true" },
        { reason_code: "duplicate_commitment", label: "Duplicate Commitment", description: "Refund for duplicate or erroneous commitment", scope: "commitment", active: "true" },
        { reason_code: "participant_request", label: "Participant Request", description: "Refund requested by participant before campaign deadline", scope: "commitment", active: "true" },
        { reason_code: "supplier_unable_to_fulfill", label: "Supplier Unable to Fulfill", description: "Refund when supplier cannot fulfill the order", scope: "campaign", active: "true" },
        { reason_code: "quality_issue", label: "Quality Issue", description: "Refund due to product quality problems", scope: "commitment", active: "true" },
        { reason_code: "delivery_failure", label: "Delivery Failure", description: "Refund due to failed delivery", scope: "commitment", active: "true" },
      ];

      const headers = ["reason_code", "label", "description", "scope", "active"];
      const rows = [headers.join(",")];

      for (const reason of reasons) {
        const row = headers.map(h => `"${(reason[h as keyof typeof reason] || "").replace(/"/g, '""')}"`);
        rows.push(row.join(","));
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="refund_reasons_reference.csv"');
      res.send(rows.join("\n"));
    } catch (error) {
      console.error("Error exporting refund reasons:", error);
      res.status(500).json({ error: "Failed to export refund reasons" });
    }
  });

  // Admin: Export eligible commitments for refund planning (campaign-scoped)
  // Uses escrow ledger as source of truth for refundable amounts
  // Any commitment with positive balance (LOCK - REFUND - RELEASE > 0) is eligible
  app.get("/api/admin/campaigns/:id/refunds/eligible/export", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await storage.getCampaignWithStats(campaignId);

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const allCommitments = await storage.getCommitments(campaignId);

      // Get escrow entries to calculate refundable amounts (source of truth)
      const escrowEntries = await db
        .select()
        .from(escrowLedger)
        .where(eq(escrowLedger.campaignId, campaignId));

      // Calculate refundable amount per commitment from escrow ledger
      // This is the authoritative source - don't rely on commitment.status
      const eligibleCommitments = allCommitments
        .map((c: { id: string; referenceNumber: string; status: string }) => {
          const commitmentEntries = escrowEntries.filter(e => e.commitmentId === c.id);
          const locked = commitmentEntries
            .filter(e => e.entryType === "LOCK")
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
          const returned = commitmentEntries
            .filter(e => e.entryType === "REFUND" || e.entryType === "RELEASE")
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
          const refundableAmount = locked - returned;

          return {
            commitment_code: c.referenceNumber,
            refundable_amount: refundableAmount.toFixed(2),
            currency: "USD",
            current_status: c.status,
            // Derive ledger-based status for clarity
            ledger_status: refundableAmount > 0 ? "FUNDS_HELD" : "FULLY_RETURNED",
          };
        })
        .filter((c: { refundable_amount: string }) => parseFloat(c.refundable_amount) > 0);

      const headers = ["commitment_code", "refundable_amount", "currency", "current_status"];
      const rows = [headers.join(",")];

      for (const commitment of eligibleCommitments) {
        const row = headers.map(h => `"${(commitment[h as keyof typeof commitment] || "").replace(/"/g, '""')}"`);
        rows.push(row.join(","));
      }

      await storage.createAdminActionLog({
        campaignId,
        adminUsername: (req as any).adminUsername || "admin",
        action: "REFUND_ELIGIBLE_EXPORT",
        reason: `Exported ${eligibleCommitments.length} eligible commitments for refund planning`,
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="eligible_refunds_${campaignId.slice(0, 8)}.csv"`);
      res.send(rows.join("\n"));
    } catch (error) {
      console.error("Error exporting eligible commitments:", error);
      res.status(500).json({ error: "Failed to export eligible commitments" });
    }
  });

  // Admin: Download refund plan CSV template (campaign-scoped)
  app.get("/api/admin/campaigns/:id/refunds/template", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await storage.getCampaignWithStats(campaignId);

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const template = `commitment_code,reason_code,note
ABC12345,campaign_failed_refund,"Campaign did not reach target"
DEF67890,admin_manual_refund,"Participant requested early refund"`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="refund_plan_template_${campaignId.slice(0, 8)}.csv"`);
      res.send(template);
    } catch (error) {
      console.error("Error downloading refund plan template:", error);
      res.status(500).json({ error: "Failed to download template" });
    }
  });

  // Admin: Deliveries list
  app.get("/api/admin/deliveries", requireAdminAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const listQuery = parseListQuery(req.query as Record<string, string | string[] | undefined>, {
        defaultPageSize: 25,
        allowedPageSizes: [25, 50, 100],
        allowedSorts: {
          campaign_asc: "campaign_asc",
          campaign_desc: "campaign_desc",
          status_asc: "status_asc",
          status_desc: "status_desc",
          last_update_asc: "last_update_asc",
          last_update_desc: "last_update_desc",
        },
        defaultSort: "campaign_asc",
      });

      const overdueOnly = typeof req.query.overdueOnly === "string" ? req.query.overdueOnly === "true" : false;

      const conditions: any[] = [
        or(eq(campaigns.state, "FULFILLMENT"), eq(campaigns.state, "RELEASED")),
      ];
      if (listQuery.params.search) {
        const searchValue = `%${listQuery.params.search}%`;
        conditions.push(ilike(campaigns.title, searchValue));
      }
      if (listQuery.params.status === "COMPLETED") {
        conditions.push(eq(campaigns.state, "RELEASED"));
      } else if (listQuery.params.status === "IN_PROGRESS") {
        conditions.push(eq(campaigns.state, "FULFILLMENT"));
      }
      if (overdueOnly) {
        conditions.push(sql`false`);
      }
      if (listQuery.params.createdFrom) {
        const fromDate = new Date(listQuery.params.createdFrom);
        fromDate.setHours(0, 0, 0, 0);
        conditions.push(gte(campaigns.createdAt, fromDate));
      }
      if (listQuery.params.createdTo) {
        const toDate = new Date(listQuery.params.createdTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(campaigns.createdAt, toDate));
      }

      const whereClause = and(...conditions);
      const statusExpr = sql<string>`case when ${campaigns.state} = 'RELEASED' then 'COMPLETED' else 'IN_PROGRESS' end`;

      const [countResult] = await db
        .select({ count: count() })
        .from(campaigns)
        .where(whereClause);

      let orderByClause = [asc(campaigns.title), desc(campaigns.createdAt), desc(campaigns.id)];
      switch (listQuery.sortApplied) {
        case "campaign_desc":
          orderByClause = [desc(campaigns.title), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "status_asc":
          orderByClause = [asc(statusExpr), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "status_desc":
          orderByClause = [desc(statusExpr), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "last_update_asc":
          orderByClause = [asc(campaigns.supplierAcceptedAt), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        case "last_update_desc":
          orderByClause = [desc(campaigns.supplierAcceptedAt), desc(campaigns.createdAt), desc(campaigns.id)];
          break;
        default:
          break;
      }

      const rows = await db
        .select({
          campaignId: campaigns.id,
          campaignName: campaigns.title,
          deliveryStrategy: sql<string>`'Standard'`.as("deliveryStrategy"),
          status: statusExpr.as("status"),
          lastUpdateAt: campaigns.supplierAcceptedAt,
          nextUpdateDueAt: sql<string | null>`null`.as("nextUpdateDueAt"),
          isOverdue: sql<boolean>`false`.as("isOverdue"),
        })
        .from(campaigns)
        .where(whereClause)
        .orderBy(...orderByClause)
        .limit(listQuery.limit)
        .offset(listQuery.offset);

      res.json({
        rows,
        total: countResult?.count || 0,
        page: listQuery.params.page,
        pageSize: listQuery.params.pageSize,
        sortApplied: listQuery.sortApplied,
        filtersApplied: {
          ...listQuery.filtersApplied,
          overdueOnly: overdueOnly ? "true" : null,
        },
      });
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });

  // Admin: Fulfillment summary for campaign
  app.get("/api/admin/campaigns/:id/fulfillment", requireAdminAuth, async (req, res) => {
    try {
      const campaign = await storage.getCampaignWithStats(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const commitmentsList = await storage.getCommitments(req.params.id);
      const deliveredCount = commitmentsList.filter(c => c.status === "RELEASED").length;

      res.json({
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        deliveryStrategy: "Standard",
        currentMilestone: campaign.state,
        lastUpdateAt: campaign.supplierAcceptedAt || null,
        nextUpdateDueAt: null,
        totalCommitments: commitmentsList.length,
        deliveredCount,
      });
    } catch (error) {
      console.error("Error fetching fulfillment summary:", error);
      res.status(500).json({ error: "Failed to fetch fulfillment summary" });
    }
  });

  // In-memory milestone storage (would be database in production)
  const campaignMilestones: Map<string, Array<{
    id: string;
    milestone: string;
    note: string;
    createdAt: string;
    actor: string;
  }>> = new Map();

  // Admin: Get fulfillment milestones for campaign
  app.get("/api/admin/campaigns/:id/fulfillment/milestones", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const milestones = campaignMilestones.get(campaignId) || [];
      res.json(milestones.slice().reverse()); // Most recent first
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  // Admin: Add fulfillment milestone (append-only)
  app.post("/api/admin/campaigns/:id/fulfillment/milestone", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const { milestone, note } = req.body;

      if (!milestone || !note) {
        return res.status(400).json({ error: "Milestone and note are required" });
      }

      const campaign = await storage.getCampaignWithStats(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const newEvent = {
        id: crypto.randomUUID(),
        milestone,
        note,
        createdAt: new Date().toISOString(),
        actor: (req as any).adminUsername || "admin",
      };

      if (!campaignMilestones.has(campaignId)) {
        campaignMilestones.set(campaignId, []);
      }
      campaignMilestones.get(campaignId)!.push(newEvent);

      // Log admin action
      await storage.createAdminActionLog({
        campaignId,
        adminUsername: newEvent.actor,
        action: "ADD_MILESTONE",
        reason: `${milestone}: ${note}`,
      });

      res.json({ success: true, event: newEvent });
    } catch (error) {
      console.error("Error adding milestone:", error);
      res.status(500).json({ error: "Failed to add milestone" });
    }
  });

  // Admin: Import fulfillment updates (CSV)
  app.post("/api/admin/campaigns/:id/fulfillment/import", requireAdminAuth, async (req, res) => {
    try {
      res.status(501).json({ error: "CSV import not yet implemented. Delivery events require schema extension." });
    } catch (error) {
      console.error("Error importing fulfillment updates:", error);
      res.status(500).json({ error: "Failed to import fulfillment updates" });
    }
  });

  // Admin: Export direct supplier manifest (SUPPLIER_DIRECT strategy)
  // Includes per-recipient delivery data for direct-to-customer fulfillment
  // Eligibility: commitments that are LOCKED (not refunded/released)
  // SECURITY: Only allowed for SUPPLIER_DIRECT strategy campaigns
  app.get("/api/admin/campaigns/:id/fulfillment/export/direct", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await storage.getCampaignWithStats(campaignId);

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Strategy validation: direct export requires SUPPLIER_DIRECT or Standard (default)
      // BULK_TO_CONSOLIDATION campaigns cannot use direct export (PII protection)
      const strategy = (campaign as any).deliveryStrategy || "Standard";
      if (strategy === "BULK_TO_CONSOLIDATION") {
        console.warn(`[SECURITY] Direct export denied for BULK_TO_CONSOLIDATION campaign: ${campaignId}`);
        await storage.createAdminActionLog({
          campaignId,
          adminUsername: (req as any).adminUsername || "admin",
          action: "FULFILLMENT_EXPORT_DENIED",
          reason: "Direct export not allowed for BULK_TO_CONSOLIDATION strategy",
        });
        return res.status(400).json({
          error: "Strategy mismatch",
          message: "Direct manifest export is not available for bulk consolidation campaigns. Use bulk export instead."
        });
      }

      // Get eligible commitments: LOCKED status only (not refunded/released, not exception)
      // Since we don't have per-commitment delivery state yet, LOCKED is safest approximation
      const allCommitments = await storage.getCommitments(campaignId);
      const eligibleCommitments = allCommitments.filter((c: { status: string }) => c.status === "LOCKED");

      // Get user profiles for delivery data
      const rows: string[] = [];
      const headers = [
        "commitment_code", "sku", "product_name", "quantity",
        "recipient_name", "address_line1", "address_line2", "city", "state", "postal_code", "country",
        "phone", "email", "delivery_notes"
      ];
      rows.push(headers.join(","));

      for (const commitment of eligibleCommitments) {
        // Get user profile if user_id exists
        let profile: any = null;
        if (commitment.userId) {
          profile = await storage.getUserProfile(commitment.userId);
        }

        const row = [
          commitment.referenceNumber,
          "SKU-" + campaign.id.slice(0, 8).toUpperCase(), // Placeholder SKU
          campaign.title,
          String(commitment.quantity),
          profile?.fullName || commitment.participantName,
          profile?.defaultAddressLine1 || "",
          profile?.defaultAddressLine2 || "",
          profile?.city || "",
          profile?.state || "",
          profile?.zip || "",
          profile?.country || "USA",
          profile?.phone || "",
          commitment.participantEmail,
          "" // delivery_notes
        ].map(v => `"${(v || "").replace(/"/g, '""')}"`);
        rows.push(row.join(","));
      }

      // Log audit event
      await storage.createAdminActionLog({
        campaignId,
        adminUsername: (req as any).adminUsername || "admin",
        action: "FULFILLMENT_EXPORT_CREATED",
        reason: JSON.stringify({ strategy: "SUPPLIER_DIRECT", rowCount: eligibleCommitments.length }),
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="manifest-direct-${campaignId.slice(0, 8)}.csv"`);
      res.send(rows.join("\n"));
    } catch (error) {
      console.error("Error exporting direct manifest:", error);
      res.status(500).json({ error: "Failed to export direct manifest" });
    }
  });

  // Admin: Export bulk supplier manifest (BULK_TO_CONSOLIDATION strategy)
  // Aggregated totals for bulk shipment to consolidation point (no end-user PII)
  app.get("/api/admin/campaigns/:id/fulfillment/export/bulk", requireAdminAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await storage.getCampaignWithStats(campaignId);

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Get eligible commitments: LOCKED status only
      const allCommitments = await storage.getCommitments(campaignId);
      const eligibleCommitments = allCommitments.filter((c: { status: string }) => c.status === "LOCKED");

      // Calculate total quantity
      const totalQuantity = eligibleCommitments.reduce((sum: number, c: { quantity: number }) => sum + c.quantity, 0);

      // Build bulk manifest (no end-user PII)
      const headers = [
        "sku", "product_name", "total_quantity",
        "consolidation_contact_name", "consolidation_company",
        "consolidation_address_line1", "consolidation_address_line2", "consolidation_city",
        "consolidation_state", "consolidation_postal_code", "consolidation_country",
        "consolidation_phone", "delivery_window", "fulfillment_notes"
      ];

      const row = [
        "SKU-" + campaign.id.slice(0, 8).toUpperCase(),
        campaign.title,
        String(totalQuantity),
        "Alpmera Consolidation",
        "Alpmera Inc.",
        "TBD - Consolidation Address Line 1",
        "",
        "TBD - City",
        "TBD - State",
        "TBD - Postal",
        "USA",
        "",
        "TBD",
        `Total eligible commitments: ${eligibleCommitments.length}`
      ].map(v => `"${(v || "").replace(/"/g, '""')}"`);

      // Log audit event
      await storage.createAdminActionLog({
        campaignId,
        adminUsername: (req as any).adminUsername || "admin",
        action: "FULFILLMENT_EXPORT_CREATED",
        reason: JSON.stringify({ strategy: "BULK_TO_CONSOLIDATION", rowCount: 1, totalQuantity }),
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="manifest-bulk-${campaignId.slice(0, 8)}.csv"`);
      res.send([headers.join(","), row.join(",")].join("\n"));
    } catch (error) {
      console.error("Error exporting bulk manifest:", error);
      res.status(500).json({ error: "Failed to export bulk manifest" });
    }
  });

  // Admin: Download import template for delivery updates
  app.get("/api/admin/fulfillment/import-template", requireAdminAuth, async (req, res) => {
    try {
      const headers = ["commitment_code", "milestone_code", "carrier", "tracking_url", "note"];
      const exampleRow = ["ALP-XXXX-XXXX", "SHIPPED", "UPS", "https://tracking.example.com/...", "Shipped via ground"];

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="delivery-updates-template.csv"`);
      res.send([headers.join(","), exampleRow.join(",")].join("\n"));
    } catch (error) {
      console.error("Error generating import template:", error);
      res.status(500).json({ error: "Failed to generate import template" });
    }
  });

  return httpServer;
}
