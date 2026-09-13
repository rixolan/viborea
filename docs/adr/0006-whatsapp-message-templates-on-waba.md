# WhatsApp message templates live on the WABA, not in Chatwoot

Date: 2026-09-13

Chatwoot CE can send Cloud API message templates and sync their status; it cannot create them. Treating the inbox or the AgentBot as the template store would hide Meta’s review and mix this up with the schedule `templates` table.

**Decision:** author message templates against the sandbox WABA via Graph API (`core/src/whatsapp/`, `core/scripts/whatsapp-message-templates.ts`) or WhatsApp Manager. Chatwoot inbox 4 only syncs `APPROVED` copies and may send them. Never the academy production number (KAPSO). Creating a message template is not sending a message.

Rejected: (a) Chatwoot as the authoring UI; (b) unofficial clients (wacli / WAHA / OpenWA); (c) putting this next to `domain/template.ts`.
