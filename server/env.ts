import { z } from "zod";

/**
 * Environment variable validation schema
 *
 * CRITICAL: This enforces Constitutional Article IX - Stop Conditions
 * "Alpmera must stop and reassess if... Trust ambiguity emerges."
 *
 * If any required environment variable is missing, the server crashes immediately
 * rather than starting in an undefined state.
 */

// Different validation for test vs non-test environments
const isTestEnv = process.env.NODE_ENV === "test";
const isDevelopment = process.env.NODE_ENV === "development";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  TEST_DATABASE_URL: z.string().optional(),

  // Security (CRITICAL - Constitutional Article II §2.1: Trust as Primary Asset)
  // In test mode, these can have defaults for automated testing
  // In development, SESSION_SECRET gets a fallback with warning
  // In production, SESSION_SECRET is REQUIRED (no fallback)
  SESSION_SECRET: isTestEnv
    ? z.string().default("test-session-secret-min-32-chars-long-for-testing")
    : isDevelopment
    ? z.string().min(32).default("dev-session-secret-CHANGE-IN-PROD-min32chars").transform(val => {
        if (val === "dev-session-secret-CHANGE-IN-PROD-min32chars") {
          console.warn("⚠️  WARNING: Using default SESSION_SECRET in development. Set SESSION_SECRET in .env for production.");
        }
        return val;
      })
    : z.string().min(32, "SESSION_SECRET must be at least 32 characters for security"),
  ADMIN_API_KEY: isTestEnv
    ? z.string().default("test-admin-key")
    : z.string().min(1, "ADMIN_API_KEY is required for admin authentication"),

  // Application
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Accept both "prod" and "production" for backward compatibility
  APP_ENV: z.enum(["dev", "staging", "prod", "production"]).optional().transform(val =>
    val === "prod" ? "production" : val
  ),
  PORT: z.string().regex(/^\d+$/).transform(Number).default("5000"),

  // Optional integrations
  GIT_COMMIT: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GOOGLE_CLOUD_KEYFILE: z.string().optional(),
  ANONYMOUS_ID_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at startup
 *
 * @throws {Error} If any required variable is missing or invalid
 *
 * Elite Backend Standard: "Verify all process.env variables at startup using a schema.
 * If a key is missing, crash immediately. Do not start the server in an undefined state."
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ ENVIRONMENT VALIDATION FAILED");
      console.error("❌ The server cannot start with invalid or missing environment variables.\n");

      for (const issue of error.issues) {
        const path = issue.path.join(".");
        console.error(`  ❌ ${path}: ${issue.message}`);
      }

      console.error("\n📋 Required environment variables:");
      console.error("  - DATABASE_URL (PostgreSQL connection string)");
      console.error("  - SESSION_SECRET (min 32 characters)");
      console.error("  - ADMIN_API_KEY (admin authentication key)");
      console.error("\n💡 Set these in your .env file or environment.\n");

      process.exit(1);
    }
    throw error;
  }
}
