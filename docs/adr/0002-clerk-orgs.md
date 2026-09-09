# 0002. Clerk Organizations on viborea.com (no academy subdomain)

Superseded in part by [0003](0003-multi-academy.md): identity is still Clerk orgs on one origin; the write model is no longer one academy per Postgres.

Date: 2026-09-09

## Context

Academia DG needs a private dashboard. More academies should be able to register later. Options: `{slug}.viborea.com`, Cloudflare for SaaS (custom domains), or one app on `viborea.com` with Clerk Organizations.

Clerk’s B2B model (2026) is a shared user pool + Organizations on a **single domain**. Path or session context selects the academy. Vanity subdomains and per-customer auth branding are “Clerk for Platforms”, not Organizations. Cloudflare for SaaS is for *customer* hostnames (`clases.academiadg.com`), not the first tenant URL.

Identity (who may open Academia) is separate from the write model (see [0003](0003-multi-academy.md)).

## Decision

- **Clerk Organizations**: one org per academia. DG is `academiadg`. Role `org:admin` for the dashboard.
- **Same origin**: `https://viborea.com/academia`. `/registro` creates a user; `/academia/nueva` creates the org.
- **No** `academiadg.viborea.com` until a second paying academy needs a branded URL (then Cloudflare wildcard + same SPA, tenant from host).
- **No** Cloudflare for SaaS until an academy brings its own domain.
- Write model: [0003](0003-multi-academy.md). Do not add `academy_id` only to decorate URLs.

## Consequences

Players book at `/reservar/:slug`. Staff switch org with Clerk’s switcher. Mutation APIs under Academia send the Clerk session JWT and scope by `orgId` → `academy_id`.
