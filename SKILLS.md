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
2. Overlap = interval overlap `[start, end)` AND (`court_id` equal OR `coach_id` equal). Both are errors. Adjacent end==start is not overlap. `cancelled` sessions do not occupy. Postgres enforces it (`sessions_court_no_overlap`, `sessions_coach_no_overlap`); keep those constraints and keep translating `23P01` to `OverlapError`.
3. Hours are **local to `academy.timezone`**. Build instants with `core/src/domain/timezone.ts` (`instantFrom`, `weekWindow`); never `setUTCHours`. Weeks come from `weekOf` / `weekOfAcademy`.
4. Occupying bookings: `pending_payment` | `confirmed` | `checked_in` (`OCCUPYING_BOOKING_STATUSES`). A cancelled booking may be revived on the same row.
5. Writes that decide a cupo run inside `db.begin` with the session row locked `FOR UPDATE`, and availability holes behind `pg_advisory_xact_lock`.
6. Individual/grupal are offerings with `capacity` 1 / N. Do not add dual as a third engine (CONTEXT.md).
7. Templates materialize sessions; exceptions edit one occurrence. Persist via `ensureWeek` / `createSession` in `core/src/db.ts`.
8. Keep the same error type (`OverlapError`). The API must surface the message, not swallow it.

**Files:** `core/src/domain/overlap.ts`, `capacity.ts`, `template.ts`, `timezone.ts`, `engine.test.ts`, `core/src/reliability.test.ts`, `core/src/db.ts`

**Check:** `DATABASE_URL=… bun --cwd core test` (the races and cascades live in `reliability.test.ts` and skip without a database)

---

## json-api-spa

**When:** new endpoint, booking flow, week grid, roster, or SPA data.

**Do:**

1. Add or change the handler in `core/src/api.ts` (`handleApi`). Return JSON errors with `{ error }`.
2. Mirror the type in `web/src/api.ts`. Do not use `ReturnType<typeof …>` for public contracts; name the type.
3. `GET /api/week?monday=` (staff, org JWT) and `GET /api/a/:slug/week?monday=` (booker) must `ensureWeek` for **that** Monday.
4. Public book: `POST /api/a/:slug/book` → `publicBook`. Guest until the ficha is claimed. Status `pending_payment` or waitlist. Rate-limited per IP.
5. Academia payment toggle: `POST /api/bookings/:id/status` (org JWT → `academy_id`).
5b. Every staff route goes through `requireAcademy`. Parse bodies with the `body()` helper so malformed JSON is a 400, and let `failed()` map domain errors; never add a route outside `handleApi`.
5c. Session payloads carry `local_date` / `local_time` / `time_zone`. The SPA displays those; it does not compute hours from `starts_at`.
6. SPA pages live in `web/src/pages.tsx`. Shell in `shell.tsx`. Routes in `App.tsx`.
7. Dev: Vite proxies `/api` to `http://127.0.0.1:8080`. If Bun listens on 3000, point the proxy at 3000 or set `PORT=8080`.
8. Production: Bun serves `web/dist` (path from `core/src/server.ts`: `../../web/dist`). New UI = React; `html.ts` is gone and must not come back.

**Files:** `core/src/api.ts`, `core/src/server.ts`, `web/src/api.ts`, `web/src/pages.tsx`, `web/vite.config.ts`

**Check:** `bun --cwd core test`; `bunx --cwd core tsc --noEmit -p tsconfig.json`; `cd web && bunx tsc --noEmit -p tsconfig.json && bun run build`; curl `/api/health`.

---

## schema-postgres

**When:** new table/column, seed, or persistence bug.

**Do:**

1. Product DB is Postgres 18 via `postgres.js`. No Prisma, no Supabase for Viborea.
2. Empty install: `core/src/db/schema.sql`. Existing: add a migration id in `core/src/db/migrate.ts` (`schema_migrations`).
3. N academias per Postgres. Tenant tables carry `academy_id`. Slug lives on `academy.slug` (ADR 0003). No `studio_id`.
4. Boot path: `openDb` → migrate → `seedIfEmpty` (`core/src/server.ts`). `alignCatalog` runs only with `SEED_ALIGN_DG=1`: it deletes DG's templates and availability. Sedes, canchas, profes, franjas and tipos de clase are edited from `/academia/catalogo` and `/academia/profes`, so do not add catalog rows to `seed.ts` for a new academia.
4b. `sessions` carries two GiST `EXCLUDE` constraints and needs `btree_gist`. Keep them in `schema.sql` for fresh installs and in `migrate.ts` for existing ones.
5. Production: user/db `viborea`, volume `viborea_pgdata`, not published to WAN. Local URL `postgres://viborea:viborea@127.0.0.1:5432/viborea`.
6. Do not edit `supabase/migrations/` for product schema.

**Files:** `core/src/db/schema.sql`, `migrate.ts`, `pg.ts`, `core/src/db.ts`, `core/src/seed.ts`, `docs/adr/0001-postgres-18.md`

**Check:** migrate on a throwaway DB or `DATABASE_URL=… bun --cwd core test` if persistence tests run; otherwise domain tests + a smoke `SELECT` after deploy.

---

## deploy-dokploy

**When:** shipping to viborea.com, compose, Traefik, Metabase, or “the server”.

**Do:**

1. Origin is `https://github.com/rixolan/viborea.git`. VPS code: `/etc/dokploy/compose/viborea/code`. SSH: Tailscale `per-net-us-east`.
2. Dokploy project **academia-dg** / **production**. Compose name **`viborea`**. Metabase and Chatwoot are sibling composes, not this repo’s `compose.yaml`.
3. Docker network **`viborea`** (external). App labels: `traefik.docker.network=viborea`.
4. Do not attach the app-only to `dokploy-network` overlay as the Traefik network.
5. Deploy: `git fetch && git reset --hard origin/main` then  
   `docker compose -p viborea --env-file .env build app && docker compose -p viborea --env-file .env up -d --no-deps app`  
   One `docker`, never `docker docker compose` (Dokploy UI has shown that typo → `unknown shorthand flag: 'p'`).
6. Avoid `up` that recreates `db`. Volume `viborea_pgdata` is the data. `bandeja-2ryryu_pgdata` is backup. “volume already exists” is not a failure.
7. Clerk publishable key: compose build-arg `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `VITE_CLERK_PUBLISHABLE_KEY`.
8. WhatsApp: copy `WHATSAPP_TEST_*` from Doppler `viborea`/`dev` into the VPS `.env` after any Dokploy Redeploy (it overwrites `.env`). `APP_URL=https://viborea.com`.
8b. `PLAYER_COOKIE_SECRET` belongs in the Dokploy env UI. Unset, the app signs with `CLERK_SECRET_KEY` and warns; production never signs with the repo constant. Rotate through `PLAYER_COOKIE_SECRET_OLD` so manage links already in WhatsApp keep working.
8c. The `backup` service dumps nightly to volume `viborea_backups`. Take a one-shot snapshot before a migration deploy: `docker compose -p viborea run --rm backup /usr/local/bin/pg-backup.sh --once`.
9. Metabase (`academiadg-metabase-nimooc`): network `viborea`, host `viborea-db-1`. Do not print DB passwords or git oauth tokens.
10. Host only exposes 80/443. Postgres stays on `127.0.0.1:5432`. Hex SSH uses port **80** (`sslh`).
11. Public check: `https://viborea.com/api/health` (`{"ok":true}`), SPA hash, `/coaches/coach-pablo-recalde.webp`.

**Files:** `compose.yaml`, `Dockerfile`, `.env.example`

**Check:** containers `viborea-app-1`, `viborea-db-1`; health JSON; Traefik on network `viborea`.

---

## payments-channels

**When:** cobro, TPago, WhatsApp, Chatwoot, Meta, inbox.

**Do:**

1. Booking ≠ transaction. Channel is booking metadata (`web` | `whatsapp` | `admin`), not a second calendar.
2. Happy path payment is stub / manual mark paid in Academia. `core/src/payments/tpago.ts` stays behind the interface. No live keys in git or chat.
3. Do not connect the academy’s production WhatsApp/Meta number. No OpenWA/WAHA.
4. Chatwoot AgentBot: `workers/chatwoot-agent-bot/` — sandbox or a dedicated WABA only. It does not write the real grid yet.
5. Notify + 24h reminder: `core/src/notify/whatsapp.ts` (dry-run unless `WHATSAPP_TEST_*` set). Manage link `core/src/manage-link.ts` → `/reservar/:slug/turno/:token`, signed with `core/src/secret.ts`. Cancel/reschedule only if `selfServeOpen` (cutoff, default 12h). Mark `reminded_at` only on a delivered free-text send: dry-run and the `hello_world` fallback are not reminders.
6. Secrets: Doppler project **viborea**, config **dev**. Never commit tokens.
7. Cutoff and pack rules: `core/src/domain/cutoff.ts`, `pack.ts`. Configurable per academy.

**Files:** `core/src/payments/tpago.ts`, `core/src/notify/whatsapp.ts`, `core/src/manage-link.ts`, `docs/fork/TPAGO.md`, `workers/chatwoot-agent-bot/README.md`

**Check:** domain tests; never a production webhook URL in this repo.

---

## ui-shell

**When:** landing, reservar, jugador, academia, catálogo, Clerk, visual design.

**Do:**

1. One shell: `web/src/shell.tsx` (stone, DM Sans). Primitives in `web/src/ui.tsx`. Do not add a second design system or Nuxt UI.
2. Clerk wraps the app only if `VITE_CLERK_PUBLISHABLE_KEY` is set. Do not call `useAuth` without `ClerkProvider` — split gated components (`ClerkGate`).
3. Booker lists real `/api/a/:slug/week` sessions (court + coach + cupos). No `placeholders.ts` occupancy in the SPA.
4. Academia: week + optional coach filter + roster + pagado/pendiente + cancelar clase + nueva clase. Sedes, canchas, profes y tipos de clase en `/academia/catalogo`; franjas de presencia en `/academia/profes`. Staff APIs send Clerk JWT.
4b. Dates and hours come from `local_date` / `local_time`, or `web/src/time.ts` with the payload `time_zone`. Never `new Date(iso).getUTCHours()`: a player in Madrid must read the Asunción hour.
5. Área del jugador: `/reservar/:slug/clases`. Entrar jugador `/entrar/jugador/:slug` (no activa org). Entrar academia `/entrar/academia`. No revivir `/jugador` as a third shell. Confirmación: signed-in uses Clerk name + `unsafe_metadata.whatsapp` (Clerk no admite PY). Guest still fills name + WhatsApp.
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
