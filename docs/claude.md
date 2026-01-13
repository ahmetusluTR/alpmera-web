# Alpmera - Trust-First Collective Buying Platform

## Overview
Alpmera is a campaign-based collective buying platform that prioritizes trust, auditability, and correctness. It uses an escrow-style commitment model where user funds are locked until campaign conditions are met, ensuring transparency and security. The platform's core principles revolve around trust, auditability through an append-only ledger, and a transparent state machine for campaign lifecycle management.

## User Preferences
The user prefers clear, concise explanations and a development process that emphasizes auditability and correctness over speed. They value transparent communication and want to be consulted before any major architectural changes are made.

## System Architecture

### Tech Stack
-   **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
-   **Backend:** Express.js, TypeScript
-   **Database:** PostgreSQL with Drizzle ORM
-   **Routing:** wouter (frontend), Express routes (backend)
-   **State Management:** TanStack Query (React Query v5)

### Campaign State Machine
Campaigns progress through a defined state machine:
`AGGREGATION → SUCCESS → FULFILLMENT → RELEASED`
`     ↓           ↓           ↓`
`   FAILED     FAILED      FAILED`

**States:**
-   **AGGREGATION:** Campaign is open for commitments.
-   **SUCCESS:** Target met, awaiting supplier confirmation.
-   **FAILED:** Campaign target not met or cancelled.
-   **FULFILLMENT:** Supplier is fulfilling orders.
-   **RELEASED:** Funds have been released to the supplier.

### Data Models
Key data models include:
-   **Campaigns:** Stores product details, publication tracking, delivery information, and campaign rules.
-   **Campaign Admin Events:** An append-only audit log for lifecycle events.
-   **Commitments:** User commitments, optionally linked to users.
-   **Escrow Ledger:** An immutable record of fund movements (LOCK, REFUND, RELEASE).
-   **User Authentication (Phase 1.5):** Includes Users, User Profiles, User Sessions, and passwordless Auth Codes.
-   **USA-Only Delivery (Phase 1):** Hardcoded for USA delivery with USPS state abbreviations.

### Route Map & Guards
A centralized route guard system (AuthGuard, AdminGuard, PublicOnlyGuard) manages access to routes.
-   **Public Routes:** Home, campaign listings, how-it-works, FAQ, commitment status.
-   **Auth Routes:** Sign-in, OTP verification.
-   **Account Routes (AuthGuard):** User profile, commitments, payments, refunds, security.
-   **Admin Routes (AdminGuard):** Comprehensive management for campaigns, users, suppliers, payments, disputes, and platform configuration.

### Key Features
-   **4-Step Commitment Wizard:** Guides users through reviewing rules, specifying commitment amount, confirming details, and receiving escrow confirmation. It handles profile completion redirects.
-   **Escrow Ledger (Append-Only):** Ensures immutability and auditability of all fund movements. Balances are derived, not stored, and entries include `actor` and `reason`.
-   **Admin Console:** Provides tools for campaign management, state transitions, commitment tracking, refund/release processing, and an audit log.

### Security Configuration
-   **Admin API Authentication:** In development, GET requests are allowed, POST requests require `adminUsername`. In production, an `ADMIN_API_KEY` is mandatory via `x-admin-auth` header for all admin endpoints.
-   **Escrow Ledger Integrity:** Utilizes an append-only pattern with derived balances and standardized reason codes for fund movements, preventing tampering and ensuring auditability.

### Design Philosophy
The platform employs Inter and IBM Plex Mono typography, a neutral color palette, and a rules-first layout without urgency messaging. Interactions prioritize clarity, and trust elements like monospace reference numbers and visible IDs are emphasized.

## External Dependencies & Infrastructure

### Core Stack
-   **PostgreSQL (Supabase):** Primary database with connection pooling
-   **Drizzle ORM:** Type-safe database interaction with PostgreSQL
-   **Express.js:** Backend web application framework
-   **Vite:** Frontend build tool
-   **React + TypeScript:** Frontend framework

### Frontend Libraries
-   **Tailwind CSS:** Utility-first CSS framework
-   **shadcn/ui:** Radix UI-based component library
-   **TanStack Query (React Query v5):** Server-state management
-   **wouter:** Lightweight frontend routing library

### Development Environment
-   **VSCode:** Primary IDE
-   **Node.js:** Runtime environment
-   **tsx:** TypeScript execution for development
-   **dotenv:** Environment variable management
