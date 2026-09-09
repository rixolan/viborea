# SKILLS.md

Repo-specific skills for Viborea. Load **AGENTS.md** + **CONTEXT.md** always. Load the matching skill below before editing.

How to use: if the user task matches **When**, follow **Do** in order. Do not skip tests named in **Check**.

---

## domain-language

**When:** naming entities, copy, routes, schema columns, or the user says cliente/admin/profe/bandeja/cancha/pista.

**Do:**

1. Read [CONTEXT.md](CONTEXT.md). Identifiers stay English (`court`, `session`, `student`, `booking`).
2. UI areas: **Academia** (`/academia`) and the public booker (`/reservar/:slug`). Profe is a filter on Academia, never a third shell.
3. Redirect leftovers: `/cliente` → `/`, `/jugador` → `/`, `/admin` → `/academia`, `/profe` → `/academia`.
4. Person who books = `students` in SQL, “jugador” in copy. Never “cliente”.
5. `court` in schema; pista (es-ES) / cancha (es-AR, es-PY) only in i18n.
6. Product name **Viborea**. “Bandeja” only as the padel-shot metaphor in domain prose.
7. If the user contradicts the glossary, stop and ask which term wins, then update CONTEXT.md (glossary only — no implementation).

**Files:** `CONTEXT.md`, `web/src/shell.tsx`, `web/src/App.tsx`, `web/src/pages.tsx`

**Check:** no new route or heading with Cliente, Admin, or Profe as a product area.

---

## overlap-engine

**When:** changing session times, courts, coaches, capacity, templates, or “double book”.

**Do:**

1. Read `core/src/domain/overlap.ts`, `capacity.ts`, `template.ts`, `types.ts`.
2. Overlap = interval overlap `[start, end)` AND (`court_id` equal OR `coach_id` equal). Both are errors. Adjacent end==start is not overlap. `cancelled` sessions do not occupy.
3. Occupying bookings: `pending_payment` | `confirmed` | `checked_in` (`OCCUPYING_BOOKING_STATUSES`).
4. Individual/grupal are offerings with `capacity` 1 / N. Do not add dual as a third engine (CONTEXT.md).
5. Templates materialize sessions; exceptions edit one occurrence. Persist via `ensureWeek` / `createSession` in `core/src/db.ts`.
6. Keep the same error type (`OverlapError`). API/HTML must surface the message, not swallow it.

**Files:** `core/src/domain/overlap.ts`, `capacity.ts`, `template.ts`, `engine.test.ts`, `core/src/db.ts`

**Check:** `bun --cwd core test`

---

## json-api-spa

**When:** new endpoint, booking flow, week grid, roster, or SPA data.

**Do:**

1. Add or change the handler in `core/src/api.ts` (`handleApi`). Return JSON errors with `{ error }`.
2. Mirror the type in `web/src/api.ts`. Do not use `ReturnType<typeof …>` for public contracts; name the type.
3. `GET /api/week?monday=` (staff, org JWT) and `GET /api/a/:slug/week?monday=` (booker) must `ensureWeek` for **that** Monday.
4. Public book: `POST /api/a/:slug/book` → `publicBook`. Guest until the ficha is claimed. Status `pending_payment` or waitlist.
5. Academia payment toggle: `POST /api/bookings/:id/status` (org JWT → `academy_id`).
6. SPA pages live in `web/src/pages.tsx`. Shell in `shell.tsx`. Routes in `App.tsx`.
7. Dev: Vite proxies `/api` to `http://127.0.0.1:8080`. If Bun listens on 3000, point the proxy at 3000 or set `PORT=8080`.
8. Production: Bun serves `web/dist` (path from `core/src/server.ts`: `../../web/dist`). New UI = React, not `html.ts`.

**Files:** `core/src/api.ts`, `core/src/server.ts`, `web/src/api.ts`, `web/src/pages.tsx`, `web/vite.config.ts`

**Check:** `bun --cwd core test`; `cd web && bun run build`; curl `/api/health`.

---

## schema-postgres

**When:** new table/column, seed, or persistence bug.

**Do:**

1. Product DB is Postgres 18 via `postgres.js`. No Prisma, no Supabase for Viborea.
2. Empty install: `core/src/db/schema.sql`. Existing: add a migration id in `core/src/db/migrate.ts` (`schema_migrations`).
3. N academias per Postgres. Tenant tables carry `academy_id`. Slug lives on `academy.slug` (ADR 0003). No `studio_id`.
4. Boot path: `openDb` → migrate → `seedIfEmpty` → `alignCatalog` (`core/src/server.ts`).
5. Production: user/db `viborea`, volume `viborea_pgdata`, not published to WAN. Local URL `postgres://viborea:viborea@127.0.0.1:5432/viborea`.
6. Do not edit `supabase/migrations/` for product schema.

**Files:** `core/src/db/schema.sql`, `migrate.ts`, `pg.ts`, `core/src/db.ts`, `core/src/seed.ts`, `docs/adr/0001-postgres-18.md`

**Check:** migrate on a throwaway DB or `DATABASE_URL=… bun --cwd core test` if persistence tests run; otherwise domain tests + a smoke `SELECT` after deploy.

---

## deploy-dokploy

**When:** shipping to viborea.com, compose, Traefik, Metabase, or “the server”.

**Do:**

1. Origin is `https://github.com/rixolan/viborea.git`. VPS code: `/etc/dokploy/compose/viborea/code`.
2. Dokploy project **academia-dg** / **production**. Compose name **`viborea`** (`appName` `viborea`). Metabase and Chatwoot are sibling composes in the same project, not this repo’s `compose.yaml`.
3. Docker network **`viborea`** (external). App labels: `traefik.docker.network=viborea`. Traefik must be connected to that network or HTTPS hangs / 502.
4. Do not attach the app-only to `dokploy-network` overlay as the Traefik network; that overlay left empty IPs on this host before.
5. Deploy: `git fetch && git reset --hard origin/main` in the code dir, then  
   `docker compose -p viborea --env-file .env build app && docker compose -p viborea --env-file .env up -d --no-deps app`
6. Avoid `up` that recreates `db` unless you intend it. Volume `viborea_pgdata` is the data. `bandeja-2ryryu_pgdata` is backup.
7. Clerk publishable key: compose build-arg `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `VITE_CLERK_PUBLISHABLE_KEY`.
8. Metabase (`academiadg-metabase-nimooc`): must be on network `viborea`. Database **Academia**: host `viborea-db-1`, db/user `viborea`. After host/db rename, `POST /api/database/3/sync_schema` with a session. Do not print DB passwords or git oauth tokens.
9. Public check: `https://viborea.com/api/health` and the SPA path you changed.

**Files:** `compose.yaml`, `Dockerfile`, `.env.example`

**Check:** containers `viborea-app-1`, `viborea-db-1`; health JSON; Traefik router uses `172.x` on network `viborea`.

---

## payments-channels

**When:** cobro, TPago, WhatsApp, Chatwoot, Meta, inbox.

**Do:**

1. Booking ≠ transaction. Channel is booking metadata (`web` | `whatsapp` | `admin`), not a second calendar.
2. Happy path payment is stub / manual mark paid in Academia. `core/src/payments/tpago.ts` stays behind the interface. No live keys in git or chat.
3. Do not connect the academy’s production WhatsApp/Meta number. No OpenWA/WAHA.
4. Chatwoot AgentBot: `workers/chatwoot-agent-bot/` — sandbox or a dedicated WABA only. It does not write the real grid yet.
5. Pack alerts / WhatsApp notify: `core/src/notify/whatsapp.ts` (dry-run unless configured).
6. Cutoff and pack rules: `core/src/domain/cutoff.ts`, `pack.ts`. Configurable per academy, not hardcoded to DG.

**Files:** `core/src/payments/tpago.ts`, `core/src/notify/whatsapp.ts`, `docs/fork/TPAGO.md`, `workers/chatwoot-agent-bot/README.md`

**Check:** domain tests; never a production webhook URL in this repo.

---

## ui-shell

**When:** landing, reservar, jugador, academia, Clerk, visual design.

**Do:**

1. One shell: `web/src/shell.tsx` (stone, DM Sans). Primitives in `web/src/ui.tsx`. Do not add a second design system or Nuxt UI.
2. Clerk wraps the app only if `VITE_CLERK_PUBLISHABLE_KEY` is set. Do not call `useAuth` without `ClerkProvider` — split gated components (`ClerkGate`).
3. Booker lists real `/api/a/:slug/week` sessions (court + coach + cupos). No `placeholders.ts` occupancy in the SPA.
4. Academia: week + optional coach filter + roster + pagado/pendiente. Staff APIs send Clerk JWT.
5. Historial del jugador vive en el booker, no en `/jugador`.
6. Build: `cd web && bun run build`. Image copies `web/dist` to `/web/dist`.

**Files:** `web/src/*`, `web/vite.config.ts`, `web/index.html`

**Check:** `bun run build` in `web/`; production HTML title Viborea; `/reservar` is SPA not the old Bun HTML picker.

---

## license-fork

**When:** copying files, changing LICENSE, new repo, “proprietary”, or stripping Tandava.

**Do:**

1. Keep [LICENSE](LICENSE) AGPL-3.0 and [NOTICE](NOTICE) (Tandava copyright + Viborea).
2. Do not copy the tree into a clean repo without origin. Closed SaaS from this fork is a human legal decision, not an agent task.
3. Root `src/` + `supabase/` are the Tandava reference. Extend `core/` + `web/` for product work.
4. Upstream remote: `TaylorONeal/tandava`. Do not merge yoga identity into the Viborea UI.

**Check:** `LICENSE` and `NOTICE` still present after the change.

---

## out-of-scope-v1

Never implement in a default session:

- Payroll / pooling of coaches
- Player progress portal
- Captain AI / production chatbots
- Public court rental marketplace
- Billing Viborea to academies (SaaS metering)
- Native apps
- Bun rewrite of the Tandava `src/` tree “for cleanliness”
- Dual as a third offering engine (unless CONTEXT.md is updated first)
