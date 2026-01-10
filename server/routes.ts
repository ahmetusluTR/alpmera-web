import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  type CampaignState, 
  type CommitmentStatus,
  VALID_TRANSITIONS,
  insertCommitmentSchema,
  updateUserProfileSchema,
  escrowLedger,
  commitments,
  campaigns,
  campaignAdminEvents
} from "@shared/schema";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createHash, randomBytes, randomInt, randomUUID } from "crypto";

// Auth request schemas
const authStartSchema = z.object({
  email: z.string().email("Valid email is required"),
});

const authVerifySchema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().length(6, "Code must be 6 digits"),
});

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

  // Delivery strategy specific validation
  if (campaign.deliveryStrategy === "CONSOLIDATION_POINT") {
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
    
    console.log(`[ADMIN] Successful login: ${req.session.adminUsername} from ${req.ip}`);
    res.json({ 
      success: true,
      message: "Admin logged in successfully",
      username: req.session.adminUsername
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
  
  // Check admin session status
  app.get("/api/admin/session", (req, res) => {
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

  // Get all campaigns with stats (public endpoint)
  // Only returns PUBLISHED campaigns, redacts monetary fields for list view
  app.get("/api/campaigns", async (req, res) => {
    try {
      const allCampaigns = await storage.getCampaignsWithStats();
      
      // Filter to only PUBLISHED campaigns
      const publishedCampaigns = allCampaigns.filter(
        (c: any) => c.adminPublishStatus === "PUBLISHED"
      );
      
      // Redact monetary fields for public/list view
      // Only expose: id, title, description, state, imageUrl, progress percentage
      const redactedCampaigns = publishedCampaigns.map((c: any) => {
        const targetAmount = parseFloat(c.targetAmount) || 0;
        const totalCommitted = c.totalCommitted || 0;
        const progressPercent = targetAmount > 0 
          ? Math.min(Math.round((totalCommitted / targetAmount) * 100), 100)
          : 0;
        
        return {
          id: c.id,
          title: c.title,
          description: c.description,
          state: c.state,
          imageUrl: c.imageUrl,
          progressPercent,
          aggregationDeadline: c.aggregationDeadline,
          createdAt: c.createdAt,
        };
      });
      
      res.json(redactedCampaigns);
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

      // Validate required fields
      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }
      if (!targetAmount || parseFloat(targetAmount) <= 0) {
        return res.status(400).json({ error: "Target amount must be positive" });
      }
      if (!unitPrice || parseFloat(unitPrice) <= 0) {
        return res.status(400).json({ error: "Unit price must be positive" });
      }
      if (!aggregationDeadline) {
        return res.status(400).json({ error: "Aggregation deadline is required" });
      }

      const deadlineDate = new Date(aggregationDeadline);
      if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
        return res.status(400).json({ error: "Aggregation deadline must be a valid future date" });
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
        targetAmount: targetAmount.toString(),
        minCommitment: minCommitment?.toString() || unitPrice.toString(),
        maxCommitment: maxCommitment?.toString() || null,
        unitPrice: unitPrice.toString(),
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

  // Admin: Get campaigns list with full details
  app.get("/api/admin/campaigns", requireAdminAuth, async (req, res) => {
    try {
      const campaignsList = await storage.getCampaignsWithStats();
      res.json(campaignsList.map(c => ({
        id: c.id,
        title: c.title,
        state: c.state,
        adminPublishStatus: (c as any).adminPublishStatus || "DRAFT",
        aggregationDeadline: c.aggregationDeadline,
        participantCount: c.participantCount,
        totalCommitted: c.totalCommitted,
        createdAt: c.createdAt,
      })));
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
        productName: campaignData?.productName,
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
      const logs = await storage.getAdminActionLogs(100);
      res.json(logs);
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
      const refundEntries = await db
        .select({
          id: escrowLedger.id,
          amount: escrowLedger.amount,
          createdAt: escrowLedger.createdAt,
          reason: escrowLedger.reason,
          actor: escrowLedger.actor,
          commitmentId: escrowLedger.commitmentId,
          campaignId: escrowLedger.campaignId,
        })
        .from(escrowLedger)
        .where(eq(escrowLedger.entryType, "REFUND"))
        .orderBy(desc(escrowLedger.createdAt))
        .limit(200);
      
      const result = await Promise.all(refundEntries.map(async (entry) => {
        const commitment = await db.select().from(commitments).where(eq(commitments.id, entry.commitmentId)).limit(1);
        const campaign = await db.select().from(campaigns).where(eq(campaigns.id, entry.campaignId)).limit(1);
        return {
          ...entry,
          status: "COMPLETED",
          commitmentCode: commitment[0]?.referenceNumber || "Unknown",
          campaignName: campaign[0]?.title || "Unknown",
        };
      }));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin refunds:", error);
      res.status(500).json({ error: "Failed to fetch refunds" });
    }
  });

  // Admin: Refund Plans list (placeholder - returns empty for now)
  app.get("/api/admin/refund-plans", requireAdminAuth, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching refund plans:", error);
      res.status(500).json({ error: "Failed to fetch refund plans" });
    }
  });

  // Admin: Refund Plan detail (placeholder)
  app.get("/api/admin/refund-plans/:id", requireAdminAuth, async (req, res) => {
    res.status(404).json({ error: "Refund plan not found" });
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
      const campaignsInFulfillment = await storage.getCampaignsWithStats();
      const deliveries = campaignsInFulfillment
        .filter(c => c.state === "FULFILLMENT" || c.state === "RELEASED")
        .map(c => ({
          campaignId: c.id,
          campaignName: c.title,
          deliveryStrategy: "Standard",
          status: c.state === "RELEASED" ? "COMPLETED" : "IN_PROGRESS",
          lastUpdateAt: c.supplierAcceptedAt || null,
          nextUpdateDueAt: null,
          isOverdue: false,
        }));
      
      res.json(deliveries);
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
