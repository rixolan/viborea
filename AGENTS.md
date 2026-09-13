# AGENTS.md

Operating manual for coding agents on **Academia DG**.

If this file and other docs disagree, this file and [CONTEXT.md](CONTEXT.md) win.

## What this is

This repository runs **Academia Diego González** (Asunción): calendar, inbox, and WhatsApp. It is not a multi-academy product, not a self-serve booker, and not a Tandava yoga app.

| Piece | Role |
|---|---|
| **SimplyBook.me** (`academiadg`) | Calendar of record. Book, cancel, reschedule, fijas, dual, grupal. Widget: `https://academiadg.simplybook.me/v2/` |
| **Chatwoot CE** | Inbox (WhatsApp + Instagram). Humans (Diego). Canned replies inside the 24 h window. |
| **Meta Cloud API** | WABA, **message templates** (start / reopen a chat). Sandbox in Infisical `dev`. |
| **AgentBot** | `workers/chatwoot-agent-bot/` — inbound menu only. Does not open cold chats. |
| **Madre / padrón** | Roster CSV and replica (`core/scripts/`, `simplybook.*` SQL). Not the calendar. |
| **Kapso** | Production WhatsApp today. Do not cut it (ADR 0007) until those gates are green. |

Player-facing copy never says “Viborea” and never links `viborea.com` or `/reservar`. José operates the SimplyBook panel. Diego operates the inbox.

Do **not** extend `core/src/api.ts`, `web/`, or any `/reservar` / Academia SPA. That booker is leftover (ADR 0009). Do not restore Tandava `src/` or `supabase/`.

## WhatsApp: 24h window vs message templates

The split is the **customer care window**, not “have they ever written”. Procedure: [docs/whatsapp.md](docs/whatsapp.md). ADR 0006.

| Situation | What to use |
|---|---|
| Student wrote in the last **24 h** | **AgentBot** (`workers/chatwoot-agent-bot/`: list + copy in `bot.ts`) and/or a **human in Chatwoot** (free text, canned replies / macros). No Meta message template required. |
| We speak first, **or** last student message is older than 24 h | Approved **WhatsApp message template** on the WABA. Chatwoot inbox 4 can **send** it; Chatwoot **cannot create** it. Canned replies are not message templates. |

Creating a message template ≠ sending. Class reminders after silence are templates even if the student is already a Chatwoot contact. Live piloto send is Chatwoot inbox 4, allowlisted to `+595971638427`. Do not use `core/src/whatsapp` send as the live path.

## Read first

1. This file.
2. [CONTEXT.md](CONTEXT.md) — glossary. Identifiers in English. Do not invent synonyms.
3. [SKILLS.md](SKILLS.md) — load the matching skill before editing. Profe ausente: [docs/simplybook/SKILL.md](docs/simplybook/SKILL.md).
4. [docs/adr/0004-simplybook-holds-sessions.md](docs/adr/0004-simplybook-holds-sessions.md), [0006](docs/adr/0006-whatsapp-message-templates-on-waba.md), [0007](docs/adr/0007-cut-production-whatsapp-after-simplybook.md), [0009](docs/adr/0009-academia-dg-operations-repo.md).

## Language

| UI (castellano) | Code | Do not use |
|---|---|---|
| Academia | Academia DG | Viborea (towards the student), tenant |
| Jugador / alumno | `student` | Cliente, client, user, member |
| Profe | provider / coach | Product area `/profe` |
| Sede | location | Club, venue |
| Clase fija | series | Recurrence as product |
| Widget | SimplyBook `/v2/` | `/reservar`, viborea.com |
| Message template | WABA message template | Chatwoot canned reply, planilla `templates` |

Copy to students: castellano.

## Tree

```
workers/chatwoot-agent-bot/   inbound WhatsApp menu (Cloudflare Worker)
core/src/whatsapp/            Meta Graph client (message templates + sandbox send)
core/scripts/                 SimplyBook, madre, padrón, WhatsApp CLI
core/src/db/simplybook.sql    replica for BI — not calendar of record
docs/whatsapp.md              Cloud API + 24h + Infisical
docs/simplybook/              ausencia skill + migración madre
docs/adr/                     decisions
```

Secrets: Infisical env **`dev`** (`.infisical.json`). Never commit tokens. `infisical run --env=dev -- bun …`

## Constraints (do not)

- A second writable grid. SimplyBook holds sessions.
- SimplyBook Client Login as the player portal.
- AgentBot classifying sessions or painting cells.
- Player copy that names Viborea or links `viborea.com` / `/reservar`.
- Extending the leftover booker (`web/`, `core/src/api.ts`, `manage_token` as live manage link).
- Restoring Tandava (`src/`, `supabase/`, yoga PRDs).
- Production Meta/WhatsApp cut until ADR 0007 gates are green. No OpenWA/WAHA/wacli on academy numbers.
- WhatsApp to anyone but `+595971638427` unless the user opens the allowlist.
- Commit `.env`, Infisical values, Chatwoot tokens.

## How to change things

| Job | Where |
|---|---|
| Inbound menu | `workers/chatwoot-agent-bot/` |
| Message templates | `core/src/whatsapp/`, `core/scripts/whatsapp-message-templates.ts`, [docs/whatsapp.md](docs/whatsapp.md) |
| SimplyBook API / ausencia | `core/scripts/simplybook.ts`, [docs/simplybook/SKILL.md](docs/simplybook/SKILL.md) |
| Madre / padrón / replica | `core/scripts/madre-*.ts`, `simplybook-sync.ts`, `core/src/db/simplybook.sql` |
| Kapso → Chatwoot cut | ADR 0007, [docs/corte-kapso-chatwoot.md](docs/corte-kapso-chatwoot.md) — do not execute |
