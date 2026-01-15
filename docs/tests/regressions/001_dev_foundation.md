# Alpmera Test Case Template

**ID**: [TEST-XXX]
**Title**: [Short descriptive title]
**Preconditions**: [State of system, user roles, existing data]
**Steps**:
1. [Step 1]
2. [Step 2]
**Expected Result**: [What should happen]
**Automation Target**: [Unit | Integration | E2E | Human]

---

# Dev Foundation Regression Set (10 Cases)

## 1. Admin Auth/Login Session
- **Preconditions**: Admin user exists in DB.
- **When**: POST /api/admin/login with valid credentials.
- **Then**: 200 OK, session cookie set, and follow-up /api/admin/me returns 200.
- **Automation Target**: API Integration

## 2. Campaign Join/Commit
- **Preconditions**: Campaign in AGGREGATION state exists. Authenticated user exists.
- **When**: POST /api/campaigns/:id/commit with valid amount.
- **Then**: 200 OK, commitment record created, user's escrow balance updated.
- **Automation Target**: API Integration

## 3. Escrow Lock Semantics
- **Preconditions**: Successful commitment action.
- **When**: Query escrow_ledger for the commitment ID.
- **Then**: Record type is 'LOCK', amount matches, state is 'LOCKED'.
- **Automation Target**: Unit / DB Check

## 4. Campaign Status Transitions (Draft -> Aggregation)
- **Preconditions**: DRAFT campaign with all prerequisites (P/S/C) set.
- **When**: POST /api/admin/campaigns/:id/publish.
- **Then**: adminPublishStatus becomes 'PUBLISHED', state remains 'AGGREGATION' (or transitions if flow requires).
- **Automation Target**: API Integration

## 5. Refund Lifecycle
- **Preconditions**: Campaign in FAILED state with commitments.
- **When**: Admin triggers refund via /api/admin/refunds.
- **Then**: Commitment status becomes 'REFUNDED', ledger adds 'REFUND' entry.
- **Automation Target**: API Integration / Logic

## 6. Timeline Persistence
- **Preconditions**: Any state-changing action (e.g., publish).
- **When**: Fetch /api/admin/logs?campaignId=:id.
- **Then**: Log entry exists with correct timestamp and action description.
- **Automation Target**: API Integration

## 7. Health Check Response
- **Preconditions**: Server running.
- **When**: GET /health.
- **Then**: Returns 200, JSON includes ok:true, env: 'development', version, and uptimeSeconds.
- **Automation Target**: API Integration

## 8. Prerequisite Enforcement
- **Preconditions**: DRAFT campaign missing Supplier ID.
- **When**: Attempt POST /api/admin/campaigns/:id/publish.
- **Then**: 400 Bad Request, error message lists 'Supplier' as missing.
- **Automation Target**: API Integration

## 9. Escrow Aggregation Match
- **Preconditions**: Campaign with multiple commitments.
- **When**: Sum amounts in escrow_ledger for campaign ID.
- **Then**: Total matches the sum of individual commitments and campaign's totalCommitted stat.
- **Automation Target**: Unit / SQL

## 10. Admin Product Management
- **Preconditions**: Authenticated admin.
- **When**: POST /api/admin/products then PATCH /api/admin/products/:id (status: ARCHIVED).
- **Then**: Product is first created, then status field becomes 'ARCHIVED'.
- **Automation Target**: API Integration
