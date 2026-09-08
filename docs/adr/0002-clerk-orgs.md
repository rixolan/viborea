# 0002. Clerk Organizations on viborea.com (no academy subdomain)

Date: 2026-09-09

## Context

Academia DG needs a private dashboard. More academies should be able to register later. Options: `{slug}.viborea.com`, Cloudflare for SaaS (custom domains), or one app on `viborea.com` with Clerk Organizations.

Clerk’s B2B model (2026) is a shared user pool + Organizations on a **single domain**. Path or session context selects the academy. Vanity subdomains and per-customer auth branding are “Clerk for Platforms”, not Organizations. Cloudflare for SaaS is for *customer* hostnames (`clases.academiadg.com`), not the first tenant URL.

This deploy is still **one Postgres academy**. Identity (who may open Academia) is separate from the write model.

## Decision

- **Clerk Organizations**: one org per academia. DG is `academiadg`. Role `org:admin` for the dashboard.
- **Same origin**: `https://viborea.com/academia`. `/registro` creates a user; `/academia/nueva` creates the org.
- **No** `academiadg.viborea.com` until a second paying academy needs a branded URL (then Cloudflare wildcard + same SPA, tenant from host).
- **No** Cloudflare for SaaS until an academy brings its own domain.
- Postgres stays single-academy. Do not add `academy_id` only to decorate URLs.

## Consequences

Players and public `/reservar` stay on viborea.com. Staff switch org with Clerk’s switcher. A second academy’s *data* still needs a later schema ADR. Mutation APIs under Academia send the Clerk session JWT.
