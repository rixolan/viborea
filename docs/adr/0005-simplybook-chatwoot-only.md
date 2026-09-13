# Pause the Viborea product surface; DG runs on SimplyBook + Chatwoot

Date: 2026-09-13

Academia DG’s calendar already lives in SimplyBook (ADR 0004). Building a parallel self-serve booker at `/reservar/:slug` (and mentioning Viborea in WhatsApp) splits the player’s path and is not what we are shipping now.

**Decision:** forget the Viborea implementation for now. Live work is SimplyBook.me (book, cancel, reschedule, that booking’s manage links) and Chatwoot (WhatsApp inbox + AgentBot). Player-facing copy never says “Viborea” and never links `viborea.com` or `/reservar`. `core/` and `web/` stay in the repo; do not delete them and do not extend them as the live path.

Piloto WhatsApp stays allowlisted to `+595971638427` until we open it. Cancel/confirm messages are not an automation on other contacts.

Supersedes the “Viborea is the self-serve booker” sentence in ADR 0004. Does not supersede SimplyBook as calendar of record.
