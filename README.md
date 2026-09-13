# Academia DG

Operación de la academia de pádel de Diego González: **SimplyBook.me** (calendario), **Chatwoot** (bandeja), **WhatsApp / Meta** (message templates + AgentBot).

No es un producto de reservas propio. El alumno reserva en `https://academiadg.simplybook.me/v2/`. El copy hacia el alumno nunca dice “Viborea”.

Agentes: [AGENTS.md](AGENTS.md), [SKILLS.md](SKILLS.md), glosario [CONTEXT.md](CONTEXT.md).

## Piezas

| Pieza | Dónde |
|---|---|
| Menú WhatsApp (inbound) | [`workers/chatwoot-agent-bot/`](workers/chatwoot-agent-bot/) |
| Message templates (Meta) | [`core/src/whatsapp/`](core/src/whatsapp/), [`docs/whatsapp.md`](docs/whatsapp.md) |
| SimplyBook (API, ausencia, madre) | [`core/scripts/`](core/scripts/), [`docs/simplybook/`](docs/simplybook/) |
| Secretos | Infisical env `dev` (`.infisical.json`) — `infisical run --env=dev -- bun …` |

Piloto WhatsApp: solo `+595971638427` hasta que se abra la allowlist. El número de producción sigue en Kapso hasta [ADR 0007](docs/adr/0007-cut-production-whatsapp-after-simplybook.md).
