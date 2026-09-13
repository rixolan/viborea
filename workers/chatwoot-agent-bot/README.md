# Chatwoot AgentBot — Viborea

Source: [`workers/chatwoot-agent-bot`](https://github.com/rixolan/viborea/tree/main/workers/chatwoot-agent-bot) in [rixolan/viborea](https://github.com/rixolan/viborea).

Cloudflare Worker that answers a Chatwoot Community Edition inbox with a WhatsApp list:

1. Soy nuevo
2. Ver horarios
3. Confirmar clase
4. Reprogramar
5. Pagar
6. Hablar con alguien

It is the WhatsApp inbox for a padel academy. It does **not** talk to KAPSO, does **not** steal a production Meta webhook, does **not** paint the grid, and does **not** take payment. It sends the SimplyBook widget (or that booking’s SimplyBook cancel/move link). «Hablar con alguien» is Diego. Player-facing copy never names Viborea and never links `viborea.com` (ADR 0005).

Chatwoot CE includes AgentBot. Cloudflare Workers Free (100k requests/day) is enough for this handler.

## How it fits

```
WhatsApp (sandbox or a dedicated number)
        │
        ▼
Chatwoot CE inbox  ──AgentBot webhook──►  this Worker
        ▲                                      │
        └──────── Application API ◄────────────┘
```

Production WhatsApp that already points at KAPSO must stay on KAPSO. Run this against a Chatwoot inbox that owns its own number (Meta test number, or a second WABA).

## Requirements

- Chatwoot Community Edition (self-hosted is fine)
- An **administrator** Application API token (`api_access_token`)
- Cloudflare account + [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [Bun](https://bun.sh) for tests and the register script (`mise` can install both)

## Quick start

```bash
cd workers/chatwoot-agent-bot
cp .dev.vars.example .dev.vars
# fill CHATWOOT_BASE_URL and CHATWOOT_ACCESS_TOKEN
bun install
bun test
bun run deploy
```

Then put the Worker URL on a Chatwoot AgentBot and attach it to the inbox:

```bash
CHATWOOT_BASE_URL=https://your-chatwoot.example.com \
CHATWOOT_ACCESS_TOKEN=... \
CHATWOOT_INBOX_ID=4 \
OUTGOING_URL=https://viborea-chatwoot-bot.<account>.workers.dev \
bun run register
```

`GET` on the Worker URL returns `viborea chatwoot bot ok`.

## Configuration

| Binding | Kind | Meaning |
| --- | --- | --- |
| `CHATWOOT_BASE_URL` | secret | Chatwoot origin, no trailing slash |
| `CHATWOOT_ACCESS_TOKEN` | secret | Application API token of an administrator |
| `CHATWOOT_ACCOUNT_ID` | var | Account id (usually `1`) |
| `CHATWOOT_INBOX_ID` | var | Inbox the bot is allowed to answer |
| `CHATWOOT_HUMAN_ASSIGNEE_ID` | var | User id for «Hablar con alguien» |
| `CHATWOOT_HANDOFF_NAME` | var | Name used in the handoff sentence |

Never commit `.dev.vars` or tokens. Chatwoot user id `1` and AgentBot id `1` can collide: the handoff **must** send `assignee_type: User` (this Worker already does).

### Academia DG sandbox

The live Worker is `academia-dg-chatwoot-bot` (inbox `4`, WhatsApp `+595994374895`). Deploy that name without creating a second Worker:

```bash
bun run deploy:academia-dg
```

Secrets for that environment already live on the Cloudflare Worker. Operational notes (Doppler, phone numbers) stay in the personal vault, not here.

## Behaviour

| Inbound | Reply |
| --- | --- |
| `hola`, `menu`, `/start`, … | List; points first-timers to «Soy nuevo» |
| `Soy nuevo` / precios | Academy pitch, prices, video; next step is reservar / horarios / humano |
| `Reservar primera clase` / sí after the pitch | SimplyBook widget URL (`academiadg.secure.simplybook.me`) |
| `Ver horarios` / disponibilidad | Same widget URL — no fake slots, no grid |
| `Confirmar clase` / `Reprogramar` | Widget URL, or that booking’s cancel/move link when we have it |
| `Pagar` | Stub payment copy |
| `humano` | Assigns `CHATWOOT_HUMAN_ASSIGNEE_ID` as **User** (Diego on DG), then a handoff line |
| Anything else | List again |

Outgoing, private, and other-inbox events are ignored (`200`) so Chatwoot does not retry.

The bot works best when the conversation is assigned to the AgentBot (`assignee_type: AgentBot`). After a human take-over, put it back on the bot to resume the menu.

## Plans

| Piece | Free plan | Enough? |
| --- | --- | --- |
| Chatwoot CE | AgentBot + Application API included. Custom roles are paid; built-in `administrator` / `agent` are not limited. | Yes |
| Cloudflare Workers Free | 100,000 requests/day, 10 ms CPU (network wait does not count) | Yes. This Worker parses JSON and makes 1–2 Chatwoot `fetch`es. |

## Layout

```
src/bot.ts       # parse Chatwoot payloads, decide menu vs intent
src/bot.test.ts
src/index.ts     # HTTP + Chatwoot Application API
scripts/register.ts
wrangler.jsonc
```

## License

Same as this repository: AGPL-3.0. See [`LICENSE`](../../LICENSE) and [`NOTICE`](../../NOTICE).
