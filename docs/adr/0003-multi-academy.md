# 0003. N academias en un Postgres; aislamiento por `academy_id`

Date: 2026-09-09

ADR 0002 sigue para Clerk Organizations en `viborea.com` (sin subdominio). Pisa su consecuencia “Postgres stays single-academy”.

Viborea sirve a más de una academia. Cada una es límite de aislamiento de grilla, packs y fichas, no de facturación. Un proceso, un Postgres. Clerk no aísla datos: `orgId` del JWT se resuelve a `academy_id` y **cada** query staff lleva ese id. No hay RLS.

Slug canónico: `academy.slug` en Postgres. El slug de la Organization Clerk es copia al crear; si divergen, gana Postgres. Inmutable después de crear.

Booker público: `/reservar/:slug`. Cookie de jugador keyed por academia (`vb_p_<slug>`), nunca una cookie “jugador Viborea”. Uniques: `(academy_id, phone)` y `(academy_id, clerk_user_id)` parcial. Nada unique global sobre persona.

Guest (nombre + teléfono) hasta que la ficha tenga `clerk_user_id`. Entonces el booker público rechaza con error claro; el staff sigue reservando por `student_id`. WhatsApp es notify de reserva (sandbox/dry-run), no OTP.

`/reservar` sin slug: 301 al booker si hay **una** academia; con N>1, a `/`. El booker no tiene rol profe.

Considered: un Postgres por academia (ops peor al tercer cliente); slug eterno a DG (marketplace por la puerta de atrás).
