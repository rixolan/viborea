# Inventario de Tandava (punto de fork)

Commit de origen: `8d93c0d` (`main` de [TaylorONeal/tandava](https://github.com/TaylorONeal/tandava)). Remote `upstream` apunta ahí. Licencia AGPL-3.0. Copyright (C) 2024-2026 Tandava Contributors.

Este documento describe **qué hay en Tandava**, no el modelo Bandeja. Ver [DOMINIO-BANDEJA.md](./DOMINIO-BANDEJA.md).

## Qué es

SPA React 18 + Vite + TypeScript. Sin servidor Node de producción. Persistencia y auth en Supabase (PostgreSQL + RLS + Edge Functions). Pagos por Stripe Connect Standard. Demo mode (`VITE_DEMO_MODE=true`) carga mock en el cliente y no llama al backend.

Capa de backend: `src/lib/backend/` (`AuthProvider` + `DataProvider` + `ApiProvider`). El resto de la app no debe importar Supabase directo.

## Entidades (grano oficial)

| Concepto | Schema / tipo | Notas |
|---|---|---|
| Studio | `studios` | Academia. Timezone, currency, cancelación en minutos, fees. |
| Location | `locations` | Sede. `rooms` es JSON `{name, capacity}[]`, no entidad. |
| Staff | `studio_staff` + `profiles` | Profe / admin / recepción. Payroll config en el staff. |
| Offering | `offerings` | Tipo de clase. Capacity, duration, drop-in price. |
| Schedule rule | `schedule_rules` | Plantilla recurrente (día + hora + offering + location + teacher + `room` texto). |
| Session | `class_occurrences` | Instancia. Existe aunque nadie reserve ni pague. `room` texto, no FK. |
| Override | `schedule_overrides` | Sub / cancel / room_change / time_change / one_off sobre una occurrence. |
| Booking | `bookings` | Intent de asistir. Status: confirmed, waitlisted, cancelled, no_show, checked_in, late_cancel. **No hay `pending_payment` ni `channel`.** |
| Check-in | `checked_in_at` en booking + kiosk | Asistencia ≠ pago. |
| Entitlement | `memberships`, `class_packs` | Permiso. Pack se decrementa **al confirmar** el booking (`book_class` RPC), no en el check-in. |
| Transaction | `transactions` | Settlement. Independiente de la sesión. |
| Client | `member_profiles` / `studio_members` | Alumno. |

Separaciones que hay que conservar: Booking ≠ Transaction; Entitlement ≠ Payment; Session existe sola; un solo schedule (canal = metadata, hoy no modelado).

## Hueco para pádel

`class_occurrence` ya es el grano correcto de sesión (offering + sede + profe + intervalo). El `room TEXT` no es un recurso con identidad: no sirve para exclusión de pista. **Court cabe como FK en la misma fila** (`court_id`) sin romper el grano. No hace falta LibreBooking.

No hay exclusión GiST. No hay solape de profe en DB. Capacity es un entero en offering/occurrence; individual/dual/grupal no existen como tipos de motor.

## Pantallas (rutas)

| Área | Prefijo | Qué hay |
|---|---|---|
| Marketing / demo | `/`, `/demo`, `/open-source` | Landing Tandava + picker de roles. En demo, `/` = `Demo.tsx`. |
| Alumno | `/home`, `/schedule`, `/my-schedule`, `/instructors`, `/events`, `/on-demand`, `/community`, `/account` | Browse, book, progreso, comunidad. |
| Admin academia | `/manage/*` | Dashboard, **grilla** (`ScheduleManage.tsx`, mock local), alumnos, profes, offerings, eventos, financials, analytics, campaigns, tasks, import, settings, embed. `ManageSchedule.tsx` es un stub vacío, no está ruteado. |
| Recepción | `/staff/checkin`, `/staff/waitlist` | Check-in y waitlist. |
| Profe | `/teach/*` | Agenda, subs, earnings, availability. |
| Plataforma | `/admin/*` | Multi-studio (scaffolding). |
| Embed | `/embed/*` | Widget de agenda. |
| Kiosk | `/kiosk` | Check-in autónomo. |

La grilla admin (`ScheduleManage`) usa `mockSchedule` hardcodeado (yoga SOMA), **no** el demo Oxatl ni `class_occurrences`.

## Demo vs persistido

| Camino | Cuándo | Datos |
|---|---|---|
| Demo | `VITE_DEMO_MODE=true` o sin Supabase | `src/data/demo/oxatl-yoga.ts` (Oxatl Yoga, Austin, 3 sedes, 18 profes, 500 alumnos, yoga/pilates) + `bookings-transactions.ts` (histórico 2018, `Math.random` al cargar). |
| Live | Supabase configurado | Migraciones `00001`–`00018`. RLS por `studio_id`. |

Demo y live no se mezclan en runtime (`DemoContext`).

## Stripe / yoga / inglés

- Happy path de pago: Stripe Checkout, Connect, Customer Portal, webhooks Edge. Interfaz no extraída como `PaymentProvider`.
- UI default inglés. i18n ya existe (`public/locales/{lng}/{ns}.json`, 19 idiomas incluido `es`). Fallback `en`. No hay `es-AR` / `es-PY` como idiomas; no hay clave `court`.
- Identidad: “Mystical Night”, Oxatl Yoga, Tandava, yoga/pilates/waivers/200h TT, tips, reviews.
- `formatCents` divide siempre por 100. PYG (exponente 0) quedaría mal.

## Deudas relevantes para Bandeja

1. Pista no es entidad. `room` es etiqueta.
2. Booking no tiene `pending_payment` ni `channel`.
3. Solape de profe/pista no se valida (ni JS ni Postgres).
4. Plantilla semanal existe (`schedule_rules`) pero la UI admin no la materializa; el mock no pasa por el motor.
5. Entitlement se consume en la **confirmación** del booking cubierto, no en el check-in. Drop-in iba por Stripe.
6. Payroll, tips, on-demand, campaigns, inbox SMS: código presente; payroll de profes está fuera de v1 Bandeja.
7. Tests unitarios mínimos (`entitlements`, connectors, studio econ). Casi nada de motor de agenda.
8. Exportes: principio de primera clase (`DATA_INTEROPERABILITY.md`, jobs de export en schema). No perderlos.

## Qué no tocar en esta fase

TPago/Pagopar/MP/Stripe live, Chatwoot/Meta/WA, payroll, Bun/Hono/Turso, billing multi-academia, app nativa, fork de Cal.com / LibreBooking / NeetoCal.
