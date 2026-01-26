type QueryValue = string | string[] | undefined | null;

export interface ListQueryOptions {
  defaultPageSize?: number;
  allowedPageSizes?: number[];
  allowedSorts?: Record<string, string>;
  defaultSort?: string;
}

export interface ListQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sort?: string;
}

export interface ListQueryResult {
  params: ListQueryParams;
  offset: number;
  limit: number;
  sortApplied: string;
  filtersApplied: Record<string, string | null>;
}

function readString(value: QueryValue): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    const trimmed = value[0].trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function readDate(value: QueryValue): Date | undefined {
  const raw = readString(value);
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export function parseListQuery(
  query: Record<string, QueryValue>,
  options: ListQueryOptions = {}
): ListQueryResult {
  const defaultPageSize = options.defaultPageSize ?? 25;
  const allowedPageSizes = options.allowedPageSizes ?? [25, 50, 100];
  const allowedSorts = options.allowedSorts ?? {};
  const defaultSort = options.defaultSort ?? "default";

  const page = Math.max(parseInt(readString(query.page) || "1", 10) || 1, 1);
  const requestedPageSize = parseInt(readString(query.pageSize) || String(defaultPageSize), 10);
  const pageSize = allowedPageSizes.includes(requestedPageSize) ? requestedPageSize : defaultPageSize;
  const offset = (page - 1) * pageSize;

  const search = readString(query.search);
  const statusRaw = readString(query.status);
  const status = statusRaw && statusRaw !== "ALL" ? statusRaw : undefined;
  const createdFrom = readDate(query.createdFrom);
  const createdTo = readDate(query.createdTo);

  const sortRaw = readString(query.sort);
  const sortApplied = sortRaw && allowedSorts[sortRaw] ? allowedSorts[sortRaw] : defaultSort;

  return {
    params: {
      page,
      pageSize,
      search,
      status,
      createdFrom,
      createdTo,
      sort: sortApplied,
    },
    offset,
    limit: pageSize,
    sortApplied,
    filtersApplied: {
      search: search || null,
      status: status || null,
      createdFrom: createdFrom ? createdFrom.toISOString() : null,
      createdTo: createdTo ? createdTo.toISOString() : null,
    },
  };
}
