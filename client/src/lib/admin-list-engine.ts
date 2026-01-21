import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export interface ListResponse<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  sortApplied?: string;
  filtersApplied?: Record<string, string | null>;
}

export interface AdminListEngineOptions {
  endpoint: string;
  initialPageSize?: number;
  allowedPageSizes?: number[];
  debounceMs?: number;
  initialStatus?: string;
  initialSort?: string;
  initialSearch?: string;
}

export interface AdminListEngineControls {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  searchInput: string;
  setSearchInput: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  createdFrom: string;
  setCreatedFrom: (value: string) => void;
  createdTo: string;
  setCreatedTo: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  extraFilters: Record<string, string>;
  setExtraFilters: (filters: Record<string, string>) => void;
  resetFilters: () => void;
}

export interface AdminListEngineResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  sortApplied?: string;
  filtersApplied?: Record<string, string | null>;
  isLoading: boolean;
  error: unknown;
  controls: AdminListEngineControls;
}

function normalizePageSize(value: number, allowed: number[], fallback: number): number {
  return allowed.includes(value) ? value : fallback;
}

function buildQueryKey(endpoint: string, params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return [endpoint, ...entries.flat()];
}

export function useAdminListEngine<T>({
  endpoint,
  initialPageSize = 25,
  allowedPageSizes = [25, 50, 100],
  debounceMs = 400,
  initialStatus = "ALL",
  initialSort = "",
  initialSearch = "",
}: AdminListEngineOptions): AdminListEngineResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    normalizePageSize(initialPageSize, allowedPageSizes, allowedPageSizes[0] || 25)
  );
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [sort, setSort] = useState(initialSort);
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      setSearch(next);
      setPage(1);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchInput, debounceMs]);

  useEffect(() => {
    setPage(1);
  }, [status, createdFrom, createdTo, sort, pageSize, extraFilters]);

  const queryParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {
      page,
      pageSize,
      search: search || undefined,
      status: status && status !== "ALL" && status !== "all" ? status : undefined,
      createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined,
      sort: sort || undefined,
      ...Object.fromEntries(
        Object.entries(extraFilters).filter(([, value]) => value && value.trim().length > 0)
      ),
    };
    return params;
  }, [page, pageSize, search, status, createdFrom, createdTo, sort, extraFilters]);

  const queryKey = useMemo(() => buildQueryKey(endpoint, queryParams), [endpoint, queryParams]);

  const { data, isLoading, error } = useQuery<ListResponse<T>>({
    queryKey,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
      const res = await fetch(`${endpoint}?${params.toString()}`, {
        credentials: "include",
        signal,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus(initialStatus);
    setCreatedFrom("");
    setCreatedTo("");
    setSort(initialSort);
    setExtraFilters({});
    setPage(1);
  };

  return {
    rows: data?.rows ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    sortApplied: data?.sortApplied,
    filtersApplied: data?.filtersApplied,
    isLoading,
    error,
    controls: {
      page,
      setPage,
      pageSize,
      setPageSize: (value) => setPageSize(normalizePageSize(value, allowedPageSizes, pageSize)),
      searchInput,
      setSearchInput,
      status,
      setStatus,
      createdFrom,
      setCreatedFrom,
      createdTo,
      setCreatedTo,
      sort,
      setSort,
      extraFilters,
      setExtraFilters,
      resetFilters,
    },
  };
}
