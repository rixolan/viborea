# Cut production WhatsApp from Kapso to Chatwoot after SimplyBook holds the week

Date: 2026-09-13

Academia DG will drop Kapso. SimplyBook is the calendar (ADR 0004). Chatwoot CE is the inbox (ADR 0005). A permanent Kapso↔Chatwoot API-channel bridge keeps Kapso, which is the opposite of the goal. Chatwoot Embedded Signup on a WABA that already has a solution partner typically fails with Meta error `2655093` or kicks the current partner.

**Decision:** move the live week into SimplyBook first. Rehearse Chatwoot on the test number and Instagram. Archive Kapso (export before any Meta experiment). Then, in Business Manager + Graph, measure three facts: who owns the WABA, whether the academy can `POST /{waba}/subscribed_apps` with its own app while Kapso stays, and whether the WABA is shared with other Kapso customers. If a second app can subscribe **without** Embedded Signup and **without** a phone-level `override_callback_uri`, run a read-only shadow (academy app → Worker → Chatwoot API inbox; humans still reply in Kapso). Cut once to a **native** Chatwoot WhatsApp Cloud inbox. Do not use an API channel as the destination. Do not port the Railway classifier / Firebase libreta.

Production WhatsApp stays untouched until the gates in [docs/corte-kapso-chatwoot.md](../corte-kapso-chatwoot.md) are green. That document is the sequence; this ADR is the why.

Supersedes the unconditional “never touch production WhatsApp” in `AGENTS.md` and `workers/chatwoot-agent-bot/README.md`. Does not open the piloto allowlist (`+595971638427`). Does not supersede ADR 0006: message templates still live on the WABA; Chatwoot does not author them.

Rejected: (a) bidirectional Kapso–Chatwoot bridge as the system; (b) Chatwoot API channel as the production WhatsApp inbox; (c) SimplyBook WhatsApp credits; (d) SimplyBook Client Login; (e) AgentBot on production day one; (f) importing Kapso history into Chatwoot.
