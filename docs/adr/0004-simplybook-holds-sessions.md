# SimplyBook holds DG sessions; Chatwoot is inbox

Date: 2026-09-13

Academia DG already runs its calendar in SimplyBook (`academiadg`). José operates that panel. This repo does not keep a second writable grid for those sessions.

Students book without a WhatsApp agent and without a SimplyBook Client Login. Guest identity is name + WhatsApp. The SimplyBook widget (`academiadg.secure.simplybook.me`) is where they pick sede, profe and hour. Cancel and reschedule of an existing booking go through that booking’s SimplyBook show/cancel/reschedule link, not a vendor portal account.

Chatwoot is inbox. The AgentBot does not classify sessions or paint cells. It sends the widget (new book / availability) or that booking’s cancel/move link. «Hablar con alguien» is Diego. Player-facing copy never names Viborea (ADR 0005).

Rejected: (a) SimplyBook Client Login as the player portal — the mother sheet has no emails, and “olvidé mi contraseña” goes nowhere; (b) WhatsApp as the booker — the bot would own the grid; (c) Postgres `sessions` as a competing calendar of record for DG.

The Viborea public booker (`/reservar/:slug`) as DG’s live self-serve surface is **paused** (ADR 0005). `simplybook-sync` is a replica, not a second cupo. DG is the pilot, not the schema (ADR 0003).

Email stays optional on SimplyBook client fields so guest book (name + WhatsApp) can complete.
