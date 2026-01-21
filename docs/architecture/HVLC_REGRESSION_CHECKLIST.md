# HVLC Regression Checklist (High-Volume Lists)

Purpose
- Provide a repeatable checklist for every HVLC list page rollout.
- Prevent regressions in pagination stability, filtering, and UI trust signals.

Scope
- All list pages that can grow large (admin + public).
- Applies to both new HVLC conversions and regressions.

Required behaviors
1) Server-side pagination/filtering/sorting only
2) Deterministic ordering: <primarySort>, created_at DESC, id DESC
3) Response shape: { rows, total, page, pageSize, sortApplied, filtersApplied }
4) Debounced search (300-500ms) and cancel in-flight requests
5) Page resets to 1 on filter changes
6) No-store cache for operational endpoints

Manual checklist (per page)
1) Network calls
   - Request includes page and pageSize
   - No request fetches all rows
   - Filters are applied server-side (verify by changing filter and checking response)

2) Sorting stability
   - Sorting includes created_at DESC and id DESC tie-breaker
   - Paging does not duplicate or skip rows when new rows appear

3) UI behavior
   - Loading shows skeleton (no empty flicker)
   - Empty state only when rows are truly empty
   - If total > 0 and rows empty, mismatch banner appears
   - Status labels and language comply (campaign / participant / commitment / escrow / refund)

4) Search
   - Debounce delay observed (not per-keystroke spam)
   - In-flight request is canceled on new input

5) Pagination
   - Next/Prev respects total
   - Page size switch resets page to 1
   - Total count displayed

6) Filters
   - Status filter respects backend enum
   - Date range filters use createdFrom/createdTo
   - Clear filters resets to defaults

Suggested smoke tests (lightweight)
- Use DevTools Network to confirm:
  - repeated searches do not accumulate queued requests
  - requests include only allowed sort keys
  - response includes filtersApplied for auditability

Pages to verify (current HVLC coverage)
Admin:
- Commitments
- Credits ledger
- Refunds
- Audit
- Exceptions
- Deliveries
- Participants
- Campaigns
- Products
- Suppliers
- Refund Plans (campaign list)

Public:
- Campaigns list page
- Home page campaign modules (in-progress + completed)

Automation notes
- If automated coverage is added, keep it lightweight and focused:
  - verify response shape for list endpoints
  - verify sortApplied and filtersApplied are present
  - verify page/pageSize parameters are honored

Revision log
- 2026-01-20: Initial HVLC regression checklist.
