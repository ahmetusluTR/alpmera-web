import { useState, useEffect } from "react";
import { getProductRequests, voteOnProductRequest } from "./lib/api";
import Layout from "./components/Layout";

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

const STATUS_LABELS: Record<string, string> = {
  not_reviewed: "Open",
  in_review: "Under Review",
  accepted: "Accepted",
  failed_in_campaign: "Campaign Failed",
  successful_in_campaign: "Campaign Successful",
};

const STATUS_COLORS: Record<string, string> = {
  not_reviewed: "bg-alpmera-text-light/10 text-alpmera-text-light",
  in_review: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  failed_in_campaign: "bg-red-100 text-red-700",
  successful_in_campaign: "bg-emerald-100 text-emerald-700",
};

const CATEGORIES = [
  "Electronics",
  "Kitchen Appliances",
  "Home Appliances",
  "Office",
  "Tools",
  "Outdoor",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "not_reviewed", label: "Open" },
  { value: "in_review", label: "Under Review" },
  { value: "accepted", label: "Accepted" },
];

export default function ProductRequests() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"votes" | "newest">("votes");
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [votingId, setVotingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [skuFilter, setSkuFilter] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    // Load voted IDs from localStorage
    const stored = localStorage.getItem("alpmera_voted_requests");
    if (stored) {
      try {
        setVotedIds(new Set(JSON.parse(stored)));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [sort, offset]);

  useEffect(() => {
    // Apply client-side filters
    let filtered = [...requests];

    if (categoryFilter) {
      filtered = filtered.filter((r) => r.category === categoryFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchText.trim()) {
      const search = searchText.toLowerCase().trim();
      filtered = filtered.filter((r) =>
        r.productName.toLowerCase().includes(search)
      );
    }

    if (skuFilter.trim()) {
      const sku = skuFilter.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.inputSku?.toLowerCase().includes(sku) ||
          r.derivedSku?.toLowerCase().includes(sku)
      );
    }

    setFilteredRequests(filtered);
  }, [requests, categoryFilter, statusFilter, searchText, skuFilter]);

  const loadRequests = async () => {
    setLoading(true);
    const result = await getProductRequests({ sort, limit: 100, offset: 0 }); // Load more for client-side filtering
    setRequests(result.items);
    setTotal(result.total);
    setLoading(false);
  };

  const handleVote = async (id: string) => {
    if (votedIds.has(id) || votingId) return;

    setVotingId(id);
    const result = await voteOnProductRequest(id);

    if (result.success) {
      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, voteCount: result.voteCount ?? r.voteCount + 1 } : r
        )
      );

      // Mark as voted
      const newVotedIds = new Set(votedIds);
      newVotedIds.add(id);
      setVotedIds(newVotedIds);
      localStorage.setItem("alpmera_voted_requests", JSON.stringify([...newVotedIds]));
    }

    setVotingId(null);
  };

  const clearFilters = () => {
    setCategoryFilter("");
    setStatusFilter("");
    setSearchText("");
    setSkuFilter("");
  };

  const hasActiveFilters = categoryFilter || statusFilter || searchText || skuFilter;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  // Get unique categories from requests for the filter
  const availableCategories = [...new Set(requests.map((r) => r.category).filter(Boolean))];

  return (
    <Layout>
      <div className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-normal font-display text-alpmera-primary leading-tight">
              Product Requests
            </h1>
            <p className="mt-4 text-lg text-alpmera-text-light max-w-2xl mx-auto font-body">
              Community-submitted product ideas. Vote for products you'd like to see as campaigns.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mb-8 rounded-lg bg-alpmera-secondary/50 border border-alpmera-border p-4">
            <p className="text-sm text-alpmera-text-light text-center">
              These are community-submitted ideas. Campaigns open only after Alpmera review.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="sort" className="text-sm text-alpmera-text-light">
                    Sort:
                  </label>
                  <select
                    id="sort"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as "votes" | "newest");
                      setOffset(0);
                    }}
                    className="rounded-md border border-alpmera-border bg-white px-3 py-1.5 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
                  >
                    <option value="votes">Most Votes</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-all ${
                    showFilters || hasActiveFilters
                      ? "border-alpmera-primary bg-alpmera-primary/5 text-alpmera-primary"
                      : "border-alpmera-border text-alpmera-text-light hover:border-alpmera-primary"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-alpmera-primary text-white rounded-full">
                      {[categoryFilter, statusFilter, searchText, skuFilter].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>

              <a
                href="/demand"
                className="inline-flex items-center justify-center rounded-lg bg-alpmera-accent px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90 transition-all"
              >
                Suggest a Product
              </a>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="rounded-lg border border-alpmera-border bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Product Name Search */}
                  <div>
                    <label htmlFor="search" className="block text-xs font-medium text-alpmera-text-light mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      id="search"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search products..."
                      className="w-full rounded-md border border-alpmera-border bg-white px-3 py-1.5 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label htmlFor="category" className="block text-xs font-medium text-alpmera-text-light mb-1">
                      Category
                    </label>
                    <select
                      id="category"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full rounded-md border border-alpmera-border bg-white px-3 py-1.5 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SKU/ASIN Filter */}
                  <div>
                    <label htmlFor="sku" className="block text-xs font-medium text-alpmera-text-light mb-1">
                      SKU / ASIN
                    </label>
                    <input
                      type="text"
                      id="sku"
                      value={skuFilter}
                      onChange={(e) => setSkuFilter(e.target.value)}
                      placeholder="e.g., B09WG9DDPS"
                      className="w-full rounded-md border border-alpmera-border bg-white px-3 py-1.5 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label htmlFor="status" className="block text-xs font-medium text-alpmera-text-light mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-md border border-alpmera-border bg-white px-3 py-1.5 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-alpmera-text-light hover:text-alpmera-primary"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results count */}
          {!loading && (
            <p className="text-sm text-alpmera-text-light mb-4">
              Showing {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"}
              {hasActiveFilters && ` (filtered from ${requests.length})`}
            </p>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-alpmera-primary border-t-transparent rounded-full"></div>
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredRequests.length === 0 && (
            <div className="text-center py-12">
              {hasActiveFilters ? (
                <>
                  <p className="text-alpmera-text-light">No requests match your filters.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-alpmera-primary hover:underline"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <p className="text-alpmera-text-light">No product requests yet.</p>
                  <a
                    href="/demand"
                    className="mt-4 inline-block text-alpmera-primary hover:underline"
                  >
                    Be the first to suggest a product
                  </a>
                </>
              )}
            </div>
          )}

          {/* Requests list */}
          {!loading && filteredRequests.length > 0 && (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-alpmera-border bg-white p-4 sm:p-6 flex gap-4"
                >
                  {/* Vote button - Enhanced */}
                  <div className="flex flex-col items-center shrink-0">
                    <button
                      onClick={() => handleVote(request.id)}
                      disabled={votedIds.has(request.id) || votingId === request.id || request.status !== "not_reviewed"}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all min-w-[70px] ${
                        votedIds.has(request.id)
                          ? "border-alpmera-success bg-alpmera-success/10 text-alpmera-success"
                          : request.status !== "not_reviewed"
                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "border-alpmera-primary/30 bg-alpmera-primary/5 text-alpmera-primary hover:border-alpmera-primary hover:bg-alpmera-primary/10 cursor-pointer"
                      }`}
                      title={
                        votedIds.has(request.id)
                          ? "Thanks for your support!"
                          : request.status !== "not_reviewed"
                          ? "Voting closed"
                          : "Click to vote - I'd support this if opened"
                      }
                    >
                      <svg
                        className="w-5 h-5"
                        fill={votedIds.has(request.id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      <span className="text-lg font-bold">{request.voteCount}</span>
                      <span className="text-[10px] uppercase tracking-wide font-medium">
                        {votedIds.has(request.id) ? "Voted" : "Vote"}
                      </span>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <h2 className="text-lg font-semibold text-alpmera-text">
                        {request.productName}
                      </h2>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          STATUS_COLORS[request.status] || STATUS_COLORS.not_reviewed
                        }`}
                      >
                        {STATUS_LABELS[request.status] || request.status}
                      </span>
                    </div>

                    {/* Category - prominent display */}
                    {request.category && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-alpmera-secondary text-sm text-alpmera-text">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {request.category}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-alpmera-text-light">
                      {(request.inputSku || request.derivedSku) && (
                        <span className="inline-flex items-center gap-1 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {request.derivedSku || request.inputSku}
                        </span>
                      )}
                      <a
                        href={request.referenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-alpmera-primary"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {getDomainFromUrl(request.referenceUrl)}
                      </a>
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && total > limit && !hasActiveFilters && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-4 py-2 text-sm font-medium text-alpmera-text-light hover:text-alpmera-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-alpmera-text-light">
                Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-4 py-2 text-sm font-medium text-alpmera-text-light hover:text-alpmera-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
