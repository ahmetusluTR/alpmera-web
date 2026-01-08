import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  type CampaignState, 
  type CommitmentStatus,
  VALID_TRANSITIONS,
  insertCommitmentSchema,
  updateUserProfileSchema
} from "@shared/schema";
import { z } from "zod";
import { createHash, randomBytes, randomInt } from "crypto";

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
        profile: user.profile
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

  // Get all campaigns with stats
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaignsWithStats();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Get single campaign with stats
  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaignWithStats(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
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
  // ALWAYS creates campaigns in AGGREGATION state only
  app.post("/api/admin/campaigns", requireAdminAuth, async (req, res) => {
    try {
      const { adminUsername, title, description, rules, imageUrl, targetAmount, minCommitment, maxCommitment, unitPrice, aggregationDeadline } = req.body;

      if (!adminUsername) {
        return res.status(400).json({ error: "Admin username is required for audit trail" });
      }

      // Validate required fields
      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }
      if (!rules || !rules.trim()) {
        return res.status(400).json({ error: "Rules text is required" });
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

      // Create campaign - ALWAYS starts in AGGREGATION state
      const campaign = await storage.createCampaign({
        title: title.trim(),
        description: description?.trim() || "",
        rules: rules.trim(),
        imageUrl: imageUrl?.trim() || null,
        targetAmount: targetAmount.toString(),
        minCommitment: minCommitment?.toString() || unitPrice.toString(),
        maxCommitment: maxCommitment?.toString() || null,
        unitPrice: unitPrice.toString(),
        state: "AGGREGATION", // ALWAYS AGGREGATION
        aggregationDeadline: deadlineDate,
        supplierAccepted: false,
      });

      // Log admin action - CAMPAIGN_CREATE
      await storage.createAdminActionLog({
        campaignId: campaign.id,
        adminUsername,
        action: "CAMPAIGN_CREATE",
        previousState: null,
        newState: "AGGREGATION",
        reason: "admin_create_campaign",
      });

      console.log(`[ADMIN] Campaign created: ${campaign.id} by ${adminUsername}`);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
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

  return httpServer;
}
