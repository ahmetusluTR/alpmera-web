ROLE: ARCHITECT

GOAL:
Design a global, project-wide “High-Volume Data Architecture” for Alpmera so any page that can grow large remains fast, stable, and predictable (admin + public lists). Produce an implementation-ready architecture that an implementer can apply incrementally.

CANON / CONSTRAINTS:
- Alpmera is not a store; no retail language (campaign / participant / commitment / escrow / refund / ledger)
- Prefer incremental, low-risk changes
- Phase 1.5 reality: operational maturity; admin is the hub
- No silent transitions: list pages must be explainable and reliable
- Performance is a trust feature (slow/incorrect operational pages create trust debt)

1) PAGES AT RISK (HIGH-VOLUME SURFACES)
Admin (highest risk first):
A) Commitments (core transaction stream)
B) Credits ledger (append-only; will explode)
C) Refunds (high volume + operational urgency)
D) Audit log (append-only)
E) Exceptions (incident stream)
F) Deliveries (grows with completion volume)
G) Clearing / ledger movements (if present)
H) Participants (grows with adoption)
I) Campaigns (moderate; grows)
J) Products/Suppliers (lower but must still follow standard)

Public:
K) Campaign discovery/list pages (grows; needs pagination/search)
L) Any “activity”/history feeds (if added)

2) ROOT CAUSE CLASS OF FAILURES (WHAT WE PREVENT)
- Full-table fetches (UI loads everything)
- Client-side filtering/sorting on huge arrays
- Non-deterministic pagination (duplicate/missing rows across pages)
- Expensive joins in list views
- Missing indexes for common filters/sorts
- Cache/304 confusion on auth/session-like endpoints
- UI spam requests (no debounce, no cancel)
- “Count says X but table shows Y” from mismatched endpoints

3) GLOBAL STANDARD: HIGH-VOLUME LIST CONTRACT (HVLC)
This is a hard architecture standard. Every list page must comply.

3.1 API Contract (all list endpoints)
Request params (uniform):
- page: integer (1-based)
- pageSize: integer (default 25; allowed 25/50/100; max 100)
- search: string (optional)
- status: string (optional, enum where applicable)
- createdFrom: ISO date/time (optional)
- createdTo: ISO date/time (optional)
- sort: string (optional; safe allowlist only)
- cursor: optional future (not required now)

Response shape (uniform):
- rows: array (only fields needed for the list)
- total: integer (count for current filters)
- page, pageSize
- sortApplied: string
- filtersApplied: object (echo back normalized filters)

Rules:
- Filtering + sorting MUST be server-side
- Pagination MUST be server-side
- Response MUST be deterministic (stable ordering)
- List endpoints MUST NOT include large related blobs

3.2 Deterministic Sorting Rule
Every list query must end with:
ORDER BY <primarySort>, created_at DESC, id DESC

Where <primarySort> may be:
- Domain priority (e.g., active-first), but must still include created_at DESC and id DESC as tie-breakers.

This prevents:
- duplicate rows across pages
- missing rows across pages
- unstable pagination while new rows arrive

3.3 Query Efficiency Rule
- Lists: minimal columns + no heavy joins
- Details: enrich via single-record queries (joins OK here)
- If list needs campaign name:
  - Prefer cheap join only if campaigns table is small and indexed
  - Otherwise show campaign_id; load name on hover/detail later

3.4 UI Contract (all list pages)
Controls (standard layout):
- Search (debounced 300–500ms)
- Status filter (if applicable)
- Date range: Created From/To (default last 30 days for the biggest tables)
- Page size selector: 25/50/100
- Clear filters button

Behavior rules:
- Debounced search + request cancellation on change
- Reset to page=1 when filters change
- Show total count + current page
- Never render “empty” while loading; use skeleton
- If backend returns total>0 but rows empty (should not happen), show a warning banner (signals data mismatch)

3.5 Caching Rules
- High-volume operational endpoints: no-store
- Session/auth endpoints: no-store (avoid 304 confusion)
- Public campaign list can use short TTL if needed later, but not now

4) SHARED IMPLEMENTATION LAYER (ONE-TIME BUILD)
Create a shared “List Engine” used by all list pages.

4.1 Client: AdminListEngine
- A single hook/module that:
  - manages page/pageSize/search/status/dateRange/sort state
  - debounces search
  - cancels in-flight requests
  - normalizes query params
  - enforces allowed pageSize
  - returns { rows, total, loading, error, controls }

4.2 Client: Standard Components
- <ListToolbar /> (search, filters, date range, page size)
- <Pagination /> (prev/next, page indicator, total)
- <StatusBadge /> (consistent status rendering)
- Optional later: row virtualization (only if needed after server-side pagination)

4.3 Server: ListQueryBuilder (per resource)
- A shared helper that:
  - validates params
  - applies filters
  - applies stable ordering
  - applies limit/offset
  - returns rows + total

5) DATABASE INDEX BASELINE (SAFE, MINIMAL)
No schema redesign; indexes are allowed if needed.

Baseline indexes (create only for high-volume tables):
Commitments:
- (status, created_at desc)
- (created_at desc)
- (reference_number)
- (participant_email)
- (campaign_id)
Credits ledger:
- (participant_id, created_at desc)
- (created_at desc)
Refunds:
- (status, created_at desc)
- (participant_email) or participant_id
Audit:
- (created_at desc)
- (actor_id, created_at desc) if exists
Exceptions:
- (status, created_at desc)

Rule:
- Add indexes only when a table is confirmed high volume OR when query plans are slow.
- Each index addition must be its own migration/commit for easy rollback.

6) ROLLOUT PLAN (INCREMENTAL, LOW-RISK)
Phase A — Foundation
1) Implement shared client List Engine + standard toolbar/pagination/status badge.
2) Implement server-side list contract helpers.
(No page behavior changes yet; foundation is additive.)

Phase B — Convert highest volume pages first
3) Commitments list → full HVLC compliance.
4) Credits ledger list → HVLC compliance.
5) Refunds list → HVLC compliance.
6) Audit + Exceptions → HVLC compliance.

Phase C — Convert remaining lists
7) Deliveries, Participants, Campaigns.
8) Products, Suppliers, Refund Plans.

Phase D — Public list
9) Public campaigns list uses same contract (without admin auth).

7) ACCEPTANCE CRITERIA (ARCHITECTURAL)
- No list page performs “load all rows”
- Every list endpoint supports page/pageSize and returns total
- Every list query is deterministic and stable under concurrent inserts
- Search is debounced and cancellable in UI
- High-volume pages default to a safe time window when appropriate (e.g., last 30 days) to prevent accidental full scans
- Each rollout step is reversible in a single commit

8) HANDOFF DELIVERABLES (WHAT IMPLEMENTER MUST PRODUCE)
- A short “HVLC spec” markdown doc in docs/architecture (or docs/canon if you prefer) that becomes the single source of truth for list pages
- Shared List Engine utilities in client
- Shared ListQueryBuilder utilities in server
- Incremental PR/commit per page conversion

CODEX FOOTER (FOR IMPLEMENTATION PROMPTS):
If changes impact backend state, session handling, caching, or API responses,
restart the app before running verification steps.