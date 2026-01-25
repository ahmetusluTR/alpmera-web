/**
 * SKU Verification Worker
 *
 * Background job that processes pending SKU verification jobs.
 * Extracts product identifiers (ASIN, SKU) from reference URLs.
 *
 * Currently supports:
 * - Amazon (ASIN extraction from URL)
 * - JSON-LD Product schema fallback
 */

import { db } from "../db";
import { productRequests, skuVerificationJobs } from "@shared/schema";
import { and, eq, lte, or } from "drizzle-orm";

const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds
const REQUEST_TIMEOUT_MS = 10 * 1000; // 10 seconds
const MAX_CONTENT_LENGTH = 100 * 1024; // 100KB max content to store

let isRunning = false;
let pollTimer: NodeJS.Timeout | null = null;

/**
 * Extract ASIN from Amazon URL
 */
function extractAmazonAsin(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Only process Amazon domains
    if (!urlObj.hostname.includes("amazon.")) {
      return null;
    }

    // Pattern 1: /dp/ASIN
    const dpMatch = urlObj.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
    if (dpMatch) return dpMatch[1].toUpperCase();

    // Pattern 2: /gp/product/ASIN
    const gpMatch = urlObj.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    if (gpMatch) return gpMatch[1].toUpperCase();

    // Pattern 3: /gp/aw/d/ASIN (mobile)
    const awMatch = urlObj.pathname.match(/\/gp\/aw\/d\/([A-Z0-9]{10})/i);
    if (awMatch) return awMatch[1].toUpperCase();

    // Pattern 4: ASIN in query string
    const asinParam = urlObj.searchParams.get("asin") || urlObj.searchParams.get("ASIN");
    if (asinParam && /^[A-Z0-9]{10}$/i.test(asinParam)) {
      return asinParam.toUpperCase();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Map Amazon category to our category system
 * Uses the 2nd level of the category tree
 */
function mapAmazonCategory(breadcrumbs: string[]): string | null {
  if (breadcrumbs.length < 2) return null;

  // Get the 2nd level category (index 1)
  const secondLevel = breadcrumbs[1]?.toLowerCase() || "";

  // Map to our Phase 1 categories (focused on >$300 products with favorable logistics)
  const categoryMapping: Record<string, string> = {
    // Electronics
    "electronics": "Electronics",
    "headphones": "Electronics",
    "computers": "Electronics",
    "cell phones": "Electronics",
    "camera": "Electronics",
    "audio": "Electronics",
    "video": "Electronics",
    "wearable technology": "Electronics",
    "tv": "Electronics",
    "tablets": "Electronics",
    // Kitchen Appliances
    "kitchen & dining": "Kitchen Appliances",
    "kitchen": "Kitchen Appliances",
    "dining": "Kitchen Appliances",
    "small appliances": "Kitchen Appliances",
    "cookware": "Kitchen Appliances",
    "bakeware": "Kitchen Appliances",
    "cutlery": "Kitchen Appliances",
    "coffee": "Kitchen Appliances",
    "espresso": "Kitchen Appliances",
    "tea": "Kitchen Appliances",
    "home & kitchen": "Kitchen Appliances",
    // Home Appliances
    "home": "Home Appliances",
    "furniture": "Home Appliances",
    "bedding": "Home Appliances",
    "bath": "Home Appliances",
    "lighting": "Home Appliances",
    "home décor": "Home Appliances",
    "home decor": "Home Appliances",
    "vacuums": "Home Appliances",
    "storage": "Home Appliances",
    // Outdoor
    "patio": "Outdoor",
    "garden": "Outdoor",
    "outdoor recreation": "Outdoor",
    "camping": "Outdoor",
    "hiking": "Outdoor",
    "hunting": "Outdoor",
    "fishing": "Outdoor",
    "cycling": "Outdoor",
    "lawn": "Outdoor",
    "sports & outdoors": "Outdoor",
    "outdoors": "Outdoor",
    // Office
    "office": "Office",
    "office products": "Office",
    "desk": "Office",
    "stationery": "Office",
    "printer": "Office",
    // Tools
    "tools": "Tools",
    "hardware": "Tools",
    "power tools": "Tools",
    "hand tools": "Tools",
    "automotive": "Tools",
  };

  // Try to find a match
  for (const [keyword, category] of Object.entries(categoryMapping)) {
    if (secondLevel.includes(keyword)) {
      return category;
    }
  }

  // If no match found in 2nd level, try 1st level
  const firstLevel = breadcrumbs[0]?.toLowerCase() || "";
  for (const [keyword, category] of Object.entries(categoryMapping)) {
    if (firstLevel.includes(keyword)) {
      return category;
    }
  }

  return "Other";
}

/**
 * Extract category breadcrumbs from Amazon HTML
 */
function extractAmazonCategory(html: string): string | null {
  try {
    // Method 1: Look for breadcrumb links with specific class patterns
    // Amazon uses various patterns like "a-link-normal a-color-tertiary"
    const breadcrumbPatterns = [
      // Pattern 1: wayfinding breadcrumbs
      /id="wayfinding-breadcrumbs[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      // Pattern 2: nav breadcrumbs
      /id="nav-subnav"[^>]*data-category="([^"]+)"/i,
      // Pattern 3: department link
      /id="searchDropdownBox"[^>]*>[\s\S]*?<option[^>]*selected[^>]*>([^<]+)</i,
    ];

    // Try to find breadcrumb text using various patterns
    for (const pattern of breadcrumbPatterns) {
      const match = html.match(pattern);
      if (match) {
        // Extract all link texts from the matched section
        const linkTexts = match[1]?.match(/>([^<]{2,50})</g);
        if (linkTexts) {
          const breadcrumbs = linkTexts
            .map(t => t.replace(/^>|<$/g, '').trim())
            .filter(t => t.length > 1 && !t.includes('\\') && !/^\s*$/.test(t));
          if (breadcrumbs.length >= 2) {
            console.log(`[SKU-VERIFIER] Found breadcrumbs: ${breadcrumbs.join(' > ')}`);
            return mapAmazonCategory(breadcrumbs);
          }
        }
      }
    }

    // Method 2: Look for JSON-LD BreadcrumbList
    const jsonLdMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );
    if (jsonLdMatch) {
      for (const script of jsonLdMatch) {
        try {
          const jsonContent = script.replace(/<\/?script[^>]*>/gi, '').trim();
          if (jsonContent) {
            const data = JSON.parse(jsonContent);
            if (data["@type"] === "BreadcrumbList" && data.itemListElement) {
              const breadcrumbs = data.itemListElement
                .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
                .map((item: { name?: string; item?: { name?: string } }) => item.name || item.item?.name || "")
                .filter(Boolean);
              console.log(`[SKU-VERIFIER] Found JSON-LD breadcrumbs: ${breadcrumbs.join(' > ')}`);
              return mapAmazonCategory(breadcrumbs);
            }
          }
        } catch {
          continue;
        }
      }
    }

    // Method 3: Look for category in meta tags
    const metaCategoryMatch = html.match(/<meta[^>]*name=["']?keywords["']?[^>]*content=["']([^"']+)["']/i);
    if (metaCategoryMatch) {
      const keywords = metaCategoryMatch[1].split(',').map(k => k.trim());
      if (keywords.length > 0) {
        console.log(`[SKU-VERIFIER] Found meta keywords: ${keywords.slice(0, 3).join(', ')}`);
        // Use first few keywords as pseudo-breadcrumbs
        return mapAmazonCategory(['', keywords[0]]);
      }
    }

    // Method 4: Look for nav-search-label (Amazon's search dropdown)
    const searchLabelMatch = html.match(/aria-label="Search in ([^"]+)"/i);
    if (searchLabelMatch) {
      console.log(`[SKU-VERIFIER] Found search label: ${searchLabelMatch[1]}`);
      return mapAmazonCategory(['', searchLabelMatch[1]]);
    }

    // Method 5: Look for common category patterns in the HTML (Phase 1 categories only)
    const categoryTextPatterns = [
      /Home\s*(?:&amp;|&)\s*Kitchen/i,
      /Kitchen\s*(?:&amp;|&)\s*Dining/i,
      /Electronics/i,
      /Sports\s*(?:&amp;|&)\s*Outdoors/i,
      /Tools\s*(?:&amp;|&)\s*Home\s*Improvement/i,
      /Patio,?\s*Lawn\s*(?:&amp;|&)\s*Garden/i,
      /Office\s*Products/i,
    ];

    for (const pattern of categoryTextPatterns) {
      if (pattern.test(html)) {
        const matchText = html.match(pattern)?.[0] || '';
        console.log(`[SKU-VERIFIER] Found category text pattern: ${matchText}`);
        return mapAmazonCategory(['', matchText.replace(/&amp;/g, '&')]);
      }
    }

    console.log(`[SKU-VERIFIER] Could not extract category from HTML (length: ${html.length})`);
    return null;
  } catch (err) {
    console.error(`[SKU-VERIFIER] Error extracting category:`, err);
    return null;
  }
}

/**
 * Extract SKU from JSON-LD Product schema in HTML
 */
function extractJsonLdSku(html: string): { sku?: string; mpn?: string; name?: string; category?: string } | null {
  try {
    // Find JSON-LD script tags
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const jsonData = JSON.parse(match[1]);

        // Handle @graph array
        const items = jsonData["@graph"] || [jsonData];

        for (const item of Array.isArray(items) ? items : [items]) {
          if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
            return {
              sku: item.sku || item.productID || null,
              mpn: item.mpn || item.model || null,
              name: item.name || null,
            };
          }
        }
      } catch {
        // Continue to next script tag
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch URL content with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Use browser-like headers to avoid bot detection
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    console.log(`[SKU-VERIFIER] Fetched ${url} - Status: ${response.status}`);

    if (!response.ok) {
      console.log(`[SKU-VERIFIER] Fetch failed with status ${response.status}`);
      return null;
    }

    const text = await response.text();
    console.log(`[SKU-VERIFIER] Received ${text.length} bytes`);
    return text.substring(0, MAX_CONTENT_LENGTH);
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.log("[SKU-VERIFIER] Request timed out");
    } else {
      console.error("[SKU-VERIFIER] Fetch error:", (error as Error).message);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Process a single verification job
 */
async function processJob(job: {
  id: string;
  productRequestId: string;
  attemptCount: number | null;
  maxAttempts: number | null;
}): Promise<void> {
  const now = new Date();

  try {
    // Get the product request
    const [request] = await db
      .select({
        referenceUrl: productRequests.referenceUrl,
        inputSku: productRequests.inputSku,
      })
      .from(productRequests)
      .where(eq(productRequests.id, job.productRequestId))
      .limit(1);

    if (!request) {
      // Request was deleted, mark job as failed
      await db
        .update(skuVerificationJobs)
        .set({
          status: "failed",
          completedAt: now,
          errorMessage: "Product request not found",
        })
        .where(eq(skuVerificationJobs.id, job.id));
      return;
    }

    const attemptCount = (job.attemptCount || 0) + 1;
    const maxAttempts = job.maxAttempts || 2;

    // Update job status to processing
    await db
      .update(skuVerificationJobs)
      .set({
        status: "processing",
        attemptCount,
        lastAttemptAt: now,
      })
      .where(eq(skuVerificationJobs.id, job.id));

    let derivedSku: string | null = null;
    let canonicalProductId: string | null = null;
    let verificationStatus: "verified" | "unverified" | "error" = "unverified";
    let verificationReason: string | null = null;
    let extractedData: string | null = null;
    let extractedCategory: string | null = null;

    // Try Amazon ASIN extraction first
    const asin = extractAmazonAsin(request.referenceUrl);
    if (asin) {
      canonicalProductId = asin;
      derivedSku = asin;

      // Check if input SKU matches ASIN
      if (request.inputSku) {
        const normalizedInput = request.inputSku.toUpperCase().trim();
        if (normalizedInput === asin) {
          verificationStatus = "verified";
          verificationReason = "ASIN matches user input";
        } else {
          verificationStatus = "unverified";
          verificationReason = `User SKU (${request.inputSku}) does not match ASIN (${asin})`;
        }
      } else {
        verificationStatus = "verified";
        verificationReason = "ASIN extracted from Amazon URL";
      }

      // Fetch Amazon page to extract category
      console.log(`[SKU-VERIFIER] Fetching Amazon page for category extraction: ${request.referenceUrl}`);
      const html = await fetchWithTimeout(request.referenceUrl, REQUEST_TIMEOUT_MS);
      if (html) {
        extractedCategory = extractAmazonCategory(html);
        console.log(`[SKU-VERIFIER] Extracted category: ${extractedCategory || 'none'}`);
      } else {
        console.log(`[SKU-VERIFIER] Failed to fetch Amazon page for category`);
      }

      extractedData = JSON.stringify({ source: "amazon_url", asin, category: extractedCategory });
    } else {
      // Try fetching and parsing JSON-LD
      const html = await fetchWithTimeout(request.referenceUrl, REQUEST_TIMEOUT_MS);

      if (html) {
        const jsonLdData = extractJsonLdSku(html);

        if (jsonLdData && (jsonLdData.sku || jsonLdData.mpn)) {
          derivedSku = jsonLdData.sku || jsonLdData.mpn || null;
          extractedData = JSON.stringify({ source: "json_ld", ...jsonLdData });

          // Check if input SKU matches
          if (request.inputSku && derivedSku) {
            const normalizedInput = request.inputSku.toLowerCase().trim();
            const normalizedDerived = derivedSku.toLowerCase().trim();

            if (normalizedInput === normalizedDerived) {
              verificationStatus = "verified";
              verificationReason = "SKU matches user input";
            } else {
              verificationStatus = "unverified";
              verificationReason = `User SKU (${request.inputSku}) does not match extracted (${derivedSku})`;
            }
          } else if (derivedSku) {
            verificationStatus = "verified";
            verificationReason = "SKU extracted from page schema";
          }
        } else {
          verificationStatus = "unverified";
          verificationReason = "Could not extract product identifier from page";
        }
      } else {
        // Fetch failed
        if (attemptCount >= maxAttempts) {
          verificationStatus = "error";
          verificationReason = "Failed to fetch page after multiple attempts";
        } else {
          // Schedule retry
          const nextAttemptAt = new Date(now.getTime() + 60 * 1000); // Retry in 1 minute
          await db
            .update(skuVerificationJobs)
            .set({
              status: "pending",
              nextAttemptAt,
              errorMessage: "Fetch failed, will retry",
            })
            .where(eq(skuVerificationJobs.id, job.id));
          return;
        }
      }
    }

    // Update product request with verification results
    const updateData: Record<string, unknown> = {
      derivedSku,
      canonicalProductId,
      verificationStatus,
      verificationReason,
      verificationAttemptedAt: now,
      verificationRetryCount: attemptCount,
      updatedAt: now,
    };

    // Only update category if we extracted one and the request doesn't already have a category
    if (extractedCategory) {
      // Check if the request already has a category set
      const [currentRequest] = await db
        .select({ category: productRequests.category })
        .from(productRequests)
        .where(eq(productRequests.id, job.productRequestId))
        .limit(1);

      if (!currentRequest?.category) {
        updateData.category = extractedCategory;
      }
    }

    await db
      .update(productRequests)
      .set(updateData)
      .where(eq(productRequests.id, job.productRequestId));

    // Mark job as completed
    await db
      .update(skuVerificationJobs)
      .set({
        status: "completed",
        completedAt: now,
        extractedData,
        errorMessage: null,
      })
      .where(eq(skuVerificationJobs.id, job.id));

    console.log(`[SKU-VERIFIER] Processed job ${job.id}: ${verificationStatus} - ${verificationReason}`);
  } catch (error) {
    console.error(`[SKU-VERIFIER] Error processing job ${job.id}:`, error);

    const attemptCount = (job.attemptCount || 0) + 1;
    const maxAttempts = job.maxAttempts || 2;

    if (attemptCount >= maxAttempts) {
      // Mark as failed
      await db
        .update(skuVerificationJobs)
        .set({
          status: "failed",
          completedAt: now,
          attemptCount,
          errorMessage: (error as Error).message || "Unknown error",
        })
        .where(eq(skuVerificationJobs.id, job.id));

      await db
        .update(productRequests)
        .set({
          verificationStatus: "error",
          verificationReason: "Verification failed due to system error",
          verificationAttemptedAt: now,
          verificationRetryCount: attemptCount,
          updatedAt: now,
        })
        .where(eq(productRequests.id, job.productRequestId));
    } else {
      // Schedule retry
      const nextAttemptAt = new Date(now.getTime() + 60 * 1000);
      await db
        .update(skuVerificationJobs)
        .set({
          status: "pending",
          attemptCount,
          nextAttemptAt,
          errorMessage: (error as Error).message || "Unknown error",
        })
        .where(eq(skuVerificationJobs.id, job.id));
    }
  }
}

/**
 * Poll for pending jobs and process them
 */
async function poll(): Promise<void> {
  if (!isRunning) return;

  try {
    const now = new Date();

    // Find pending jobs ready for processing
    const jobs = await db
      .select({
        id: skuVerificationJobs.id,
        productRequestId: skuVerificationJobs.productRequestId,
        attemptCount: skuVerificationJobs.attemptCount,
        maxAttempts: skuVerificationJobs.maxAttempts,
      })
      .from(skuVerificationJobs)
      .where(
        and(
          eq(skuVerificationJobs.status, "pending"),
          or(
            lte(skuVerificationJobs.nextAttemptAt, now),
            eq(skuVerificationJobs.nextAttemptAt, null as unknown as Date)
          )
        )
      )
      .limit(10);

    if (jobs.length > 0) {
      console.log(`[SKU-VERIFIER] Found ${jobs.length} pending jobs`);

      // Process jobs sequentially to avoid overwhelming external services
      for (const job of jobs) {
        if (!isRunning) break;
        await processJob(job);
      }
    }
  } catch (error) {
    console.error("[SKU-VERIFIER] Poll error:", error);
  }

  // Schedule next poll
  if (isRunning) {
    pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
  }
}

/**
 * Start the SKU verification worker
 */
export function startSkuVerifier(): void {
  if (isRunning) {
    console.log("[SKU-VERIFIER] Already running");
    return;
  }

  console.log("[SKU-VERIFIER] Starting worker");
  isRunning = true;

  // Start polling
  poll();
}

/**
 * Stop the SKU verification worker
 */
export function stopSkuVerifier(): void {
  console.log("[SKU-VERIFIER] Stopping worker");
  isRunning = false;

  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

/**
 * Check if the worker is running
 */
export function isSkuVerifierRunning(): boolean {
  return isRunning;
}
