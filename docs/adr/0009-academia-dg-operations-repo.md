# This repo operates Academia DG, not a booking product

Date: 2026-09-13

The live academy already books in SimplyBook.me, talks on WhatsApp through Chatwoot (and Kapso on the production number until ADR 0007), and uses Meta Cloud API for message templates. Building a parallel Viborea booker (`core/` + `web/`) or keeping the Tandava yoga SPA as a “fork reference” splits agent attention and player paths.

**Decision:** this repository is operations for **Academia Diego González**. Work is SimplyBook, Chatwoot, WhatsApp/Meta (WABA, message templates, AgentBot), the madre/padrón replica, and the Kapso cut when its gates are green. Do not extend the Viborea booker, Academia UI, or Tandava `src/` / `supabase/`. Those trees are leftover or gone; they are not the product.

Supersedes ADR 0005’s “leave `core/` and `web/` in the tree and forget them for now”. Does not supersede SimplyBook as calendar of record (0004), message templates on the WABA (0006), or the production WhatsApp cut gates (0007).

Rejected: (a) finishing `/reservar` as DG’s widget; (b) keeping Tandava docs in `docs/prd` as agent reading; (c) `docs/fork/` as the home for live runbooks.
