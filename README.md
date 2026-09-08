# Viborea

**La operación de una academia de pádel, en un solo sistema.**

Grilla (sede + pista/cancha + entrenador + horario). Packs o clase suelta. Cobro adelantado. Excepciones de la semana sobre una planilla madre. Sin doble reserva de pista ni de profe.

Viborea es un fork de [Tandava](https://github.com/TaylorONeal/tandava) (AGPL-3.0). El origen y el copyright de Tandava están en [NOTICE](NOTICE) y [LICENSE](LICENSE). No está afiliado a Cal.com.

No es alquiler de canchas al público. No es “reservá 30 minutos conmigo”.


## MVP (Bun + Postgres)

El producto usable está en `core/`: runtime Bun, Postgres 18, HTML + Tailwind. Sin React. Admin en `/`. Alumnos en `/alumnos`. Enlace público: `/reservar`.

```bash
docker compose up --build
```

Abre `http://localhost:3000`. Postgres no se publica fuera de `127.0.0.1`. En Dokploy: mismo `compose.yaml`, password en `POSTGRES_PASSWORD`.

Solo la base, para `bun --hot` en local:

```bash
docker compose up -d db
DATABASE_URL=postgres://bandeja:bandeja@127.0.0.1:5432/bandeja bun run dev
```

`bun run dev` arranca **core**, no Vite. El árbol raíz sigue siendo el fork de Tandava (referencia de dominio, AGPL). Para esa SPA: `bun run dev:fork` → `http://localhost:8080`.
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
