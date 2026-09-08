# 0001. Postgres 18 as the write store

Date: 2026-09-08

## Context

The Bun MVP first used SQLite. That file store is gone. Dokploy runs the academy stack; bookings and student category/side live in Postgres 18.

## Decision

One Compose file: Bun app + Postgres 18. Postgres is the only database. No ORM. Schema in SQL, applied on boot. `postgres.js` from the app.

## Consequences

Local `bun test` for domain stays in-process. Persistence tests need `DATABASE_URL`. Dokploy must not publish Postgres to the internet; the app reaches it on the compose network.
