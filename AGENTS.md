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

**Two product areas:** booker público (`/reservar/:slug`) and Academia (`/academia`). The player home of an academia is `/reservar/:slug/clases` (upcoming / past), not a third shell. `/entrar/jugador/:slug` vs `/entrar/academia`. Coach is a filter inside Academia. `/jugador` → `/entrar/jugador`. `/cliente` → `/`.

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
core/src/domain/     overlap, capacity, template, cutoff, pack, student, availability, timezone
core/src/db/         schema.sql, migrate.ts, postgres.js
core/src/db.ts       persistence + week grid + reminders + catálogo/availability CRUD
core/src/api.ts      JSON API
core/src/secret.ts   signing secrets for cookie + manage links (required in prod)
core/src/ratelimit.ts  per-IP limiter for the public booker
core/src/server.ts   Bun.serve: API, SPA, 60s tick (holds + reminders)
core/src/notify/     WhatsApp Cloud API sandbox (`WHATSAPP_TEST_*`)
core/src/seed.ts     demo academy if empty; `alignCatalog` replaces DG roster
web/src/             React SPA (landing, reservar, academia)
web/src/time.ts      formats every date in the academy timezone
web/public/coaches/  ten `{coach_id}.webp` portraits
compose.yaml         db + app + backup, network `viborea`, volumes `viborea_pgdata` / `viborea_backups`
ops/pg-backup.sh     nightly pg_dump with retention (the `backup` service)
.github/workflows/   CI: tsc + bun test on Postgres + SPA build + image build
Dockerfile           SPA build + Bun
workers/chatwoot-agent-bot/   WhatsApp menu via Chatwoot AgentBot (sandbox only)
docs/fork/           Viborea domain + Tandava inventory
docs/adr/            decisions (0001: Postgres 18, 0003: multi-academy)
src/                 Tandava React SPA (reference, AGPL). Not the product UI.
supabase/            Tandava migrations. Not the product DB.
```

## Domain engine (non-negotiable)

- **Session** exists with court + coach + interval even if nobody booked or paid. On DG it is created at the first booking on an availability hole.
- **Availability** (`coach_availability`) is DG’s mother: coach + location + weekday + franja, exploded to 60 min holes. Not a Session.
- Overlap: same half-open interval `[start, end)` **and** same `court_id` **or** same `coach_id` → error. Adjacent hours do not overlap. Cancelled sessions do not occupy. Enforced by **Postgres**: `sessions_court_no_overlap` / `sessions_coach_no_overlap` (GiST `EXCLUDE` on `tstzrange`, `WHERE NOT cancelled`). A TypeScript-only check cannot win a race; `createSession` translates `23P01` into `OverlapError`.
- **Times are local wall clock at the sede.** Template rows and availability blocks store `HH:MM` in `academy.timezone`; `core/src/domain/timezone.ts` turns that into the real instant. A 06:00 Asunción class is `09:00Z`. Never read the hour out of a `TIMESTAMPTZ` with `getUTCHours`; the API ships `local_date` / `local_time` / `time_zone` on every session, booking and manage payload.
- Weeks are the academy's local Monday. `weekOf` / `weekOfAcademy` resolve a `WeekRef` (an instant, or a local `YYYY-MM-DD`) to `[monday 00:00 local, +7d)`.
- `publicBook` runs in one transaction: `pg_advisory_xact_lock` on the availability hole, `SELECT … FOR UPDATE` on the session, then the booking. Cancel and reschedule share it, so a move can never leave two cupos held.
- Re-booking a class you cancelled reuses the same `bookings` row (`UNIQUE (session_id, student_id)`); a cancelled booking is history, not a lock on the cupo.
- `cancelSession` cancels every booking on the class and gives pack classes back regardless of cutoff (the academia cancelled, not the player), and the API notifies each player by WhatsApp.
- `academy.hold_minutes` (0 = off) expires unpaid `web` holds in the 60s tick and tells the player. `MAX_UPCOMING_BOOKINGS` caps one ficha at 20 classes ahead.
- Occupying booking statuses: `pending_payment`, `confirmed`, `checked_in`. Not: `cancelled`, `waitlisted`, `no_show`.
- Offerings are capacity 1 (individual) or N (grupal). CONTEXT.md: **no dual** as a third engine.
- Template (`templates`) still materializes `sessions` (`source = template`) where used. Exception edits one session.
- `/api/a/:slug/week` returns `weekGrid` (locked sessions + free holes). Staff `/api/week` still `ensureWeek`.
- Cutoff: `academy.cutoff_hours` (default 12). Self-serve book/cancel/reschedule only outside that window.
- 24h reminder: occupying booking with `reminded_at` null and `starts_at` within 24h → WhatsApp + manage link. Tick in `server.ts`. Only a **delivered free-text** send marks `reminded_at`; the `hello_world` fallback and dry-run do not. Failures count `reminder_attempts` and stop at `MAX_REMINDER_ATTEMPTS` (3) instead of retrying every 60s.
- Money: integer minor units + `currency`. Never assume Gs. or Stripe.
- Pack consume: same moment Tandava already used (confirm covered booking), not a third moment.
- Player identity on the booker: linked `clerk_user_id` wins; otherwise the guest cookie (`vb_p_<slug>`) is the ficha, and a signed-in Clerk user (staff org included) may claim that unclaimed cookie. Staff routes (`/api/week`, …) never read the player cookie. Do not clear the player cookie just because `/me` has a Clerk JWT without a ficha. Clerk native phone is off (Paraguay is unsupported). WhatsApp lives in Clerk `unsafe_metadata.whatsapp` and is collected on first reserve. Guest booker still asks name + WhatsApp.

Code: `core/src/domain/overlap.ts`, `capacity.ts`, `template.ts`, `cutoff.ts`, `pack.ts`, `availability.ts`. Tests: `core/src/domain/*.test.ts`, `core/src/db.test.ts`.

## HTTP

JSON (SPA):

| Method | Path | Role |
|---|---|---|
| GET | `/api/health` | liveness: process **and** `SELECT 1` (`{"ok":true}`, else 503) |
| GET | `/api/booker` | `{slug}` if exactly one academy. Never a list of academies. |
| GET | `/api/a/:slug/catalog` | public locations/coaches |
| GET | `/api/a/:slug/week?monday=` | public booker week (holes + locked) |
| POST | `/api/a/:slug/book` | public book; sets player cookie; WhatsApp if configured |
| GET | `/api/a/:slug/me` | player history (Clerk and/or cookie) |
| GET | `/api/a/:slug/manage/:token` | HMAC manage page payload |
| POST | `/api/a/:slug/manage/:token/cancel` | self-serve cancel if cutoff open |
| POST | `/api/a/:slug/manage/:token/reschedule` | self-serve move if cutoff open |
| GET | `/api/week?monday=` | staff week (org JWT → academy_id) |
| GET | `/api/sessions/:id` | staff session + roster |
| POST | `/api/bookings/:id/status` | academia marks paid / pending |
| POST | `/api/sessions` | staff one-off class (`date` + `startTime` in academy tz) |
| POST | `/api/sessions/:id/cancel` | staff cancel: cascades bookings, restores packs, avisa |
| GET PATCH | `/api/settings` | name, timezone, currency, `cutoff_hours`, `hold_minutes` |
| GET POST | `/api/availability` | franjas de presencia (the DG mother), `DELETE /:id` |
| POST | `/api/locations` `/api/courts` `/api/coaches` `/api/offerings` | catálogo; `PATCH`/`DELETE /:id` |
| PATCH | `/api/students/:id` | categoría y lado |

Public booker writes are rate-limited per IP (40 attempts and 12 bookings per 10 min). Staff routes need the Clerk org JWT and answer 503 when `CLERK_SECRET_KEY` is missing in production — never the pilot academy wide open.

SPA: `/`, `/entrar`, `/entrar/academia`, `/entrar/jugador`, `/entrar/jugador/:slug`, `/registro`, `/reservar/:slug`, `/reservar/:slug/clases` (player home), `/reservar/:slug/turno/:token`, `/reservar/:slug/:sessionId`, `/academia`, `/academia/profes`, `/academia/catalogo`, `/academia/ajustes`, `/academia/sesion/:id`. `/jugador` → `/entrar/jugador`.

If `web/dist` exists, GET serves the SPA (hashed assets immutable, `index.html` no-cache). `core/src/html.ts` and `placeholders.ts` are **deleted**: the server-rendered pages were unauthenticated writes against Academia DG. Everything is React + `/api`. The pilot is `POST /api/piloto` (JSON, off in production unless `PILOTO_ENABLED=1`).

Coach portraits: `web/public/coaches/{coach_id}.webp` → `/coaches/…`. Not Postgres, not R2. Bio and spoken languages live on `coaches` (`bio`, `languages` ISO 639-1) and come out of `/api/a/:slug/catalog`.

## Data
- Schema: `core/src/db/schema.sql`. Additive changes: new id in `core/src/db/migrate.ts`.
- Boot: `openDb` → migrate → `seedIfEmpty`. **`alignCatalog` only when `SEED_ALIGN_DG=1`**: it rewrites the DG roster from `seed.ts` and drops that academy's templates and availability, so on every boot it silently deleted whatever staff had edited.
- Migrations 012–016: local-time reinterpretation of `sessions`, the two GiST exclusion constraints, `bookings.created_at` / `reminder_attempts`, `academy.hold_minutes`, one availability block per coach+weekday+start. 013 refuses to apply while two live overlapping sessions both hold reservations; cancel one of each pair it names.
- A new academia (Clerk org) gets Individual (cupo 1) and Grupal (cupo 4) offerings automatically; sedes, canchas, profes and franjas are loaded from `/academia/catalogo` and `/academia/profes`, not from code.
- Production DB name/user: `viborea`. Compose volume: `viborea_pgdata`. Do not publish Postgres to the internet.
- N academias per Postgres (`academy_id` on tenant tables). Who may open `/academia`: Clerk Organization (ADR 0002 + 0003). Not `{slug}.viborea.com` yet.
- Do not add `academy_id` only to decorate URLs. Isolation is application-scoped queries, not RLS.

## Deploy (production)

- GitHub: `rixolan/viborea` (origin). Upstream Tandava: `TaylorONeal/tandava`.
- Dokploy project **academia-dg** / production, compose **viborea**, dir `/etc/dokploy/compose/viborea/code`.
- Public: `https://viborea.com` → `viborea-app-1:8080` on Docker network **`viborea`**. Traefik must be attached to that network (`traefik.docker.network=viborea`).
- VPS Tailscale: `per-net-us-east` (`100.98.190.87`). Host firewall only forwards **80/443**. Postgres is `127.0.0.1:5432` only. Hex (and similar) SSH is **port 80** via `sslh` → `127.0.0.1:22` (user `hex`, key-only). Do not publish `5432`.
- Metabase: Dokploy compose `metabase` (`academiadg-metabase-nimooc`), database **Academia** → host `viborea-db-1`, db/user `viborea`. Sync schema after migrate. No analysis views in product schema.
- `PLAYER_COOKIE_SECRET` signs the player cookie and the manage links. Unset, the app falls back to `CLERK_SECRET_KEY` and warns at boot; it never signs with the repo constant in production. Set a dedicated one (`openssl rand -base64 32`) in the Dokploy env UI so rotating Clerk does not invalidate every manage link already sent, and keep the previous value in `PLAYER_COOKIE_SECRET_OLD` while old links age out.
- Backups: the `backup` service runs `ops/pg-backup.sh` (nightly `pg_dump` → volume `viborea_backups`, `BACKUP_KEEP_DAYS` retention). Snapshot before a risky deploy: `docker compose -p viborea run --rm backup /usr/local/bin/pg-backup.sh --once`. Restore: `gunzip -c viborea-<stamp>.sql.gz | psql -U viborea -d viborea`.
- Image build arg Clerk: `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `VITE_CLERK_PUBLISHABLE_KEY` (publishable only). Runtime `CLERK_SECRET_KEY` from `.env` (`NUXT_CLERK_SECRET_KEY` alias). Live image still uses **Clerk development** (`pk_test`) until a `pk_live` rebuild.
- WhatsApp sandbox: `WHATSAPP_TEST_TOKEN` + `WHATSAPP_TEST_PHONE_NUMBER_ID` from Doppler project **viborea** config **dev** (prd is empty). `APP_URL=https://viborea.com`. Dokploy “Redeploy” rewrites `.env` from its stored blob and **drops** those keys unless they are in the Dokploy env UI.
- Deploy command (one `docker`, not `docker docker`):
  `git fetch && git reset --hard origin/main`
  then `docker compose -p viborea --env-file .env build app && docker compose -p viborea --env-file .env up -d --no-deps app`
- Dokploy UI error `unknown shorthand flag: 'p'` means the compose command was saved as `docker docker compose …`. Fix the command field; do not Redeploy until it is a single `docker compose`.
- Volume warning `viborea_pgdata already exists` is harmless. Do not recreate `db`. Old volume `bandeja-2ryryu_pgdata` is backup only.
- Public check: `https://viborea.com/api/health` → `{"ok":true}`; SPA asset hash in `/`; `/coaches/coach-pablo-recalde.webp` 200.

## Constraints (do not)

- Production Meta / WhatsApp of the academy. No OpenWA/WAHA. Chatwoot worker is sandbox / dedicated number only.
- Live TPago, Pagopar, Mercado Pago, Stripe Checkout as happy path. Keep `PaymentProvider` / `core/src/payments/tpago.ts` behind the interface.
- Payroll / coach pooling.
- Player progress portal, Captain AI, public court marketplace.
- Delete AGPL, LICENSE, NOTICE, or Tandava copyright.
- Rename product back to Bandeja in UI, Docker, Git, or Postgres.
- Nuxt or a second app server for the academy UI.
- Server-rendered HTML pages, or any `/api` write that does not go through `requireAcademy` or a signed player token.
- `alignCatalog` on boot, or catalog/availability rows that only exist in `seed.ts`.
- Reading or writing a class hour as UTC. Use `core/src/domain/timezone.ts` and `web/src/time.ts`.
- Commit `.env`, Clerk secrets, Dokploy git tokens, DB passwords.

## How to change things

| Job | Where |
|---|---|
| Overlap / capacity / template / availability | `core/src/domain/*` + `bun --cwd core test` |
| Persist / SQL | `schema.sql` + `migrate.ts` + `db.ts` |
| JSON contract | `core/src/api.ts` and `web/src/api.ts` together |
| Visible copy / areas | `web/src/pages.tsx`, `shell.tsx`, `App.tsx` |
| Seed catalog / DG roster | `core/src/seed.ts` |
| Coach portraits | `web/public/coaches/{id}.webp` + `COACH_PHOTOS` in `web/src/booker.tsx` |
| Coach bio / languages | `coaches.bio`, `coaches.languages` via `core/src/seed.ts` (`alignCatalog`) |
| Compose / Traefik | `compose.yaml` (network name must match live Docker network) |
| WhatsApp send / reminders | `core/src/notify/whatsapp.ts`, `server.ts` tick, Doppler `viborea/dev` |
| Local time / weeks | `core/src/domain/timezone.ts`, `web/src/time.ts` |
| Catálogo, franjas, ajustes | `core/src/db.ts` CRUD + `/api` + `web/src/pages.tsx` (`AcademiaCatalogo`, `AcademiaProfes`, `AcademiaAjustes`) |
| Rate limits / holds / quota | `core/src/ratelimit.ts`, `expireStaleHolds`, `MAX_UPCOMING_BOOKINGS` |
| WhatsApp menu (sandbox) | `workers/chatwoot-agent-bot/` |

Commits: only if the human asks, unless the same session is already shipping to `origin/main` for deploy.

Verify: `bun --cwd core test` (set `DATABASE_URL` or the Postgres half skips), `bunx --cwd core tsc --noEmit -p tsconfig.json`, `cd web && bunx tsc --noEmit -p tsconfig.json && bun test && bun run build`. CI runs all of it plus a Docker build. API/UI → hit `/api/health` and the changed route. Production → `https://viborea.com/api/health`.

## License

AGPL-3.0. Network use (SaaS) requires publishing modifications. Compatible with an open product for academies; incompatible with a closed SaaS born of this fork.
