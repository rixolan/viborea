# SKILLS.md

Repo-specific skills for Academia DG. Load **AGENTS.md** + **CONTEXT.md** always. Load the matching skill below before editing.

How to use: if the user task matches **When**, follow **Do** in order. Do not skip tests named in **Check**.

---

## academia-dg

**When:** always. Any booking, cancel, WhatsApp, inbox, SimplyBook, madre, or “player” task.

**Do:**

1. Read [AGENTS.md](AGENTS.md) and [docs/adr/0009-academia-dg-operations-repo.md](docs/adr/0009-academia-dg-operations-repo.md). Calendar is SimplyBook. Inbox is Chatwoot. Message templates live on the Meta WABA.
2. Do not implement or extend the leftover Viborea booker, Academia UI, or `manage_token` as the live path. Do not restore Tandava `src/` / `supabase/`.
3. Player-facing copy: never “Viborea”, never `viborea.com`, never `/reservar`. Links are `https://academiadg.simplybook.me/v2/` or `GET /admin/bookings/{id}/links`. Never the host without `/v2/` (internal panel).
4. WhatsApp piloto: only `+595971638427` until the allowlist opens. Inbound (≤24 h) is AgentBot + Chatwoot humans/canned replies. Opening or reopening after 24 h is a WABA **message template**. Load **whatsapp-inbox**.
5. José = SimplyBook panel. Diego = inbox.

**Files:** `AGENTS.md`, `CONTEXT.md`, `docs/adr/0004-simplybook-holds-sessions.md`, `docs/adr/0009-academia-dg-operations-repo.md`, `workers/chatwoot-agent-bot/`

**Check:** player copy and WhatsApp bodies contain no `viborea`; `bun --cwd workers/chatwoot-agent-bot test` if you touch the bot

---

## simplybook-absence

**When:** a profe está de vacaciones, enfermo, viaja, tiene un torneo, falta; or the user says ausencia, special days, block time, suplente, remapear.

**Do:**

1. Load [docs/simplybook/SKILL.md](docs/simplybook/SKILL.md). That file is the procedure.
2. Facts first (profe, rango, días vs tramo, destino de las fijas). Classify E01–E17 with [docs/simplybook/MIGRACION.md](docs/simplybook/MIGRACION.md) §9; do not copy the catalog.
3. List occupying bookings **before** any SimplyBook write. Propose remaps (same day+hour+sede, then ask). Dual/grupal move as a hueco.
4. Show the plan. Write only after explicit yes: mark special days or block time, then `editBook`/`cancelBooking`. Never `madre_rows`, never weekly schedule, never `--prune`.
5. Player copy: castellano, no “Viborea”, SimplyBook `/v2/` or that booking’s link. Diego sends via inbox. WhatsApp only `+595971638427`.

**Files:** `docs/simplybook/SKILL.md`, `docs/simplybook/MIGRACION.md` §9, `core/scripts/simplybook.ts`

**Check:** plan before write; no Viborea in player copy; madre and weekly hours untouched

---

## domain-language

**When:** naming entities, copy, or the user says cliente/admin/profe/bandeja/Viborea/cancha/pista.

**Do:**

1. Read [CONTEXT.md](CONTEXT.md). Identifiers stay English (`student`, `booking`, `location`, `coach`).
2. Person who books = student / “jugador” or “alumno” in copy. Never “cliente”.
3. Product-facing name towards students is **Academia DG** (or the academy’s public name). Never “Viborea”.
4. If the user contradicts the glossary, stop and ask which term wins, then update CONTEXT.md (glossary only — no implementation).

**Files:** `CONTEXT.md`

**Check:** no player-facing “Viborea”, “cliente”, or `/reservar`

---

## whatsapp-inbox

**When:** WhatsApp, message template, plantilla Meta, ventana 24 h, AgentBot, canned reply, iniciar conversación, recordatorio por WhatsApp, Chatwoot inbox.

**Do:**

1. Read the **WhatsApp: 24h window vs message templates** table in [AGENTS.md](AGENTS.md) and [docs/whatsapp.md](docs/whatsapp.md). Glossary: **WhatsApp message template** in [CONTEXT.md](CONTEXT.md).
2. The split is the **customer care window**, not “first contact ever”:
   - Student wrote in the last **24 h** → reply in Chatwoot. **AgentBot** (`workers/chatwoot-agent-bot/src/bot.ts`). After «Hablar con alguien», a **human** (Diego) uses free text and Chatwoot canned replies / macros. No Meta message template required.
   - We speak first, **or** last student message is older than 24 h (reminders, re-engagement) → approved **WhatsApp message template** on the WABA. Chatwoot inbox 4 **sends**; Chatwoot **does not create** them (ADR 0006).
3. Creating a message template (`core/scripts/whatsapp-message-templates.ts`, Infisical `WHATSAPP_TEST_TOKEN` + `WHATSAPP_TEST_WABA_ID`) does not send a WhatsApp.
4. Live send is Chatwoot inbox 4, allowlisted to `+595971638427`. Do not attach the AgentBot to production until ADR 0007 gates are green. No OpenWA/WAHA/wacli on academy numbers.
5. Canned replies in Chatwoot ≠ Meta message templates. AgentBot copy ≠ message templates.

**Files:** `AGENTS.md`, `docs/whatsapp.md`, `docs/adr/0006-whatsapp-message-templates-on-waba.md`, `core/src/whatsapp/`, `core/scripts/whatsapp-message-templates.ts`, `workers/chatwoot-agent-bot/`

**Check:** never a production webhook URL; never treat Chatwoot as the template author; `bun --cwd core test src/whatsapp` if you touch the Cloud API client

---

## cobro

**When:** cobro, TPago, pago, pack, uPay.

**Do:**

1. Booking ≠ cobro. The calendar is SimplyBook; money is separate.
2. No live TPago/Pagopar/Mercado Pago keys in git or chat. [docs/tpago.md](docs/tpago.md) is protocol notes, not a happy path to wire.
3. Do not charge via the leftover Viborea booker.

**Files:** `docs/tpago.md`

**Check:** no production payment keys in the diff

---

## out-of-scope

Never implement in a default session:

- A Viborea booker, Academia SPA, or `manage_token` as DG’s live path
- Restoring Tandava `src/` / `supabase/` / yoga PRDs
- SimplyBook Client Login as the player portal
- Payroll / coach pooling
- Public court rental marketplace
- WhatsApp to anyone but `+595971638427` unless the user opens the allowlist
- Executing the Kapso → Chatwoot cut (ADR 0007) before its gates are green
- Player-facing copy that names Viborea or links `viborea.com` / `/reservar`
