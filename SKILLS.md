# SKILLS.md

Repo-specific skills for Viborea. Load **AGENTS.md** + **CONTEXT.md** always. Load the matching skill below before editing.

How to use: if the user task matches **When**, follow **Do** in order. Do not skip tests named in **Check**.

---

## current-focus-simplybook-chatwoot

**When:** always. Any DG, booking, cancel, WhatsApp, inbox, or “player” task.

**Do:**

1. Read the **Current focus** block in [AGENTS.md](AGENTS.md) and [docs/adr/0005-simplybook-chatwoot-only.md](docs/adr/0005-simplybook-chatwoot-only.md).
2. Calendar of record is SimplyBook. Inbox is Chatwoot. Do not implement or extend the Viborea booker, Academia UI, or `manage_token` as the live path.
3. Player-facing copy: never “Viborea”, never `viborea.com`, never `/reservar`. Book/cancel/reschedule links are the SimplyBook widget (`https://academiadg.simplybook.me/v2/`) or `GET /admin/bookings/{id}/links`. Never the host without `/v2/` (internal panel).
4. WhatsApp for this piloto: only `+595971638427` until the allowlist opens. No automation that messages other contacts on cancel/confirm. Inbound (student wrote in the last 24 h) is AgentBot + Chatwoot humans/canned replies; opening or reopening a chat after 24 h is a WABA **message template**. Load **whatsapp-inbox**.
5. Leave `core/` and `web/` alone unless the user explicitly revives that surface.

**Files:** `AGENTS.md`, `docs/adr/0004-simplybook-holds-sessions.md`, `docs/adr/0005-simplybook-chatwoot-only.md`, `workers/chatwoot-agent-bot/`

**Check:** player copy and WhatsApp bodies contain no `viborea`; `bun --cwd workers/chatwoot-agent-bot test`

---

## simplybook-absence

**When:** a profe está de vacaciones, enfermo, viaja, tiene un torneo, falta; or the user says ausencia, special days, block time, suplente, remapear.

**Do:**

1. Load [docs/fork/simplybook/SKILL.md](docs/fork/simplybook/SKILL.md). That file is the procedure.
2. Facts first (profe, rango, días vs tramo, destino de las fijas). Classify E01–E17 with [SIMPLYBOOK-MIGRACION.md](docs/fork/SIMPLYBOOK-MIGRACION.md) §9; do not copy the catalog.
3. List occupying bookings **before** any SimplyBook write. Propose remaps (same day+hour+sede, then ask). Dual/grupal move as a hueco.
4. Show the plan. Write only after explicit yes: mark special days or block time, then `editBook`/`cancelBooking`. Never `madre_rows`, never weekly schedule, never `--prune`.
5. Player copy: castellano, no “Viborea”, SimplyBook `/v2/` or that booking’s link. Diego sends via inbox. WhatsApp only `+595971638427`.

**Files:** `docs/fork/simplybook/SKILL.md`, `docs/fork/SIMPLYBOOK-MIGRACION.md` §9, `core/scripts/simplybook.ts`

**Check:** plan before write; no Viborea in player copy; madre and weekly hours untouched

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
6. Individual / dual / grupal are offerings with `capacity` 1 / 2 / N. Dual is not a third engine (CONTEXT.md).
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
8. WhatsApp: copy `WHATSAPP_TEST_*` from Infisical env `dev` into the VPS `.env` after any Dokploy Redeploy (it overwrites `.env`). `APP_URL=https://viborea.com`.
8b. There is no signing secret to set: manage links and the guest cookie are random per-row tokens. `PLAYER_COOKIE_SECRET` only verifies links issued before migration 017, so rotating Clerk is safe.
8c. The `backup` service dumps nightly to volume `viborea_backups`. Take a one-shot snapshot before a migration deploy: `docker compose -p viborea run --rm backup /usr/local/bin/pg-backup.sh --once`.
9. Metabase (`academiadg-metabase-nimooc`): network `viborea`, host `viborea-db-1`. Do not print DB passwords or git oauth tokens.
10. Host only exposes 80/443. Postgres stays on `127.0.0.1:5432`. Hex SSH uses port **80** (`sslh`).
11. Public check: `https://viborea.com/api/health` (`{"ok":true}`), SPA hash, `/coaches/coach-pablo-recalde.webp`.

**Files:** `compose.yaml`, `Dockerfile`, `.env.example`

**Check:** containers `viborea-app-1`, `viborea-db-1`; health JSON; Traefik on network `viborea`.

---

## whatsapp-inbox

**When:** WhatsApp, message template, plantilla Meta, ventana 24 h, AgentBot, canned reply, iniciar conversación, recordatorio por WhatsApp, Chatwoot inbox.

**Do:**

1. Read the **WhatsApp: 24h window vs message templates** table in [AGENTS.md](AGENTS.md) and [docs/fork/WHATSAPP.md](docs/fork/WHATSAPP.md). Glossary: **WhatsApp message template** in [CONTEXT.md](CONTEXT.md) — not the schedule `templates` table.
2. The split is the **customer care window**, not “first contact ever”:
   - Student wrote in the last **24 h** → reply in Chatwoot. **AgentBot** (`workers/chatwoot-agent-bot/src/bot.ts`: list + prepared copy). After «Hablar con alguien», a **human** (Diego) uses free text and Chatwoot canned replies / macros. No Meta message template required. Templates *may* still be sent inside the window; they are not the default.
   - We speak first, **or** last student message is older than 24 h (reminders, “¿venís mañana?”, re-engagement) → approved **WhatsApp message template** on the WABA. Chatwoot inbox 4 **sends** (`template_params`); Chatwoot **does not create** them (ADR 0006).
3. Creating a message template (`core/scripts/whatsapp-message-templates.ts`, Infisical `WHATSAPP_TEST_TOKEN` + `WHATSAPP_TEST_WABA_ID`) does not send a WhatsApp. Do not add a `send` subcommand to that CLI.
4. Live DG send is Chatwoot inbox 4, allowlisted to `+595971638427`. Do not use `core/src/whatsapp` send / `manage_token` as the live path (ADR 0005). Do not attach the AgentBot to production until ADR 0007 gates are green. No OpenWA/WAHA/wacli on academy numbers.
5. Canned replies in Chatwoot ≠ Meta message templates. AgentBot copy ≠ message templates.

**Files:** `AGENTS.md` (24h table), `docs/fork/WHATSAPP.md`, `docs/adr/0006-whatsapp-message-templates-on-waba.md`, `core/src/whatsapp/`, `core/scripts/whatsapp-message-templates.ts`, `workers/chatwoot-agent-bot/`

**Check:** never a production webhook URL; never treat Chatwoot as the template author; `bun --cwd core test src/whatsapp` if you touch the Cloud API client.

---

## payments-channels

**When:** cobro, TPago, WhatsApp, Chatwoot, Meta, inbox.

**Do:**

1. Booking ≠ transaction. Channel is booking metadata (`web` | `whatsapp` | `admin`), not a second calendar.
2. Happy path payment is stub / manual mark paid in Academia. `core/src/payments/tpago.ts` stays behind the interface. No live keys in git or chat.
3. Do not connect the academy’s production WhatsApp/Meta number. No OpenWA/WAHA.
4. Chatwoot AgentBot: `workers/chatwoot-agent-bot/` — sandbox or a dedicated WABA only. It does not write the grid and does not paint cells. It sends the SimplyBook widget or that booking’s SimplyBook cancel/reschedule link. «Hablar con alguien» is a human (Diego on DG). Guest book is name + WhatsApp; do not require SimplyBook Client Login. DG sessions live in SimplyBook (ADR 0004). The Viborea booker is paused (ADR 0005): never send `viborea.com` or `/reservar` to a player.
5. Live WhatsApp for this piloto goes through Chatwoot Application API to inbox 4, allowlisted to `+595971638427`. Do not turn on cancel/confirm automation for other contacts. `core/src/whatsapp/` send helpers and `manage-link.ts` (`/reservar/:slug/turno/:token`) are the paused Viborea path — do not use them as the live DG send. Follow **whatsapp-inbox** for the 24h window vs message templates.
6. WhatsApp **message templates** are WABA assets (Graph API or WhatsApp Manager), not Chatwoot canned replies and not `domain/template.ts`. Required to start or reopen a chat when there is no 24 h window. Create with `WHATSAPP_TEST_TOKEN` + `WHATSAPP_TEST_WABA_ID` from Infisical env **`dev`**. Procedure: [docs/fork/WHATSAPP.md](docs/fork/WHATSAPP.md). Creating does not send. Never the KAPSO production WABA.
7. Secrets: Infisical env **`dev`** (`.infisical.json`). WhatsApp keys `WHATSAPP_TEST_TOKEN`, `WHATSAPP_TEST_WABA_ID`, `WHATSAPP_TEST_PHONE_NUMBER_ID`. Never commit tokens.
8. Cutoff and pack rules: `core/src/domain/cutoff.ts`, `pack.ts`. Configurable per academy.

**Files:** `core/src/whatsapp/`, `core/scripts/whatsapp-message-templates.ts`, `core/src/payments/tpago.ts`, `core/src/manage-link.ts`, `docs/fork/WHATSAPP.md`, `docs/fork/TPAGO.md`, `workers/chatwoot-agent-bot/README.md`

**Check:** domain tests; never a production webhook URL in this repo.

---

## ui-shell

**When:** landing, reservar, jugador, academia, catálogo, Clerk, visual design.

**Do:**

1. One shell: `web/src/shell.tsx` (stone, DM Sans). Primitives in `web/src/ui.tsx`. Do not add a second design system or Nuxt UI.
2. Clerk wraps the app only if `VITE_CLERK_PUBLISHABLE_KEY` is set. Do not call `useAuth` without `ClerkProvider` — split gated components (`ClerkGate`).
3. Booker lists real `/api/a/:slug/week` sessions (court + coach + cupos). No `placeholders.ts` occupancy in the SPA.
4. Academia: week + optional coach filter + roster + pagado/pendiente + cancelar clase + nueva clase. Sedes, canchas, profes y tipos de clase en `/academia/catalogo`; franjas de presencia en `/academia/profes`. Staff APIs send Clerk JWT.
4b. Coach availability is edited in `web/src/availability-editor.tsx`, on Cal.com's pattern: one row per weekday, a switch to turn the day off, several `desde–hasta` ranges per day with `+` / `×`, and a copy button that replicates a day onto the days you tick. Viborea adds the dimension Cal.com has no need for: every range names its **sede**. Times are half-hour `<select>`s, not `<input type="time">`, which renders 12-hour in an en-US browser. The whole week saves with one `PUT`; do not go back to a per-row form.
4c. Staff screens take the token from `useStaffToken()`, never `useAuth()` directly, so the Academia UI still works locally without a Clerk key.
4d. Dates and hours come from `local_date` / `local_time`, or `web/src/time.ts` with the payload `time_zone`. Never `new Date(iso).getUTCHours()`: a player in Madrid must read the Asunción hour.
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
- Reviving or extending the Viborea booker / Academia UI / `manage_token` as DG’s live path (ADR 0005)
- Player-facing copy that names Viborea or links `viborea.com` / `/reservar`
- WhatsApp to anyone but `+595971638427` unless the user opens the allowlist
