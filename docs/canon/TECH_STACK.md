# Alpmera – Technical Stack

## Purpose

This document defines the official technical architecture of Alpmera.

All development, AI assistance, automation, and documentation must align with this stack unless explicitly revised.

---

# 1. System Overview

Alpmera is built as a modern web platform with:

- React-based frontend  
- Node.js API backend  
- PostgreSQL database  
- Cloud-hosted infrastructure  
- Git-based deployment workflows  

The system is designed for:

- Rapid iteration  
- Operational simplicity  
- Low-cost maintenance  
- Secure escrow-based workflows  

---

# 2. Frontend Stack

### Core Technologies

| Layer | Technology |
|-----|-----------|
| Framework | React |
| Build Tool | Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State Management | React hooks / context |
| HTTP Client | Fetch / Axios |
| Hosting | Vercel |

### Frontend Responsibilities

- User interface for campaigns  
- Join and commit flows  
- Admin console  
- Authentication UI  
- Campaign dashboards  
- Responsive design  

---

# 3. Backend Stack

### Core Technologies

| Layer | Technology |
|-----|-----------|
| Runtime | Node.js |
| Framework | Express |
| Language | TypeScript |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Supabase) |
| Process Manager | PM2 |
| API Style | REST |
| Environment | DigitalOcean VPS |

### Backend Responsibilities

- Campaign management  
- Escrow logic  
- Authentication  
- Admin APIs  
- Supplier workflows  
- Business rules  
- Integrations  

---

# 4. Database Layer

### Primary Database

- Provider: Supabase  
- Engine: PostgreSQL  
- Access: Connection string via environment variables  
- ORM: Drizzle  

### Design Philosophy

- Strong typing  
- Migrations-based schema  
- Minimal stored procedures  
- Logic primarily in application layer  
- Audit-friendly data models  

---

# 5. Hosting & Infrastructure

### Environments

| Environment | Purpose |
|-------------|--------|
| Localhost | Development |
| Staging | api-test.alpmera.com |
| Production | api.alpmera.com |

### Hosting Providers

| Component | Provider |
|---------|---------|
| Frontend | Vercel |
| Backend | DigitalOcean |
| Database | Supabase |
| Domain | Standard DNS providers |
| SSL | Let’s Encrypt / Vercel |

---

# 6. Deployment Model

### Source Control

- Platform: GitHub  
- Branching:

| Branch | Purpose |
|------|--------|
| dev | Default active development |
| main | Stable / production-ready |

### Deployment Flow

1. Code changes are made on `dev`  
2. Pushed to GitHub  
3. Backend deployed manually to staging via PM2  
4. Frontend deployed via Vercel  
5. After validation, merged to `main`  

### Backend Runtime

- Process Manager: PM2  
- Build Output: `dist/index.cjs`  
- Config: `ecosystem.config.cjs` (not committed)

---

# 7. Security Model

### Secrets Management

- All secrets stored as environment variables  
- No credentials in git  
- Separate staging and production keys  

### Key Security Principles

- Escrow-first architecture  
- No direct fund handling  
- Role-based access  
- Admin API key authentication  
- Input validation  
- HTTPS everywhere  

---

# 8. Development Tools

### Primary Tools

| Purpose | Tool |
|-------|-----|
| IDE | VS Code |
| AI Pair Programming | ChatGPT, Claude |
| ORM Tooling | Drizzle Kit |
| API Testing | Postman / Curl |
| Process Management | PM2 |
| Version Control | Git |

---

# 9. API Structure

### Style

- RESTful endpoints  
- JSON responses  
- Explicit status codes  
- Environment-aware behavior  

### Example Endpoint Pattern

/api/campaigns
/api/admin/*
/api/auth/*

---

# 10. Observability

### Logging

- Application logs via PM2  
- Nginx access logs  
- Error logging to console  
- Health endpoint available  

### Monitoring

- Process uptime via PM2  
- Basic server metrics  
- Manual log review  

---

# 11. Current Constraints

- No email service yet  
- No third-party payment gateway integration  
- Manual operational workflows  
- Early-stage admin console  

These are planned for future phases.

---

# 12. Future Technical Roadmap

Planned enhancements include:

- Payment processor integration  
- Automated notifications  
- Event-driven architecture  
- Improved admin tooling  
- More robust monitoring  
- Multi-environment CI/CD  

---

# 13. Non-Negotiables

Any technical design must respect:

- Alpmera language doctrine  
- Escrow-first logic  
- Trust-first principles  
- Phase-based rollout  
- Minimal operational risk  

---

## Maintainers

Alpmera Core Development Team  
Seattle, Washington

---

## Revision Policy

This document must be updated whenever:

- New infrastructure is added  
- Tools are changed  
- Deployment flow evolves  
- Environments are modified  
