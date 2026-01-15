# Alpmera Testing (Dev Phase)

## Purpose

This directory defines how testing works in Alpmera during the **Dev phase**.

Testing exists to protect:
- financial integrity
- escrow logic
- campaign state transitions
- trust-critical flows

Tests are designed to be:
- deterministic
- local
- safe
- schema-isolated

---

## Scope

### Supported
- Local development tests
- Unit tests
- API integration tests

### Explicitly NOT supported (yet)
- CI / GitHub Actions
- Staging tests
- Production tests

These will be introduced only after Dev stabilizes.

---

## Database Isolation Strategy (Critical)

Alpmera uses **Supabase Postgres**.

Supabase provides:
- one database per project
- multiple schemas

We use schema isolation:

| Usage | Schema |
|------|--------|
| Dev runtime | `public` |
| Automated tests | `test` |

Tests MUST operate exclusively on the `test` schema.

At no point should tests:
- read from
- write to
- truncate
- migrate

the `public` schema.

---

## Environment Variables

A `.env` file must exist at the project root (plain UTF-8 text).

Required variables:

```env
DATABASE_URL=postgresql://postgres.<project_ref>:<password>@aws-<region>.pooler.supabase.com:5432/postgres
NODE_ENV=development
APP_ENV=dev
ADMIN_API_KEY=alpmera-admin-key-2026

TEST_DATABASE_URL=postgresql://postgres.<project_ref>:<password>@aws-<region>.pooler.supabase.com:5432/postgres
TEST_DB_SCHEMA=test
