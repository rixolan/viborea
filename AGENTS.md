# AGENTS.md

Operating manual for coding agents working on **Viborea**.

If this file and `docs/` or `CLAUDE.md` disagree, this file and `CONTEXT.md` win. Tandava yoga/Supabase docs under `docs/prd`, `docs/developer`, `src/` (repo root) are the **fork reference**, not the product.

## Read first

1. [CONTEXT.md](CONTEXT.md) — glossary. Identifiers in English. Do not invent synonyms.
2. This file — stack, tree, constraints, where to change things.
3. [SKILLS.md](SKILLS.md) — load the skill that matches the task before editing.
4. [docs/fork/DOMINIO-VIBOREA.md](docs/fork/DOMINIO-VIBOREA.md) — court + session + coach, overlap, packs.
5. [NOTICE](NOTICE) + [LICENSE](LICENSE) — AGPL-3.0 fork of Tandava. Do not delete copyright.

Then read the files you will touch. Do not start from the Tandava SPA.

## What this is

Viborea is operations software for a **pádel academy**: one grid (location + court + coach + time), packs or drop-in, pay-ahead, weekly exceptions on a mother template. No double-book of court or coach.

It is **not** public court rental (Playtomic). It is **not** “book 30 minutes with me” (Calendly). Academia DG (Asunción) is the pilot tenant, not the schema.

Product name: **Viborea**. Metaphor (the padel shot *bandeja*) may appear in domain prose. Never as the product, Docker, Git, or database name.

## Language

| UI (castellano) | Code / DB | Do not use |
|---|---|---|
| Academia | `academy` (row), area `/academia` | Admin, tenant, club (marketplace) |
| Jugador | `students` | Cliente, client, user, member |
| Profe / entrenador | `coaches` | Separate product area `/profe` |
| Sede | `locations` | Club, venue |
| Pista / cancha | `courts` (`court` in schema) | `pista`/`cancha` as column names |
| Clase (instancia) | `sessions` | class, slot, reservation as identity |
| Planilla madre | `templates` | Calendly event type |
| Reserva | `bookings` | Payment, appointment |
| Pack | `packs` / entitlement | Membership as the only product |

Copy: castellano. Schema: English. `court` → pista (es-ES default) / cancha (es-AR, es-PY) in i18n, not in SQL.

**Two product areas:** booker público (`/reservar/:slug`) and Academia (`/academia`). Coach is a filter inside Academia, not a third app. `/jugador` and `/cliente` redirect to `/`.

## Stack (the product)

One process in production.

| Piece | Technology | Lives in |
|---|---|---|
| Runtime | Bun 1.4 | `core/` |
| HTTP | `Bun.serve` | `core/src/server.ts` |
| JSON API | `/api/*` | `core/src/api.ts` |
| Domain | TypeScript, no ORM | `core/src/domain/` |
| DB | Postgres 18, `postgres.js`, SQL on boot | `core/src/db/` |
| SPA | Vite + React 19 + Tailwind v4 | `web/` |
| Auth (shells) | Clerk (`@clerk/clerk-react`) | `web/src/main.tsx` |
| Image | root `Dockerfile`: build SPA, copy to `/web/dist`, run Bun | compose service `app` |

Local: `docker compose up -d db` then `bun run dev` (API, default `:3000`) and `bun run web` (Vite `:5173`, proxies `/api` → `:8080` — align `PORT` or the proxy). Production: `PORT=8080`, SPA served from `web/dist` when that folder exists.

**Do not** add Nuxt, a second Node server, or put the product back on Supabase/Stripe Checkout as the happy path.

Root `package.json` still has Tandava Vite scripts (`bun run dev:fork`, `vitest`). That tree is reference. Product tests: `bun run test:core`.

## Tree

```
core/src/domain/     overlap, capacity, template, cutoff, pack, student
core/src/db/         schema.sql, migrate.ts, postgres.js
core/src/db.ts       persistence + week materialize
core/src/api.ts      JSON API
core/src/server.ts   Bun.serve: API, SPA, leftover HTML, hooks
core/src/seed.ts     demo academy if empty
web/src/             React SPA (landing, reservar, jugador, academia)
compose.yaml         db + app, network `viborea`, volume `viborea_pgdata`
Dockerfile           SPA build + Bun
workers/chatwoot-agent-bot/   WhatsApp menu via Chatwoot AgentBot (sandbox only)
docs/fork/           Viborea domain + Tandava inventory
docs/adr/            decisions (0001: Postgres 18)
src/                 Tandava React SPA (reference, AGPL). Not the product UI.
supabase/            Tandava migrations. Not the product DB.
```

## Domain engine (non-negotiable)

- **Session** exists with court + coach + interval even if nobody booked or paid.
- Overlap: same half-open interval `[start, end)` **and** same `court_id` **or** same `coach_id` → error. Adjacent hours do not overlap. Cancelled sessions do not occupy.
- Occupying booking statuses: `pending_payment`, `confirmed`, `checked_in`. Not: `cancelled`, `waitlisted`, `no_show`.
- Offerings are capacity 1 (individual) or N (grupal). CONTEXT.md: **no dual** as a third engine.
- Template (`templates`) materializes `sessions` (`source = template`). Exception edits one session. Do not mutate the mother unless “from this week on”.
- `ensureWeek` materializes the requested Monday week. `/api/week?monday=` must call it (not the `week=` HTML query).
- Cutoff: `academy.cutoff_hours` (default 12). Not hardcoded to DG’s 24h.
- Money: integer minor units + `currency`. Never assume Gs. or Stripe.
- Pack consume: same moment Tandava already used (confirm covered booking), not a third moment.

Code: `core/src/domain/overlap.ts`, `capacity.ts`, `template.ts`, `cutoff.ts`, `pack.ts`. Tests: `core/src/domain/*.test.ts`, `core/src/db.test.ts`.

## HTTP

JSON (SPA):

| Method | Path | Role |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/booker` | slug if exactly one academy (cutover 301) |
| GET | `/api/a/:slug/week?monday=` | public booker week |
| POST | `/api/a/:slug/book` | public book (`pending_payment` / waitlist) |
| GET | `/api/week?monday=` | staff week (org JWT → academy_id) |
| GET | `/api/sessions/:id` | staff session + roster |
| POST | `/api/bookings/:id/status` | academia marks paid / pending |

SPA routes: `/`, `/entrar`, `/reservar`, `/reservar/:slug`, `/reservar/:slug/:sessionId`, `/academia`, `/academia/sesion/:id`.

If `web/dist` exists, GET (except `/piloto`) serves the SPA. Leftover HTML in `core/src/html.ts` is fallback for local-without-dist and `/piloto`. Do not add new HTML pages; add React + `/api`.

## Data
- Schema: `core/src/db/schema.sql`. Additive changes: new id in `core/src/db/migrate.ts`.
- Boot: `openDb` → migrate → `seedIfEmpty` → `alignCatalog`.
- Production DB name/user: `viborea`. Compose volume: `viborea_pgdata`. Do not publish Postgres to the internet.
- N academias per Postgres (`academy_id` on tenant tables). Who may open `/academia`: Clerk Organization (ADR 0002 + 0003). Not `{slug}.viborea.com` yet.
- Do not add `academy_id` only to decorate URLs. Isolation is application-scoped queries, not RLS.

## Deploy (production)

- GitHub: `rixolan/viborea` (origin). Upstream Tandava: `TaylorONeal/tandava`.
- Dokploy project **academia-dg** / production, compose **viborea**, dir `/etc/dokploy/compose/viborea/code`.
- Public: `https://viborea.com` → `viborea-app-1:8080` on Docker network **`viborea`**. Traefik must be attached to that network (`traefik.docker.network=viborea`).
- Metabase: Dokploy compose `metabase` (`academiadg-metabase-nimooc`), database **Academia** → host `viborea-db-1`, db/user `viborea`. Sync schema after migrate. No analysis views in product schema.
- Image build arg Clerk: `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `VITE_CLERK_PUBLISHABLE_KEY` (publishable only).
- After compose changes: `git pull` in that dir, `docker compose -p viborea --env-file .env build app`, `up -d --no-deps app`. Do not recreate Postgres unless migrating data. Old volume `bandeja-2ryryu_pgdata` is a backup only.

## Constraints (do not)

- Production Meta / WhatsApp of the academy. No OpenWA/WAHA. Chatwoot worker is sandbox / dedicated number only.
- Live TPago, Pagopar, Mercado Pago, Stripe Checkout as happy path. Keep `PaymentProvider` / `core/src/payments/tpago.ts` behind the interface.
- Payroll / coach pooling.
- Player progress portal, Captain AI, public court marketplace.
- Delete AGPL, LICENSE, NOTICE, or Tandava copyright.
- Rename product back to Bandeja in UI, Docker, Git, or Postgres.
- Nuxt or a second app server for the academy UI.
- Commit `.env`, Clerk secrets, Dokploy git tokens, DB passwords.

## How to change things

| Job | Where |
|---|---|
| Overlap / capacity / template | `core/src/domain/*` + `bun --cwd core test` |
| Persist / SQL | `schema.sql` + `migrate.ts` + `db.ts` |
| JSON contract | `core/src/api.ts` and `web/src/api.ts` together |
| Visible copy / areas | `web/src/pages.tsx`, `shell.tsx`, `App.tsx` |
| Seed catalog | `core/src/seed.ts` |
| Compose / Traefik | `compose.yaml` (network name must match live Docker network) |
| WhatsApp menu (sandbox) | `workers/chatwoot-agent-bot/` |

Commits: only if the human asks, unless the same session is already shipping to `origin/main` for deploy.

Verify: domain → `bun --cwd core test`. API/UI → hit `/api/health` and the changed route. Production → `https://viborea.com/api/health`.

## License

AGPL-3.0. Network use (SaaS) requires publishing modifications. Compatible with an open product for academies; incompatible with a closed SaaS born of this fork.
