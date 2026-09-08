# Viborea

**La operación de una academia de pádel, en un solo sistema.**

Grilla (sede + pista/cancha + entrenador + horario). Packs o clase suelta. Cobro adelantado. Excepciones de la semana sobre una planilla madre. Sin doble reserva de pista ni de profe.

Viborea es un fork de [Tandava](https://github.com/TaylorONeal/tandava) (AGPL-3.0). El origen y el copyright de Tandava están en [NOTICE](NOTICE) y [LICENSE](LICENSE). No está afiliado a Cal.com.

No es alquiler de canchas al público. No es “reservá 30 minutos conmigo”.

Agentes: [AGENTS.md](AGENTS.md), [SKILLS.md](SKILLS.md), glosario [CONTEXT.md](CONTEXT.md).

## MVP (Bun + Postgres + React)

Producto: `core/` (Bun.serve, Postgres 18, `/api`) y `web/` (Vite + React, un solo diseño). Un proceso en producción sirve API + SPA.

Áreas: **Jugador** (`/jugador`) y **Academia** (`/academia`). Reserva pública: `/reservar`.

```bash
docker compose up --build
```

En Dokploy el compose publica la app en `:8080` (`https://viborea.com`). Local: `docker compose up -d db`, `bun run dev` (API) y `bun run web` (Vite).

Solo la base, para `bun --hot` en local:

```bash
docker compose up -d db
DATABASE_URL=postgres://viborea:viborea@127.0.0.1:5432/viborea bun run dev
```

`bun run dev` arranca **core** (API). `bun run web` arranca la SPA de producto. `bun run dev:fork` es la SPA Tandava de referencia, no la cara de Viborea.
---

## Fork Tandava (referencia)

```bash
npm install
echo "VITE_DEMO_MODE=true" > .env.local
bun run dev:fork
```

`http://localhost:8080` — SPA de investigación. Grilla en `/manage/schedule`.

---

## WhatsApp / Chatwoot

Menú de WhatsApp (confirmar, reprogramar, pagar, humano) como Cloudflare Worker + Chatwoot CE AgentBot. No usa el webhook de producción ni KAPSO.

```bash
cd workers/chatwoot-agent-bot
bun install
bun test
```

Guía: [workers/chatwoot-agent-bot/README.md](workers/chatwoot-agent-bot/README.md).

Fuera de esta fase: TPago/Pagopar/MP, payroll, WhatsApp de producción.

Documentos: [docs/fork/INVENTARIO-TANDAVA.md](docs/fork/INVENTARIO-TANDAVA.md), [docs/fork/DOMINIO-VIBOREA.md](docs/fork/DOMINIO-VIBOREA.md), [CONTEXT.md](CONTEXT.md).

---

## Licencia

GNU Affero General Public License v3.0. Si Viborea se ofrece como servicio de red, hay que publicar las modificaciones bajo AGPL. Ver [LICENSE](LICENSE) y [NOTICE](NOTICE).
