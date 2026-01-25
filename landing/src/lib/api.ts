// API client for landing page forms
// Replaces Google Sheets integration with direct database API calls

interface ProductRequestData {
  productName: string;
  sku?: string;
  referenceUrl: string;
  reason?: string;
  category?: string;
  email?: string;
  city?: string;
  state?: string;
  notify?: boolean;
  website?: string; // Honeypot field
}

interface SubscribeData {
  email: string;
  interestTags?: string[];
  notes?: string;
  recommendationOptIn?: boolean;
  website?: string; // Honeypot field
}

interface ProductRequest {
  id: string;
  productName: string;
  category: string | null;
  inputSku: string | null;
  derivedSku: string | null;
  referenceUrl: string;
  voteCount: number;
  status: string;
  verificationStatus: string;
  createdAt: string;
}

interface ProductRequestsResponse {
  items: ProductRequest[];
  total: number;
  limit: number;
  offset: number;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  id?: string;
}

interface VoteResponse {
  success: boolean;
  voteCount?: number;
  error?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Submit a product request (suggest a product)
 */
export async function submitProductRequest(data: ProductRequestData): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/product-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "Failed to submit request" };
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error("Error submitting product request:", error);
    return { success: false, error: "Network error. Please try again." };
  }
}

/**
 * Subscribe to early access list
 */
export async function subscribeToEarlyList(data: SubscribeData): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/landing/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "Failed to subscribe" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error subscribing:", error);
    return { success: false, error: "Network error. Please try again." };
  }
}

/**
 * Get product requests list
 */
export async function getProductRequests(params?: {
  status?: string;
  sort?: "votes" | "newest";
  limit?: number;
  offset?: number;
}): Promise<ProductRequestsResponse> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const url = `${API_BASE}/api/product-requests${searchParams.toString() ? `?${searchParams}` : ""}`;
    const response = await fetch(url, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch product requests");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching product requests:", error);
    return { items: [], total: 0, limit: 20, offset: 0 };
  }
}

/**
 * Get single product request
 */
export async function getProductRequest(id: string): Promise<ProductRequest | null> {
  try {
    const response = await fetch(`${API_BASE}/api/product-requests/${id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching product request:", error);
    return null;
  }
}

/**
 * Vote on a product request
 */
export async function voteOnProductRequest(id: string): Promise<VoteResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/product-requests/${id}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "Failed to vote" };
    }

    return { success: true, voteCount: result.voteCount };
  } catch (error) {
    console.error("Error voting:", error);
    return { success: false, error: "Network error. Please try again." };
  }
}
