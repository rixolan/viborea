# Migración Academia DG → SimplyBook.me: sesiones fijas y alumnos

Plan de implementación para un agente. Lee antes [AGENTS.md](../../AGENTS.md), [CONTEXT.md](../../CONTEXT.md) y los scripts en `core/scripts/simplybook*.ts`. Este documento manda sobre cualquier suposición sobre SimplyBook: lo que dice "verificado" fue observado en la cuenta `academiadg` el 2026-09-13; lo que dice "verificar" no se pudo confirmar ni en la doc oficial ni en la API y hay que probarlo antes de depender de ello. Revisión 5 (2026-09-13): Dual es pareja (ADR 0008, decisión 13); catálogo de ausencias (§2.12, §9); tope de cancelaciones/cambios no es automatizable (§2.11).

## 0. Objetivo y alcance

Dejar registradas en SimplyBook las clases fijas de cada alumno (la "planilla madre") y a los alumnos mismos, de forma que:

- administración deja de editar la planilla: las **excepciones** (una clase) y las **ausencias** (profe enfermo, viaja, feriado) se hacen en el calendario de SimplyBook (§9) y los **cambios de regla** (a partir de esta semana) en la madre que vive en Postgres;
- la carga es idempotente, respeta lo cancelado y se repite semanalmente (ventana rodante);
- el alumno ve sus clases en su cuenta **solo cuando tenga correo** (decisión 10); hasta entonces recibe lo que la academia le mande.

Fuera de alcance: cobro y precios por alumno, Classes y Recurring de SimplyBook, WhatsApp productivo de la academia (prohibido en AGENTS.md), nivelación por membresías (fase 3, fuera del camino crítico), **contador de cancelaciones/cambios del alumno** (SimplyBook no lo tiene; §2.11).

## 1. Fuentes

| Fuente | Qué es | Dónde |
|---|---|---|
| `HORARIO-MADRE-ACADEMIA-DG.csv` | Planilla madre: 785 filas, una por alumno en un hueco (día + hora + sede + profe). Fuente de la carga inicial. | Fuera del repo. Se pasa por `argv`, como hace `padron-load.ts`. **No se commitea** (datos personales). |
| `HORARIO-EDITABLE-ACADEMIA-DG.csv` | Misma planilla con `Estado` = `para revisar (celeste)` en 323 filas y una fila movida. No es un horario distinto: es la lista de confirmación pendiente. | Ídem. |
| Cuenta SimplyBook `academiadg` | Catálogo ya cargado por `simplybook-seed-providers.ts`. | Secrets en Infisical env `dev`: `SIMPLYBOOK_COMPANY`, `SIMPLYBOOKME_API_KEY`, `SIMPLYBOOK_USER_LOGIN`. Correr scripts con `infisical run --env=dev -- bun core/scripts/<x>.ts`. |
| `core/scripts/simplybook.ts` | Cliente REST v2 (`user-api-v2.simplybook.me`, headers `X-Company-Login` + `X-Token`) y JSON-RPC admin (`sbAdminRpc`, header `X-User-Token`). | Repo. |
| `core/scripts/simplybook-sync.ts` | Réplica de SimplyBook a Postgres esquema `simplybook` (`core/src/db/simplybook.sql`). Ya lee el campo de cliente "Nivel". | Repo. |
| `core/scripts/padron-load.ts` | Parser CSV, `fold`, `nameBase`, `priceGs`, `categoryOf`, `sbNivel`, `e164` con `core/src/domain/phone.ts`. Reutilizar, no duplicar. | Repo. |
| `Dockerfile` | La imagen copia `core/` a `/app`, así que en producción los scripts están en `/app/scripts/`. | Repo. |

### 1.1 Columnas de la madre

`Dia, Hora, Sede, Profe, Profe (nombre), Alumno, Modalidad, Categoria, Lado, Duracion (min), Nota, Estado, Lugar, ID, Telefono, Telefono normalizado, Nombre p/ WhatsApp, Precio de clase, Tipo de clase, Categoria (ficha), Nivel (calendario), Clave`

- `Dia`: Lunes…Sabado (sin tilde). `Hora`: `6:00`…`17:00` (117 filas a las 17:00; ninguna a las 18:00 en la madre, una en el editable), clases de 60 min.
- `Sede`: Lomas, Elite, `Segurola Y Habana`, `A Definir` (15 filas: no es sede, es pendiente).
- `Profe`: código FL, JM, MP, PR, VA, RS, TE, RA, ChG, MF, OB, SP (SP = "Sin profe", 67 filas).
- `Modalidad`: Grupal, Dual, Individual, Bloque, o vacío (116). `Tipo de clase`: G, D, IND o vacío. **Regla:** `Modalidad` manda; si está vacía se infiere de `Tipo` (56 filas); si ambas están vacías (60 filas) la fila es pendiente.
- `Modalidad = Bloque` (77 filas): `ALTO RENDIMIENTO` (76) y `ALMUERZO` (1). No son reservas: son tramos no reservables del profe.
- `Categoria`: 1…8, `6.5`, `P` (principiante) o vacío. Es la categoría del alumno, consistente entre sus filas. 132 alumnos no la tienen en ninguna fila.
- `Lugar`: posición 1…4 dentro del hueco. No es pista. Se ignora.
- `ID`: `A0325` etc. 398 IDs distintos, 1 fila sin ID ("Pedro Aguero", que es la misma persona que `A0538` "Pedro Aguero GRUPAL").
- `Telefono normalizado`: dígitos con 595 delante. 58 filas sin teléfono. **35 teléfonos están compartidos por IDs distintos**: 4 son la misma persona con ficha partida (`Alex Ebner` A0028/A0564, `John Swanston` A0302/A0675, `Irmina Quintana` A0268/A0750, `Pablo Mercado` A0704/A0506) y 31 son familias (hijos con el teléfono de un padre, parejas). El teléfono **no** identifica a la persona.
- `Alumno` puede llevar sufijo `GRUPAL`, `INDIVIDUAL`, `NOCHE`, `PRUEBA`; `nameBase()` lo quita.
- `Precio de clase`: por alumno, no por servicio. No se migra.
- `Clave`: `DIA|sede|colProfe|filaHora|lugar`. Solo trazabilidad en logs.

Hueco = (`Dia`, `Hora`, `Sede`, `Profe`). 404 huecos con alumnos: 196 de 1, 140 de 2, 43 de 3, 23 de 4, 2 de 5-6 (ambos "Sin profe").

**Profe en dos sedes a la misma hora.** SimplyBook tiene un solo horario y un solo cupo por provider, sin sede. La madre pone a RS en Elite y Lomas a la misma hora en 9 combinaciones día+hora, y a PR el sábado 11:00. En 5 de ellas el total supera 4 alumnos: martes 17:00 RS (4+4), sábado 11:00 PR (4+3), martes 16:00, jueves 16:00 y jueves 17:00 RS (5). Con `qty: 4` la mitad de esas reservas falla; con `qty: 8` entran pero el cupo se mezcla entre sedes. Modelo fiel: dos providers ("Rodolfo Silva · Elite" / "Rodolfo Silva · Lomas"). Es decisión de la academia (§6), y T0 debe detectarlo y no cargar esos huecos hasta que exista regla.

### 1.2 Estado verificado de SimplyBook (2026-09-13)

Providers (`GET /admin/providers`), todos `qty: 1`, servicios `[2,3,6]`:

| id | Nombre en SimplyBook | Código madre | Nombre madre |
|---|---|---|---|
| 7 | Fernando Laval | FL | Fernando Laval |
| 3 | Jose Mongelos | JM | Jose Mongelos |
| 13 | Matias Popovich | MP | Matias Popovich |
| 9 | Pablo Recalde | PR | Pablo Recalde |
| 12 | Viani Alfonzo | VA | Viani Alfonzo |
| 10 | Rodolfo Silva | RS | Rodolfo Silva |
| 8 | Tati Enciso | TE | Tati Enciso |
| 2 | Rodrigo Ávila | RA | Rodrigo Avila |
| 11 | Sergio González | ChG | Checho Gonzales |
| 4 | Mathías Fernández | MF | Mathias Fernandez |
| — | (no existe) | OB | Olga Bareiro (6 filas) |
| — | (no es provider) | SP | Sin profe (67 filas) |

Matching por nombre con `fold()` funciona para todos menos ChG → Sergio González: mapear por código, no por nombre.

Locations: `1 Lomas`, `2 Elite`, `3 Segurola`. La relación sede→profes actual está mal respecto a la madre (Lomas no tiene a Fernando Laval; Elite tiene a Fernando y no a Pablo Recalde). Se reconstruye desde la madre.

Sedes por profe según la madre: FL Lomas+Segurola; PR Lomas+Elite+Segurola; RS Lomas+Elite+Segurola; ChG Elite; JM, MP, VA, TE, RA, MF, OB Lomas.

Services (`GET /admin/services`): `2 Clase individual` (150000), `6 Clase dual` (120000), `3 Clase grupal` (100000). Todos 60 min, `limit_booking: null`, `min_group_booking: 1`, categoría `1 Clases`.

Client fields (`GET /admin/clients/fields`): name, email (**obligatorio**), phone (obligatorio, default `595`), country (PY), address…, y el campo custom **`Nivel`** (`id e640f4944ebe7f42fa07a884a5f3fffd`, tipo `select`, obligatorio, valores `Principiante`, `Octava`, `Septima`).

Plugins (`isPluginActivated` / `GET /admin/plugins`): activos `group_booking`, `membership`, `client_login`, `event_category`, `location`, `classes`, `event_field`, **`package`**, **`reschedule_booking`**. **Inactivo `limit_bookings`**: por eso `limit_booking` es `null` en los servicios y, con `qty > 1`, una "Clase individual" aceptaría varios alumnos en el mismo hueco. También inactivos `recurring_services`, `multiple_bookings`, **`cancelation_policy`** (`getCancellationPolicy()` → `null`). `getMembershipList` devuelve `[]`; `GET /admin/memberships` da 404. Packs en REST: `Pack grupal 10` (`package_limit`/`qty` 10, 60 días) e `Individuales - 5 clases`. La entidad pack trae vigencia y créditos; **no** hay máximo de cancelaciones ni de cambios. `GET /admin/clients/packages` da 400. Limit Bookings y Anti-Fraud limitan reservas nuevas, no excepciones. Client Rescheduling es un plazo en horas, no un contador; no reprograma recurring, group batch ni reservas con membership.

Horario de provider: un solo horario semanal por profe, sin sede (`getWorkDaysInfo` → `06:00–17:00`, que es el seed `DG_BLOCKS` con fin exclusivo, **no** la madre: deja fuera las 117 clases de las 17:00). Se escribe con JSON-RPC `setWorkDayInfo` como en `simplybook-seed-providers.ts`. Huecos: `GET /admin/schedule/available-slots?service_id&provider_id&date&count=1` devuelve `[{id, date, time}]` en hora local de la empresa.

Reserva (verificado en `simplybook-seed-bookings.ts`): `POST /admin/bookings` con `{count, start_datetime: "YYYY-MM-DD HH:MM:SS", location_id, provider_id, service_id, client_id}`. Lista paginada: `GET /admin/bookings?page&on_page=50` (`sbPages`), cada booking trae `start_datetime`, `status`, `client_id`, `provider_id`, `service_id`, `location_id`.

Hay 17 clientes y reservas de prueba (`*.bandeja.test`, servicio `4 Prueba individual` inactivo). Por defecto se ignoran, no se borran.

## 2. Decisiones tomadas

1. **La madre es la fuente de la carga inicial** y desde T0 vive en Postgres (`simplybook.madre_rows`). El CSV es solo ingestión. El editable solo aporta `Estado`.
2. **Las clases fijas se materializan como reservas en ventana rodante**, creadas por API. No Classes ni Recurring.
3. **Grupal: una reserva por alumno** (`count: 1`). Varias reservas en el mismo hueco. **Dual: un checkout, dos Students** (ADR 0008). El booker trae al companion; no hay segundo widget. En SimplyBook acaban dos bookings `count: 1` (mismo profe + sede + `start_datetime`), no un `count: 2` de una sola ficha. Import: un hueco dual con dos IDs de la madre → dos clientes + dos bookings. Hueco dual con una sola fila → `dual_sin_pareja`, no se carga como individual.
4. **Cupo por hueco** = `qty` del provider (4). Dual no usa Limit Bookings = 2 (ese tope es a esa hora en toda la academia). Group Bookings en Dual: `min_group_booking: 2` para que el widget ocupe dos asientos de una; después `simplybook-materialize-dual` parte en dos clientes. Grupal sigue en `count: 1` por alumno (máximo 1 participante por reserva en el widget, para que nadie pida `count: 4` y se quede el hueco). Sin tope global de Limit Bookings. Verificar si el admin salta el `qty`: si `POST /admin/bookings` no lo respeta, el import se apoya en `available-slots` y `v_capacidad`.
5. **Fase 1 migra fiel a la madre con los tres servicios actuales.** La prueba de mezcla de servicios (T1.2) va **antes** de la ventana completa de fase 4, porque decide qué pasa con los huecos mezclados en la propia carga.
6. **Excepción ≠ cambio de regla** (CONTEXT.md). Idempotencia: una clave `client_id|provider_id|start_datetime` **vista alguna vez, cancelada incluida, no se recrea**. Cambio de regla = editar `madre_rows` y correr `simplybook-reconcile --prune`, que cancela a futuro lo que ya no está en la madre. Sin las dos cosas el calendario se pudre a la segunda semana.
7. **Identidad del alumno = persona, no ficha.** Clave `ID` de la madre; un cliente SimplyBook por persona. Merge de dos IDs **solo** si coinciden teléfono E.164 **y** `fold(nameBase())` (las 4 fichas partidas). El teléfono solo no une a nadie (31 familias). `client_map.client_id` **sin UNIQUE**; `other_ids[]`. El campo `Código` en SimplyBook manda en corridas posteriores. "Pedro Aguero" sin ID se une a `A0538`.
8. **Precio no se migra.**
9. **Filas bloqueantes** (no se cargan; van al informe): `Sin profe`, sede `A Definir`, sin modalidad ni tipo, `Bloque`, sin ID sin merge posible, huecos de más de 4, y `profe_dos_sedes_misma_hora` hasta que la academia decida. Filas sin teléfono **sí** se cargan y se listan.
10. **Sin correo no hay SimplyBook Client Login — y no hace falta.** Guest book es nombre + WhatsApp (widget y booker Viborea). El login de SimplyBook no es el portal del alumno: “olvidé mi contraseña” no llega a nadie. Antes de T2: E-mail opcional en Manage → Client fields. El self-serve (ver disponibilidad por profe y agendar sin un agente) es el booker `/reservar/:slug` contra ese calendario, no un atajo de WhatsApp. ADR 0004.
11. **Tope de excepciones: a mano en SimplyBook, no en scripts ni API.** Verificado en help + cuenta `academiadg`: no hay custom feature ni campo ni endpoint que cuente “N cancelaciones o cambios por mes / por pack”. Cancellation Policy solo corta por **horas** (o prohíbe cancelar). Client Rescheduling, igual: ventana, no cantidad. La academia activa esa política en Custom Features, escribe el texto (2 o 3 cambios al mes, o por cada 10, o similar) y cuenta las reposiciones en el inbox. Los scripts no implementan este contador. Si cancelar sin reponer debe descontar la clase, dejar apagado el refund automático de crédito de pack.
12. **Ausencia del profe ≠ cambio de regla.** Viaje, enfermedad, feriado o un hueco tapado se registran en SimplyBook (special day o calendar note con `time_blocked`) y, **aparte**, se cancelan o reasignan las reservas ya clavadas. No se edita `madre_rows` salvo que a partir de esa semana el hueco deje de existir. Cerrar disponibilidad no cancela lo ya reservado. Catálogo y API: §9.
13. **Dual es pareja (ADR 0008).** Intake Forms (`event_field`, ya activo) solo en el servicio Dual: *Nombre del acompañante* y *WhatsApp del acompañante*, ambos obligatorios, no en Individual ni Grupal. El REST `POST /admin/additional-fields` da 404 y PUT no persiste `min_group_booking`: los dos campos y el mínimo 2 se crean en el panel (Intake forms + Dual → Más opciones). `simplybook-configure-dual.ts` escribe la descripción y apaga `limit_booking` en Dual. Materializar dos clientes: `simplybook-materialize-dual.ts`.

## 3. Mapeo madre → SimplyBook

| Madre | SimplyBook | Regla |
|---|---|---|
| `Sede` | `location_id` | Lomas→1, Elite→2, `Segurola Y Habana`→3. `A Definir` → bloqueante. |
| `Profe` (código) | `provider_id` | Tabla de 1.2. OB → crear "Olga Bareiro". SP → bloqueante. RS/PR en dos sedes a la misma hora → según decisión §6 (posible provider por sede). |
| `Modalidad` / `Tipo de clase` | `service_id` | Individual/IND→2, Dual/D→6, Grupal/G→3. `Modalidad` manda; si vacía, `Tipo`; ambas vacías → bloqueante. |
| `Dia` + `Hora` | `start_datetime` | Ocurrencias del día de semana desde `--from` (lunes local) durante `--weeks`. `YYYY-MM-DD HH:00:00` hora local de la empresa. |
| `Alumno`, `ID`, `Telefono normalizado` | client (`name`, `phone`, campo `Código`) | `name = nameBase(Alumno)`. Teléfono a E.164 con `parsePhone("+"+digits)`; si falla, sin teléfono y en informe. |
| `Categoria` | campo `Nivel` | P→Principiante, 8→Octava, 7→Septima, 6→Sexta, 5→Quinta, 4→Cuarta, 3→Tercera, 2→Segunda, 1→Primera. `6.5` → decisión §6 (por defecto Sexta). Vacía → no escribir. Añadir valores al select antes de importar. |
| `Lado`, `Nota`, `Nombre p/ WhatsApp`, `Precio` | — | No se migran. |
| `Modalidad = Bloque` | tramos no reservables | ALTO RENDIMIENTO y ALMUERZO → `breaktime` en `setWorkDayInfo`. |
| `Estado` (editable) | — | Solo informe. |

## 4. Fases y tareas

Scripts en `core/scripts/`, se corren con `infisical run --env=dev -- bun core/scripts/<x>.ts …`. Todos aceptan `--dry-run` y con esa bandera no escriben nada en SimplyBook. Las cifras de aceptación que citan la madre del 2026-09-13 son el resultado de **una corrida con las reglas de §1.1 y §3**; el test sintético fija las reglas, la madre solo las ilustra.

### Fase 0. Parser, validación y persistencia de la madre (sin tocar SimplyBook)

**T0.1 `core/scripts/madre.ts`** (módulo, sin efectos).

- `parseMadre(csvPath): MadreRow[]` reutilizando `parseCsv`, `fold`, `nameBase`, `categoryOf` de `padron-load.ts` (extraer a `core/scripts/csv.ts`; `padron-load.ts` sigue funcionando).
- `MadreRow`: `{ clave, weekday: DayOfWeek, time: "HH:MM", sedeRaw, locationId | null, profeCode, providerId | null, alumno, alumnoBase, studentId | null, phoneE164 | null, modalidad: "individual"|"dual"|"grupal"|null, serviceId | null, categoriaRaw, nivel | null, isBlock, blockName, estado, slotKey }` con `slotKey = ${weekday}|${time}|${sedeRaw}|${profeCode}`.
- `validateMadre(rows, editableRows?)` → `{ importable, pending }`. Razones: bloqueantes `sin_profe`, `sede_a_definir`, `sin_modalidad`, `sin_id`, `slot_mas_de_4`, `profe_dos_sedes_misma_hora`; informativas `para_revisar`, `sin_telefono`, `alumno_sin_categoria`, `slot_mezcla_categorias`, `slot_mezcla_modalidades`, `dual_sin_pareja`, `telefono_compartido`. `profe_dos_sedes_misma_hora` marca **todas** las filas de ese profe a esa hora en ambas sedes.
- `mergeStudents(rows)` → personas: agrupa IDs con mismo teléfono **y** mismo `fold(nameBase)`; adjunta filas sin ID a la persona con mismo `fold(nameBase)` si es única. Devuelve `{ personId (el ID menor), otherIds[], name, phoneE164, nivel }`.
- `providerWeek(rows)` → por provider y weekday `{ start, end, breaks[] }`: `start` = primera hora con fila (alumno o bloque), **`end` = última hora + 60 min** (una clase a las 17:00 exige `end = 18:00`), `breaks` = horas sin filas entre `start` y `end` más los bloques. Alto Rendimiento es break aunque el profe esté trabajando: nadie debe poder reservar ahí. Documentar en el código.

**T0.2 `core/scripts/madre-report.ts <madre.csv> [editable.csv]`**

- Escribe `madre-pendientes.csv` (Dia, Hora, Sede, Profe, Alumno, ID, Modalidad, Categoria, Telefono, Pendientes) y `madre-resumen.txt`.
- Con los CSV del 2026-09-13 y las reglas de arriba, la corrida da: 708 filas alumno, 398 IDs + 1 sin ID, ~392 personas tras merge, 404 huecos, **588 filas importables** (antes de descontar `profe_dos_sedes_misma_hora`), 323 `para_revisar`, 67 `sin_profe`, 15 `sede_a_definir`, 60 `sin_modalidad`, 132 alumnos sin categoría, 58 sin teléfono, 35 teléfonos compartidos, 71 huecos con categorías mezcladas, **54** huecos con modalidades mezcladas y **49** duales sin pareja (con modalidad inferida), 2 huecos de más de 4, 10 combinaciones profe+día+hora en dos sedes. Si una cifra no cuadra, revisar la regla, no el número.
- Test: `core/scripts/madre.test.ts` con un CSV sintético de ~15 filas (sin datos reales) que cubra cada razón, el merge de ficha partida, la familia que **no** se une, y `providerWeek` con clase a las 17:00.

**T0.3 `core/scripts/madre-load.ts <madre.csv> [editable.csv]`**: escribe `simplybook.madre_rows` (una fila por `MadreRow` importable o pendiente, con `reasons TEXT[]`, `person_id`, `loaded_at`) y `simplybook.madre_persons`. Tablas en `core/src/db/simplybook.sql`; `simplybook-sync.ts` **no** las trunca. A partir de aquí, T2 y T4 leen de Postgres, no del CSV. Cambio de regla = editar estas tablas (o recargar un CSV corregido) y reconciliar.

### Fase 1. Catálogo en SimplyBook

**T1.1 `core/scripts/simplybook-prepare.ts`** (idempotente; `--dry-run`).

1. Precondiciones que el script comprueba y con las que aborta si faltan (son manuales en UI): plugin **Limit Bookings activo** (`isPluginActivated("limit_bookings")`), Group Bookings con máximo 1 participante, select `Nivel` con Primera…Sexta, campo texto `Código` opcional, E-mail opcional.
2. Providers: crear "Olga Bareiro" si falta. Si la academia eligió provider por sede para RS/PR, crear "Rodolfo Silva · Elite" etc. y registrar el mapeo (código + sede → provider_id) en `simplybook.provider_map`. `PUT /admin/providers/{id}` con `qty: 4`, `services: [2,3,6]`.
3. Services: `PUT /admin/services/{id}` con `limit_booking` 1 / 2 / 4 para 2 / 6 / 3; leer de vuelta y abortar si no persiste (entonces se hace en Manage → Services → More options y se reintenta).
4. Locations: `PUT /admin/locations/{id}` con `providers` desde la madre.
5. Horarios: `setWorkDayInfo` por provider y día con `providerWeek()`. Domingo `is_day_off: 1`.

Aceptación (de la madre, no del seed): `available-slots` para servicio 3, provider 7 (FL), un lunes → exactamente `06:00, 07:00, 11:00, 16:00, 17:00` (Lomas 6-7 alumnos, 8-10 AR, 11 alumno; Segurola 13-15 AR, 16-17 alumnos). Segunda corrida: "sin cambios".

**T1.2 Prueba de mezcla de servicios en un hueco.** Bloquea la ventana completa de fase 4. Con dos clientes de prueba: reservar dual (6) a las 06:00 con provider 13, luego intentar grupal (3) a la misma hora y provider; después probar individual (2) encima de un grupal. Anotar en §7. Consecuencias:
- **Rechaza:** los 54 huecos mezclados fallan en la carga; hay que reclasificarlos (decisión §6) antes de `--weeks 6`.
- **Acepta:** entran, pero `qty` + `limit_booking` **no clavan el offering del hueco**: un suelto puede meter una individual encima de un grupal. Hay que decirlo a la academia antes de prometer "el alumno solo suma una suelta", y `v_capacidad` pasa a ser vigilancia obligatoria.

### Fase 2. Alumnos

**T2.1** en `core/src/db/simplybook.sql`:

```sql
CREATE TABLE IF NOT EXISTS simplybook.client_map (
  person_id TEXT PRIMARY KEY,          -- ID menor de la persona (A0028)
  other_ids TEXT[] NOT NULL DEFAULT '{}',
  client_id INTEGER NOT NULL,          -- sin UNIQUE: permite corregir merges a mano
  matched_by TEXT NOT NULL,            -- 'codigo' | 'phone+name' | 'name' | 'created'
  name TEXT NOT NULL,
  phone_e164 TEXT,
  nivel TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**T2.2 `core/scripts/simplybook-import-clients.ts [--dry-run]`** (lee `madre_persons`).

1. Cargar clientes existentes (`sbPages("/admin/clients")`) con sus campos (`/admin/clients/fields/values?client_id=`) y `client_map`.
2. Por persona, en este orden: (a) `Código` en SimplyBook contiene `person_id` o alguno de `other_ids` → ese cliente; (b) `client_map` → ese cliente; (c) teléfono E.164 **y** `fold(nameBase)` iguales → ese cliente; (d) `fold(nameBase)` igual y único, sin teléfono en ninguno de los dos lados → ese cliente; (e) si no, `POST /admin/clients`. Teléfono igual con nombre distinto **nunca** une (`familia`). Varios candidatos → `cliente_ambiguo`, no se crea ni se une.
3. Campos custom `Nivel` y `Código`: endpoint de escritura **a verificar** (probar `PUT /admin/clients/{id}` con `fields: [{id, value}]`; si no persiste, buscar en el API Explorer de la cuenta y documentar en §7; último recurso, Excel manual y seguir).
4. Upsert `client_map`. Salida: `clientes-resultado.csv`.

Aceptación: una fila en `client_map` por persona (~392 con la madre del 13-09); Rodrigo Lee y Romina Lee son dos clientes; Alex Ebner es uno con `other_ids = {A0564}`; segunda corrida no crea nada; `simplybook-sync.ts` muestra `nivel` en quienes tienen categoría.

### Fase 3 (fuera del camino crítico). Nivelación

Servicio grupal por categoría + membresía por nivel, según la conversación previa sobre niveles. La API no expone membresías (404, lista vacía): emitir ~392 membresías a mano por UI **no es un plan**. Hasta que exista API o la academia acepte el coste manual, la nivelación es la vigilancia de T4.3. No implementar.

### Fase 4. Sesiones (reservas de clases fijas)

**T4.1 `core/scripts/simplybook-import-madre.ts --from YYYY-MM-DD --weeks N [--dry-run] [--only-slot "Lunes|7:00|Lomas|FL"]`** (lee `madre_rows` importables y `client_map`).

1. `--from` lunes; fechas con `weekOf`/`instantFrom` de `core/src/domain/timezone.ts` en `America/Asuncion`. Verificar una vez que la zona horaria de la empresa en SimplyBook es Asunción y abortar si no.
2. Tabla `simplybook.import_log (key TEXT PRIMARY KEY, booking_id INTEGER, person_id, provider_id, service_id, location_id, start_at, result, reason, run_at)` con `key = client_id|provider_id|start_datetime`. **Idempotencia = la clave está en `import_log` o existe un booking con esa clave en SimplyBook, cancelado o no.** Lo cancelado no se recrea. Precargar en memoria `import_log` + `sbPages("/admin/bookings…")` de la ventana.
3. Orden: fecha, provider, hora; dentro del hueco individual → dual → grupal; huecos con `slot_mezcla_modalidades` al final del día.
4. Por fila y semana: clave vista → `skip`. Si no, `available-slots`; hora ausente → `reject` (`fuera_de_horario`, `hueco_lleno`, `servicio_bloqueado`). Presente → `POST /admin/bookings` `{count: 1, start_datetime, location_id, provider_id, service_id, client_id}` y registrar `booking_id`.
5. Ritmo: secuencial, 150 ms entre POST, **backoff exponencial** en 429/5xx (1 s, 2 s, 4 s, 8 s; luego abortar y dejar el log consistente). Volumen: 588 filas × 6 semanas ≈ 3.500 POST + 3.500 GET.
6. Salida: `madre-carga-<from>.csv` + resumen. Exit 1 si hay `reject` no esperados.

Aceptación en `--weeks 1 --only-slot` sobre tres huecos limpios (individual, dual, grupal de 4): 7 creadas; segunda corrida 7 `skip`; cancelar una a mano en SimplyBook y tercera corrida sigue dando `skip` para esa; el calendario muestra el cupo correcto. Undo verificado antes de la ventana: `DELETE /admin/bookings/{id}` o `cancelBooking` JSON-RPC sobre todas las `created` del log.

**T4.2 `core/scripts/simplybook-reconcile.ts --from --weeks [--prune] [--dry-run]`.** Compara `madre_rows` con `import_log` + SimplyBook en la ventana: crea lo nuevo (llama a la lógica de T4.1), y con `--prune` **cancela a futuro** las reservas creadas por el import cuya fila ya no está en `madre_rows` (cambio de regla: el alumno dejó la fija). Nunca toca reservas que no estén en `import_log` (las hizo la academia o el alumno).

**T4.3 Ventana rodante.** Servicio `madre-cron` en `compose.yaml` (misma imagen que `app`, como `backup`), que cada lunes 03:00 Asunción corre `bun /app/scripts/simplybook-reconcile.ts --from <lunes N+6> --weeks 1 --prune` leyendo `DATABASE_URL` y los secrets de SimplyBook desde `.env` del VPS (Infisical no está en el VPS; recordar que Dokploy Redeploy reescribe `.env`). GitHub Actions **no** sirve: el Postgres de producción es `127.0.0.1` y el job necesita `madre_rows`. Ventana: 6 semanas.

**T4.4 Verificación** (`core/scripts/simplybook-bi.sql` + `simplybook-sync.ts`):

- `simplybook.v_madre_check`: compara **`import_log` con SimplyBook** (creadas que ya no existen, canceladas, movidas). No compara la madre cruda con el calendario cada lunes: en cuanto hay excepciones eso solo ensucia.
- `simplybook.v_nivel_mismatch`: reservas grupales cuyo `client.nivel` difiere del nivel mayoritario del hueco. Es la única red de seguridad de nivel mientras no haya fase 3.
- `simplybook.v_capacidad`: huecos con más reservas activas que el límite del servicio, y huecos con más de un servicio (si T1.2 dio "acepta").

### Fase 5. Comunicación al alumno (mínima)

- Sin WhatsApp productivo de la academia (AGENTS.md; el AgentBot es sandbox). Con email opcional y sin créditos SMS, SimplyBook no avisa a nadie.
- Self-serve es el booker Viborea (`/reservar/:slug`): el alumno ve disponibilidad por profe y agenda guest (nombre + WhatsApp) sin agente. `/reservar/:slug/clases` es su historial. El widget `academiadg.secure.simplybook.me` es el mismo calendario, atajo que manda el bot. Cancelar/mover: enlace de esa reserva, no Client Login. ADR 0004.
- Chatwoot no pinta celdas ni confirma solo. «Hablar con alguien» es Diego. José opera el panel SimplyBook.
- **Apagar notificaciones automáticas** en SimplyBook durante cualquier carga o reconciliación masiva y reactivarlas después.

## 5. Orden de ejecución

1. T0 completo (parser, informe, tests, `madre_rows`). No toca SimplyBook; se puede hacer ya.
2. Decisiones de la academia §6.1 a 6.5 (mínimo: RS/PR en dos sedes y qué hacer con los huecos mezclados).
3. T1.1 con las precondiciones manuales hechas (plugin Limit Bookings, Group Bookings máx. 1, campos, email).
4. T1.2 y anotar §7.
5. T2 (personas, no teléfonos).
6. T4.1 una semana, tres huecos, undo probado, notificaciones apagadas.
7. T4.1 ventana completa.
8. T4.2 + T4.3 solo con `madre_rows`, prune y cron en compose funcionando.

```bash
infisical run --env=dev -- bun core/scripts/madre-report.ts <madre.csv> <editable.csv>
infisical run --env=dev -- bun core/scripts/madre-load.ts <madre.csv> <editable.csv>
infisical run --env=dev -- bun core/scripts/simplybook-prepare.ts --dry-run
infisical run --env=dev -- bun core/scripts/simplybook-prepare.ts
infisical run --env=dev -- bun core/scripts/simplybook-import-clients.ts --dry-run
infisical run --env=dev -- bun core/scripts/simplybook-import-clients.ts
infisical run --env=dev -- bun core/scripts/simplybook-import-madre.ts --from 2026-09-21 --weeks 1 --only-slot "Lunes|7:00|Lomas|FL"
infisical run --env=dev -- bun core/scripts/simplybook-import-madre.ts --from 2026-09-21 --weeks 6
infisical run --env=dev -- bun core/scripts/simplybook-sync.ts && psql "$DATABASE_URL" -f core/scripts/simplybook-bi.sql
```

Antes de la ventana completa: snapshot de Postgres (`ops/pg-backup.sh --once`) y Excel de reservas de SimplyBook.

Las decisiones de planilla (profe en dos sedes, fichas partidas, mix de tipo, dual sin pareja, sin profe/sede/tipo) se cierran en [PLANILLA-CONFLICTOS.md](PLANILLA-CONFLICTOS.md), ítem por ítem, con el administrador.

## 6. Decisiones que necesita la academia (no las tome el agente)

1. **RS y PR en dos sedes a la misma hora**: un provider por sede, o subir `qty`, o reubicar. Sin esto, 10 combinaciones día+hora no se cargan.
2. Qué hacer con los 54 huecos con modalidades mezcladas y los 71 con categorías mezcladas: reclasificar o aceptar como excepción (y en ese caso qué pasa si T1.2 rechaza).
3. Confirmar las 323 filas `para revisar` con cada profe. Se cargan igual mientras tanto.
4. Profe para las 67 `Sin profe`, sede para las 15 `A Definir`, modalidad para las 60 sin modalidad ni tipo.
5. Categoría para los 132 alumnos sin ella; valor de `Nivel` para `6.5`.
6. Email opcional (sí: guest book nombre + WhatsApp). No Client Login. Aviso al alumno: booker + enlace de la reserva, no “olvidé mi contraseña”.
7. Borrar o conservar los 17 clientes y reservas de prueba.
8. Si algún día se quiere fase 3, aceptar el coste de emitir membresías a mano.
9. Cifra exacta del tope de cambios del alumno (2 vs 3, mes vs cada 10). No es una tarea de agente: se escribe en Cancellation Policy / el texto del widget. SimplyBook no lo hace cumplir (§2.11).
10. Cuando un profe falta (viaje, enfermo): **cancelar** las fijas de esa ventana, **reasignar** a un suplente, o avisar y dejar el hueco. SimplyBook no elige: special day / block time solo tapa huecos **nuevos**. Ver §9.

## 7. Registro de verificaciones (rellenar al ejecutar)

| Ítem | Resultado | Fecha |
|---|---|---|
| Plugin Limit Bookings activado y `PUT /admin/services/{id}` persiste `limit_booking` | | |
| El admin (`POST /admin/bookings`) respeta el límite por servicio | | |
| Group Bookings máx. 1 participante | | |
| Escritura de campos custom de cliente por REST (forma exacta) | | |
| T1.2 dual + grupal mismo hueco: rechaza / acepta | | |
| T1.2 individual encima de grupal: rechaza / acepta | | |
| Zona horaria de la empresa | | |
| `GET /admin/bookings` acepta filtro de fechas | | |
| Undo: `DELETE /admin/bookings/{id}` o `cancelBooking` | | |
| Email opcional en Client fields | | |
| Tope de N cancelaciones/cambios por cliente, mes o pack | no existe (help + API 2026-09-13) | 2026-09-13 |
| `setWorkDayInfo` con `date` (special day de un provider) y `deleteSpecialDay` existen en JSON-RPC admin | documentado; no corrido en write sobre `academiadg` | 2026-09-13 |
| `POST /admin/calendar-notes` con `time_blocked: true` (block time) | documentado en REST v2; `GET` en `academiadg` → 0 notas | 2026-09-13 |
| Special day / block time **cancela** reservas ya existentes | **verificar** (help + blog: solo cierra huecos nuevos) | |
| `getCompanyWorkCalendarForYear(2026)` | solo domingos `day-off` con `data_source=company_work_day`; **cero** special days de empresa | 2026-09-13 |

## 8. Referencias oficiales

- Group Bookings: https://help.simplybook.me/index.php/Group_Bookings_custom_feature
- Limit Bookings: https://help.simplybook.me/index.php/Limit_Bookings_custom_feature
- Cancellation Policy: https://help.simplybook.me/index.php/Cancellation_Policy_custom_feature
- Client Rescheduling: https://help.simplybook.me/index.php/Client_Rescheduling_custom_feature
- Packages: https://help.simplybook.me/index.php/Packages_custom_feature
- Number of clients per time slot: https://help.simplybook.me/index.php/Number_of_clients_per_time_slot
- Membership: https://help.simplybook.me/index.php/Membership_custom_feature
- Client Login: https://help.simplybook.me/index.php/Client_Login_custom_feature
- Client Fields: https://help.simplybook.me/index.php/Client_Fields_Custom_Feature
- Multiple Locations: https://help.simplybook.me/index.php/Multiple_Locations_custom_feature
- JSON-RPC admin (`setWorkDayInfo`, `getBookings`, `book`, `cancelBooking`, `getMembershipList`, `deleteSpecialDay`): https://help.simplybook.me/index.php/Company_administration_service_methods
- Availability / special days (UI): https://help.simplybook.me/index.php/How_to_set_my_availability
- Calendar Notes / block time (UI): https://help.simplybook.me/index.php/Calendar_Notes
- Break times (UI): https://help.simplybook.me/index.php/Break_times
- Special days blog (group dates, holidays, maternity): https://news.simplybook.me/special-days-events-holidays-setting-it-up-in-your-schedule/
- REST v2 calendar notes: `GET/POST /admin/calendar-notes`, `PUT/DELETE /admin/calendar-notes/{id}` (API Explorer de la cuenta; el JSON de ejemplo oficial lleva `time_blocked`).
- La referencia REST v2 no está publicada como página estática; se consulta en el API Explorer de la cuenta. Lo verificado en este repo está en `core/scripts/simplybook*.ts`.

## 9. Excepciones de agenda (profe ausente, enfermo, feriado)

La guía de la UI que circula (Settings → Providers schedule → Special days; Calendar → Add note/Block time) **es fiel** al help oficial de SimplyBook (páginas citadas en §8, last edit 2026-01-30 / 2026-06-15). Lo que esa guía **no dice**, y que en DG es el riesgo real: **cerrar horario no toca las reservas ya clavadas**.

Seguimiento operativo: [Todoist — Excepciones de agenda SimplyBook](https://app.todoist.com/app/task/6hVx7xwqRF5mfX62) (proyecto Academia DG). Agente que habla con administración (marcar, conflictos, remapear): [simplybook/SKILL.md](simplybook/SKILL.md).

### 9.1 Dos gestos, no uno

SimplyBook distingue **horario** (quién puede recibir una reserva **nueva**) de **reserva** (quién ya está anotado).

| Gesto | Qué cierra | Qué no hace |
|---|---|---|
| Special day del provider o de la empresa | Huecos nuevos ese día / esas horas | No cancela bookings existentes |
| Calendar note con `Time is blocked` | Un tramo concreto, para un profe, un servicio o todos | Ídem |
| `cancelBooking` / `editBook` / `DELETE /admin/bookings/{id}` | La clase ya anotada (Exception de CONTEXT.md) | No tapa el hueco para un suelto, salvo que también se cierre el horario |

Blog oficial: *“As long as there are no booked appointments or scheduling clashes, no one else will be able to book for the now-closed periods.”* Hay que **verificar** en `academiadg` que un special day deja las fijas en el calendario (§7). Hasta entonces, operar como si las fijas siguieran vivas.

En DG las fijas se materializan como reservas en ventana rodante. Un profe particular fuera **esta semana** exige:

1. Special days lun–sáb de esa semana (`Is working day?` off, o `setWorkDayInfo` con `date` + `is_day_off: 1`) para que nadie reserve un suelto.
2. Listar `GET /admin/bookings` de ese `provider_id` en el rango y **cancelar o reasignar** cada una.
3. Aviso por inbox (Chatwoot). WhatsApp productivo de la academia sigue cerrado (AGENTS.md).
4. **No** editar `madre_rows` ni el horario semanal. La semana que vuelve, el hueco sigue.

Si solo se hace (1), el widget deja de ofrecer huecos y las fijas siguen ahí: el alumno cree que hay clase.

### 9.2 Dónde se registra (UI)

Validado contra [How to set my availability](https://help.simplybook.me/index.php/How_to_set_my_availability), [Calendar Notes](https://help.simplybook.me/index.php/Calendar_Notes) y [Break times](https://help.simplybook.me/index.php/Break_times).

**Día o semana de un profe (viaje, enfermo un día, horario recortado)**

1. Settings → Providers schedule → **Special days schedule**.
2. Elegir el provider.
3. Clic en la fecha → apagar “Is working day?” (día entero) o recortar horas → Done.
4. Varias fechas iguales: toggle **Enable group dates selection** → marcar → **Edit schedule**.
5. Revertir: clic en la fecha → **clear special day**.

Los special days del provider salen en rojo; los de la empresa, en amarillo.

**Hueco corto (trámite, médico, un 10:00–11:00)**

1. Calendar → modo **Add note/Block time**.
2. Clic en el timeslot.
3. Marcar **Time is blocked**.
4. Assignee: ese provider (no “everyone”, no un servicio).
5. Guardar. Para editar o borrar: clic en la nota.

**Feriado / academia cerrada**

Settings → Company opening hours → Special days schedule. Un provider no puede estar “abierto” fuera del horario de la empresa.

**Breaktime semanal (ALMUERZO, ALTO RENDIMIENTO)**

Providers schedule (horario de la semana), no special days. Recurre cada semana. Es lo que T1.1 escribe con `breaktime` en `setWorkDayInfo` **sin** `date`. No usar esto para un viaje de una semana: al volver habría que deshacer el semanal a mano.

**Restricción oficial:** el horario del provider tiene que caber en Company opening hours. Si no abre a las 06:00 en la empresa, no se puede abrir a las 06:00 en el profe.

### 9.3 API

Ya hay cliente en `core/scripts/simplybook.ts` (`sbAdminRpc`, `sbPost`). `simplybook-seed-providers.ts` escribe el **semanal** (`date: ""`, `index` 1–7). Un special day es el mismo método con `date` lleno.

**Cerrar un día de un profe** (JSON-RPC admin):

```
setWorkDayInfo({
  start_time: "06:00",
  end_time: "18:00",
  is_day_off: 1,
  breaktime: [],
  index: "1",           // 1=lunes … 7=domingo (el weekday de esa fecha)
  name: "Monday",
  date: "2026-09-21",   // ← esto lo hace special day
  unit_group_id: "9",   // provider_id, p.ej. Pablo Recalde
  event_id: ""
})
```

Horario recortado ese día: `is_day_off: 0` + `start_time`/`end_time`/`breaktime` distintos del semanal.

Quitar el special day: `deleteSpecialDay("2026-09-21", { unit_group_id: "9" })`.

Lectura (verificado 2026-09-13 en `academiadg`):

- `getWorkCalendar(2026, 9, 7)` → por fecha `{from, to, is_day_off}` de Fernando Laval. Domingos `is_day_off: 1`. Sábados 08:00–12:00 (el semanal, no un special).
- `getWorkDaysInfo("2026-09-15","2026-09-15", 7, 3, 1)` → tramos abiertos (los huecos entre ellos son break).
- `getCompanyWorkCalendarForYear(2026)` → solo domingos `day-off` con `data_source=company_work_day`. **Cero** special days de empresa.
- `GET /admin/calendar-notes` → `items_count: 0`.

**Block time** (REST v2, no corrido en write):

```
POST /admin/calendar-notes
{
  "provider_id": 9,
  "service_id": null,
  "start_date_time": "2026-09-21 10:00:00",
  "end_date_time": "2026-09-21 11:00:00",
  "note_type_id": "1",
  "note": "trámites",
  "mode": "provider",
  "time_blocked": true
}
```

`PUT /admin/calendar-notes/{id}` para editar, `DELETE` para quitar.

**Reservas ya clavadas:** `GET /admin/bookings` (filtro de fechas: verificar, §7) o JSON-RPC `getBookings({date_from, date_to, unit_group_id})`. Luego `cancelBooking(id)` o `editBook` (cambiar `unitId` al suplente). REST: `DELETE /admin/bookings/{id}`.

Ejemplo: un particular fuera lun–sáb de esta semana.

```
for date in lun..sáb:
  setWorkDayInfo({ date, unit_group_id, is_day_off: 1, ... })
for booking in getBookings({ date_from, date_to, unit_group_id }):
  cancelBooking(booking.id)   # o editBook al suplente
GET /admin/schedule/available-slots  # debe vaciarse para ese provider
```

No hay método REST documentado que escriba special days: se usa JSON-RPC. No hay `addEvent`/`deleteProvider`; para una baja larga se puede `is_active: 0` (`editServiceProvider`) además de los special days.

**Import / cron:** la clave `client_id|provider_id|start_datetime` vista alguna vez, **cancelada incluida**, no se recrea (decisión 6). Cancelar una fija de esta semana no la revive el lunes siguiente el reconcile. Un cambio de regla (ya no da ese hueco) sí va a `madre_rows` + `simplybook-reconcile --prune`.

### 9.4 Catálogo de escenarios

Códigos `E01`… para operar y para Todoist. “Madre” = `simplybook.madre_rows`.

| Código | Escenario | Registro (horario) | Reservas ya clavadas | Madre |
|---|---|---|---|---|
| E01 | Profe particular fuera una semana (viaje) | Special days group selection, `is_day_off` | Cancelar o reasignar **todas** las de esa semana de ese provider | No |
| E02 | Profe enfermo un día | Special day ese día | Ídem ese día | No |
| E03 | Profe se va a las 14:00 un día | Special day con `end_time` recortado, o `breaktime` en esa `date` | Mover/cancelar las que quedan fuera | No |
| E04 | Hueco corto (trámite 10:00–11:00) | Calendar note `time_blocked` de ese provider | Solo esa hora | No |
| E05 | Feriado / academia cerrada | Company special days | Todas las reservas de todos los profes ese día | No |
| E06 | Una sede cerrada, las otras no | SimplyBook **no tiene horario por sede**. Filtrar bookings por `location_id` y cancelar/mover esos. Block time no distingue Lomas de Elite. Si RS/PR se partieron en dos providers (§6.1), special day solo del de esa sede | Las de esa `location_id` | No |
| E07 | Sustituto cubre | Special day del titular (para no ofrecer sueltos a su nombre) + el suplente tiene que tener horario y `qty` ese día | `editBook` → `unitId` del suplente; la sede del booking se mantiene si el suplente está en esa location | No, si es una semana |
| E08 | Cambia la regla (ya no da los lunes 17) | Horario semanal del provider (`setWorkDayInfo` sin `date`) | `simplybook-reconcile --prune` | **Sí** |
| E09 | ALMUERZO / ALTO RENDIMIENTO habitual | `breaktime` semanal | No son reservas (`Modalidad = Bloque`) | Filas bloque, no se cargan |
| E10 | Alumno de individual cancela **su** clase | No se toca el horario del profe; el hueco puede quedar para drop-in | `cancelBooking` de ese client | No (sigue fijo las otras semanas) |
| E11 | Alumno de grupal falta | Nada | No cancelar la session ni a los compañeros | No |
| E12 | Se cancela la grupal entera (profe o academia) | Block time o special day si el profe no cubre ese hueco | Cancelar cada booking del hueco (`cancelBatch` si vinieran en lote; el import crea de a uno) | No |
| E13 | Lluvia / force majeure un hueco | Como E04 o E12 | Cancelar o reponer | No |
| E14 | Baja larga (meses) | Group dates special days, o `is_active: 0` del provider (la API no borra providers) | Cancelar/reasignar la ventana | Eventual cambio de madre |
| E15 | Profe nuevo / aún sin horario | No crear huecos hasta `setWorkDayInfo` semanal | — | — |
| E16 | El cron recrea lo que se canceló esta semana | No es un gesto de calendario: idempotencia de `import_log` | — | No, si la clave ya se vio |
| E17 | RS/PR en dos sedes: ausente en una | Un solo horario por provider. Sin split §6.1 no se puede apagar Elite y dejar Lomas | Filtrar por `location_id` (igual que E06) | Depende de §6.1 |

E01 es el ejemplo del particular fuera esta semana: group dates + cancel/edit de las fijas. E10/E11 son excepciones del **alumno**, no del profe: no se registran como special day.

### 9.5 Qué no hacer

- Editar el horario **semanal** para tapar una semana: al volver, hay que recordar deshacerlo, y T1.1 / `providerWeek()` lo pueden pisar.
- `simplybook-reconcile --prune` porque un profe viajó: prune es cambio de regla, borra a futuro lo que ya no está en la madre.
- Company special day para un solo profe: cierra la academia entera.
- Block time “everyone” para un particular: tapa a todos los profes en esa hora.
- Confiar en que el widget “ya no muestra” = las fijas están canceladas. No.
