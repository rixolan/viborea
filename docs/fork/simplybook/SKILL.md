---
name: simplybook-absence
description: >
  Opera una ausencia de profe en Academia DG (vacaciones, enfermedad, torneo,
  viaje, feriado): marca special days o block time en SimplyBook, lista las
  reservas ya clavadas que chocan, y propone remapear cada alumno a otro
  provider según huecos reales. Use when a profe está de vacaciones, enfermo,
  viaja, tiene un torneo, falta, or the user says ausencia, special days,
  block time, suplente, remapear, or /simplybook-absence.
---

# SimplyBook absence

Procedimiento para un agente que habla con administración (José panel, Diego inbox) cuando un entrenador no va a estar. Calendario de record: SimplyBook cuenta `academiadg`. No el booker Viborea.

Catálogo de escenarios, UI y API: [SIMPLYBOOK-MIGRACION.md](../SIMPLYBOOK-MIGRACION.md) §9. Providers y sedes: §1.2. No copies esas tablas acá.

## Load

1. [AGENTS.md](../../../AGENTS.md) **Current focus** (ADR 0005). Copy al alumno: nunca “Viborea”, nunca `viborea.com` ni `/reservar`. WhatsApp solo `+595971638427`.
2. [CONTEXT.md](../../../CONTEXT.md): `Absence`, `Exception`, `Series`. Ausencia no pisa la schedule rule.
3. Esta skill. Después §9 del doc de migración, no al revés.

## Invariants

- Cerrar horario **no** cancela reservas. Dos gestos: (1) special day o block time, (2) cancelar o `editBook` cada fija.
- No editar `madre_rows` ni el horario **semanal**. No `simplybook-reconcile --prune`. Eso es cambio de regla (E08), no un viaje.
- No company special day para un solo profe. No block time `everyone` para un particular.
- SimplyBook no tiene horario por sede. Un provider ausente en Elite y no en Lomas es E06/E17: filtrar por `location_id`.
- Writes a SimplyBook solo con confirmación explícita. Primero el plan. Secrets: `infisical run --env=dev --`.
- José opera el panel. Diego avisa por inbox. El agente no manda WhatsApp de cancelación salvo el número del piloto.

## Loop

Hablar en castellano. Un dato que falte = una pregunta, no un supuesto. No ejecutes el paso 5 hasta que el humano elija por reserva (o “el mismo criterio para todas”).

### 1. Hechos

Necesitás, en este orden:

| Dato | Preguntar si falta |
|---|---|
| Profe | Nombre o código (`FL` `JM` `MP` `PR` `VA` `RS` `TE` `RA` `ChG` `MF` `OB`). Mapear a `provider_id` con §1.2. |
| Rango | Fechas locales Asunción. ¿Días enteros o tramos (`10:00–12:00`)? |
| Motivo | Vacaciones, enfermo, torneo, viaje, feriado. Solo para la nota y el tono del aviso. |
| Destino de las fijas | ¿Suplente, cancelar y reponer, cancelar, o decidir alumno por alumno? |
| Sede / hora | ¿El alumno puede cambiar de sede? ¿De hora? Default: mismo día+hora+sede. |

Clasificá E01–E17 con §9.4. Confirmá el código con el humano en una frase: “E01, Pablo Recalde lun 21–sáb 26, special days + remapear. ¿Sí?”

Si es E08 (ya no da ese hueco nunca más) **pará**: no es esta skill; es madre + prune.

### 2. Conflictos (antes de marcar)

Listá las reservas **ocupantes** de ese provider en el rango. No las canceladas.

```bash
infisical run --env=dev -- bun -e '
import { simplybookAuth, sbAdminRpc } from "./core/scripts/simplybook.ts";
const auth = await simplybookAuth();
const providerId = Number(process.env.SB_PROVIDER);
const rows = await sbAdminRpc(auth, "getBookings", [{
  date_from: process.env.SB_FROM,
  date_to: process.env.SB_TO,
  unit_group_id: String(providerId),
  booking_type: "non_cancelled",
}]);
console.log(JSON.stringify(rows, null, 2));
'
```

`SB_PROVIDER`, `SB_FROM=YYYY-MM-DD`, `SB_TO=YYYY-MM-DD`. Si `getBookings` no filtra bien, `sbPages("/admin/bookings")` y filtrar en memoria (`provider_id`, `start_datetime`, status). Anotá el método que funcionó en §7 del doc de migración.

Agrupá por hueco (`start_datetime` + `service_id` + `location_id`):

- **individual** — una reserva, un alumno.
- **dual** — las dos reservas del hueco se mueven juntas.
- **grupal** — todo el hueco a un solo suplente, o se cancela entero. No desarmes el grupo alumno por alumno salvo que el humano lo pida.

Mostrá a administración una tabla, no un dump:

```
Hueco | Sede | Tipo | Alumnos | Qué choca
lun 21 07:00 | Lomas | individual | Ana Pérez | sin suplente a esa hora
lun 21 18:00 | Elite | grupal ×3 | … | RS tiene cupo; PR no
```

Si no hay reservas: decilo y saltá al paso 5 (solo marcar). El widget igual hay que cerrarlo para que no entren sueltos.

### 3. Remapeo

Por cada hueco, candidatos = otros providers **activos** que:

1. Están en esa `location` (lista `providers` de `GET /admin/locations`), salvo que el humano haya permitido cambiar sede.
2. Ese día no es day-off (`getWorkCalendar(year, month, candidateId)`).
3. `GET /admin/schedule/available-slots?service_id=&provider_id=&date=&count=` incluye esa hora. `count` = reservas del hueco (1 / 2 / N). Hoy los providers siguen en `qty: 1` hasta T1.1: si `count>1` falla, reintentar `count=1` y contar a mano cuántas reservas ya tiene el candidato a esa hora.
4. Ningún alumno del hueco tiene **otra** reserva solapada a esa hora (mismo `client_id`, otro `provider_id`). Eso es la “disponibilidad del alumno” que tenemos: no hay calendario de ocio, hay el resto de sus fijas.

Orden de propuesta (el primero que cumpla, y dos alternativas):

1. Mismo día + hora + sede, otro profe (el alumno no cambia nada).
2. Mismo día + hora, otra sede — solo si el humano dijo que sí.
3. Mismo día, hora vecina (±1 h) misma sede, si el alumno no tiene otra fija ahí.
4. Sin candidato: **cancelar esa ocurrencia** y reponer otro día, o dejar el hueco vacío. No inventes un hueco.

No elijas el suplente. Recomendá uno y esperá. Criterio para la recomendación: mismo sede+hora; si hay empate, el que ya da ese servicio a esa hora (nivel parecido si `clients.nivel` está poblado).

### 4. Plan (una pantalla)

```
Ausencia: {profe} {rango} ({E0x})
Marcar: special days | block time {tramo} | company special days
Fijas: N reservas en M huecos
  {tabla del paso 2, con suplente propuesto o “cancelar”}
Aviso: Diego por inbox. Copy abajo. Sin WhatsApp masivo.
Madre: no se toca.
```

Copy al alumno, castellano, un hueco por mensaje:

> {Nombre}, {profe} no da la clase del {día} {hora} ({sede}). Opción: {suplente} el mismo día y hora, o cancelamos esa clase. Respondé acá. Gestionar: {enlace SimplyBook de esa reserva, host `/v2/`}.

Nunca `viborea.com`. Enlace de esa reserva (`GET /admin/bookings/{id}/links`), no el panel sin `/v2/`.

### 5. Ejecutar (solo con “sí”)

Orden fijo:

1. **Marcar** el horario, para que no entren sueltos mientras movés. Recetas UI/API: §9.2 y §9.3.
   - Días enteros de un profe → special days (`setWorkDayInfo` con `date` + `is_day_off: 1`, o Group Date Selection).
   - Un tramo → `POST /admin/calendar-notes` `time_blocked: true`, `mode: "provider"`.
   - Academia cerrada → company special days, no el provider.
2. **Mover o cancelar** cada reserva del plan (`editBook` / `POST` admin bookings del suplente + `cancelBooking` del titular; o `editBook` cambiando `unitId` si el hueco del suplente lo admite).
3. **Comprobar** `available-slots` del titular en esas fechas = vacío (o sin ese tramo). Las reservas movidas aparecen en el suplente.
4. Entregar el copy a Diego. No lo envíes vos.

Si el humano prefiere el panel y no la API, dale los clics de §9.2 y la tabla; no escribas vos.

Revertir un special day: `deleteSpecialDay` o “clear special day”. No reactivar tocando el semanal.

## Check

- El plan salió **antes** de cualquier write.
- Cada hueco tiene suplente concreto, cancelación, o “sin candidato”.
- Dual/grupal no se partió salvo pedido explícito.
- `madre_rows` y el horario semanal intactos.
- Copy al alumno sin “Viborea” y con enlace `/v2/` o de esa reserva.
- WhatsApp a nadie salvo el piloto allowlisted.
