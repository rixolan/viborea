# WhatsApp Cloud API (sandbox)

Fuente: [Message Templates API](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-account/message-template-api). Código: `core/src/whatsapp/`. Inbox: `workers/chatwoot-agent-bot/`. ADR 0006.

Nunca el WhatsApp de producción de la academia (Kapso) hasta ADR 0007. Sin keys en git. **WhatsApp message template** no es una respuesta preparada de Chatwoot.

## Dónde vive cada pieza

```
Meta WABA (fuente de las message templates)
        │  Graph API  (crear / borrar / listar)
        ▼
core/src/whatsapp/     send (phone number id) + message templates (WABA id)
        │
        ├─ notify / reminders   (paused as DG live path, ADR 0005)
        └─ Chatwoot inbox 4     sync + envío con template_params
                 │
                 ▼
        AgentBot (responde inbound; no crea message templates)
```

| Qué | Dónde |
|---|---|
| Cliente Cloud API | `core/src/whatsapp/` |
| CLI message templates | `core/scripts/whatsapp-message-templates.ts` |
| Inbox + menú | `workers/chatwoot-agent-bot/` |
| Planilla madre | `core/src/domain/template.ts` — **otro objeto** |

## Infisical

Project bound by [`.infisical.json`](../.infisical.json) (`workspaceId` `e619372b-978c-481a-a161-1341648dc0ab`). Environment **`dev`**.

```bash
cd /path/to/viborea
infisical run --env=dev -- bun core/scripts/whatsapp-message-templates.ts list
```

| Secret | Uso |
|---|---|
| `WHATSAPP_TEST_TOKEN` | Bearer. System user, scopes `whatsapp_business_management` + `whatsapp_business_messaging`. **Este** es el que crea message templates. |
| `WHATSAPP_TEST_WABA_ID` | WABA de las message templates (`POST /{waba-id}/message_templates`). |
| `WHATSAPP_TEST_PHONE_NUMBER_ID` | Envío (`POST /{phone-number-id}/messages`). |
| `WHATSAPP_TEST_NUMBER` | E.164 del número sandbox, solo referencia. |

`CHATWOOT_*` son el inbox, no Graph. Un user token de 24 h de otra app de Meta **no** es este secreto.

Dokploy Redeploy reescribe `.env` del VPS y no corre Infisical. Si el app necesita enviar, copiar `WHATSAPP_TEST_*` a ese `.env` a mano.

## Sandbox que usa Infisical

Comprobado 2026-09-13 contra Graph `v21.0`:

| | |
|---|---|
| App | ADG Pruebas Chatwoot |
| WABA | Academia DG Pruebas (`WHATSAPP_TEST_WABA_ID`) |
| Número | `+595 994 374895` (verified, quality GREEN) |
| Chatwoot | inbox **4**, provider `whatsapp_cloud` |
| Token type | system user |

Hay una WABA de test de José (`+1 555 677 5521`, app “ADG Test Chatwoot”). No está en Infisical `dev`. No la uses para message templates de este repo.

## Ventana de 24 h vs message templates

El corte no es “nunca nos escribieron”. Es si hay **ventana de atención de 24 h** abierta (último mensaje del student).

| Situación | Qué usar |
|---|---|
| El student escribió en las últimas **24 h** | **AgentBot** (`workers/chatwoot-agent-bot/`: lista + copy en `bot.ts`) y/o **humano en Chatwoot** (texto libre, respuestas preparadas / macros). No hace falta message template. Se *puede* mandar una plantilla dentro de la ventana; no es el default. |
| Nosotros hablamos primero, **o** el último mensaje del student tiene más de 24 h | Message template **APPROVED** en la WABA. Recordatorios de clase y “¿venís mañana?” entran acá aunque el contacto ya exista en Chatwoot. |

Chatwoot **envía** plantillas (`template_params` en inbox 4). Chatwoot **no las crea**. Las respuestas preparadas de Chatwoot **no** son message templates de Meta. El AgentBot **no** abre chats fríos.

Crear (`POST /{waba}/message_templates`) **no manda un WhatsApp**.

## Crear vs enviar

Crear (`POST /{waba}/message_templates`) **no manda un WhatsApp**. Meta deja el status `PENDING` y revisa (minutos a ~24 h). Chatwoot solo sincroniza `APPROVED`.

Iniciar un chat (el student no escribió en 24 h) exige message template `APPROVED` **y** que Meta deje conversaciones iniciadas por el negocio. El 2026-09-13 esa WABA tenía `can_send_message: BLOCKED`:

- **141006** método de pago
- **141010** negocio no verificado

Responder inbound (menú del AgentBot) es otro camino y no usa este CLI.

## Procedimiento

1. Secretos: `infisical run --env=dev -- …` desde la raíz del repo.
2. Listar:

   ```bash
   infisical run --env=dev -- bun core/scripts/whatsapp-message-templates.ts list
   ```

3. Crear (nombre `a-z0-9_`, idioma p.ej. `es`, categoría `UTILITY` \| `MARKETING` \| `AUTHENTICATION`). Si el body tiene `{{n}}`, `--example` con los valores de muestra separados por `|`:

   ```bash
   infisical run --env=dev -- bun core/scripts/whatsapp-message-templates.ts create \
     --name recordatorio_clase \
     --language es \
     --category UTILITY \
     --body "Hola {{1}}, te recordamos tu clase el {{2}} a las {{3}}. Si no podes asistir, responde este chat." \
     --example "Alejandro|lunes 15/09|18:00" \
     --footer "Academia DG Pruebas"
   ```

4. Esperar `APPROVED` (`show NAME`). `REJECTED` trae `rejected_reason`.
5. En Chatwoot, inbox 4: sync de message templates (o esperar el sync del canal). No se crean ahí.
6. Envío: Chatwoot `template_params` o `sendMessageTemplate` en `core/src/whatsapp/send.ts`. No hay subcomando `send` en el CLI a propósito.

Borrar (`delete NAME`) borra todos los idiomas de ese nombre. Meta reserva el nombre 30 días.

También se pueden crear en WhatsApp Manager si José te asigna la WABA con **Message templates (view and manage)**. La API con el token de Infisical ya alcanza; no hace falta ese rol para el CLI.

## Prueba 2026-09-13

`POST` con `WHATSAPP_TEST_TOKEN` + `WHATSAPP_TEST_WABA_ID` → HTTP 200, id `1068884192621480`, name `viborea_prueba_api_20260913`, category `UTILITY`, language `es`, status `PENDING`. No se envió a ningún número. Se puede borrar con `delete viborea_prueba_api_20260913` cuando no haga falta.

## Categorías

| Categoría | Para |
|---|---|
| `UTILITY` | Recordatorio / confirmación de una clase que ya existe |
| `MARKETING` | Primer contacto o reenganche; pide opt-in y se cobra como marketing |
| `AUTHENTICATION` | OTP; no es el piloto |

`hello_world` (`en_US`) es el sample de Meta, no copy de la academia. El notify pausado cae a ese sample si el texto libre está fuera de ventana.
