# Landing Implementation Status (January 25, 2026)

## Scope
- `landing/` directory only.

## Architecture
- Vite + React 18 + Wouter SPA.
- Entry: `landing/src/main.tsx` -> `landing/src/App.tsx`.
- Routes: `/` (LandingHome), `/demand`, `/privacy`, `/terms`.

## UI & Design System
- Tailwind with custom tokens in `landing/src/styles/tokens.css` and config in `landing/tailwind.config.ts`.
- Animation utilities in `landing/src/styles/animations.css`.
- Brand component library under `landing/src/components/brand` (Figma-derived assets, includes `AlpmeraBatchFlow`).

## Pages & Content
- **LandingHome:** hero, trust model, how-it-works (batch flow), safety cards, demand CTA, early access form, FAQ + skeptic FAQ, footer.
- **Demand:** product suggestion form with SKU tooltip and optional location/email fields.
- **Privacy / Terms:** pre-launch disclosures, structured sections, shared layout + navigation.

## Forms & Data Handling
- Early access + demand forms submit to `/api/landing/submit-form` via `landing/src/lib/googleSheets.ts`.
- Client-side rate limiting with localStorage in `landing/src/lib/rateLimit.ts`.
- Honeypot spam field in `landing/src/components/forms/HoneypotField.tsx`.
- Google Apps Script reference code in `landing/google-apps-script-code.js`.

## SEO
- JSON-LD injection in `landing/src/components/SEO/StructuredData.tsx` (Organization, FAQPage, WebSite, LocalBusiness).

## Deployment
- Standalone instructions in `landing/deploy-instructions.md`.
- `landing/vite.config.ts` uses `.env.production` from `landing/` in production; dev uses parent `.env`.
- `landing/vite.config.standalone.ts` exists for always-local env dir.
- `landing/dist/` contains built output (index, assets, sitemap, robots).

## Open Items / Assumptions
- Frontend expects `/api/landing/submit-form` proxy to exist; static-only deployment needs a backend or a direct Apps Script call.
- `VITE_GOOGLE_SCRIPT_URL` is defined in env/config but not referenced in app code.
- Analytics helpers in `landing/src/lib/analytics.ts` are not wired to UI events yet.
