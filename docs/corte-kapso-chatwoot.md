# Corte Kapso → Chatwoot, con SimplyBook como semana viva

Memo de arquitectura para Academia DG. Complementa [ADR 0007](../adr/0007-cut-production-whatsapp-after-simplybook.md). Revisión 2 (2026-09-13): incorpora la contraprueba contra el repo (ADRs, `docs/simplybook/MIGRACION.md`, AgentBot).

**Una frase:** primero SimplyBook es la semana real; ensayamos Chatwoot donde ya es dueño (Instagram + número de prueba); archivamos Kapso **antes** de tocar Meta; medimos si podemos suscribir una segunda app; y cortamos el `+595 981 078630` **una vez**, a un inbox WhatsApp Cloud **nativo**, con el bot callado.

Este documento no autoriza a un agente a mover el número. Las puertas de la §7 tienen que estar en verde.

---

## 1. Problema

Tres trabajos diarios, hoy mezclados en el chat:

1. Saber quién entrena cuándo (profe, sede, hora, alumno).
2. Hablar con alumnos y padres en el WhatsApp que ya conocen y en Instagram.
3. Cobrar — dolor #1 de Diego. **Fuera de este corte.**

La verdad operativa vive en WhatsApp: José lee, pinta la planilla, un agente clasifica confirma/cancela, el calendario se pone verde o azul. Objetivo: SimplyBook = sesiones; Chatwoot CE = bandeja; Kapso fuera; mínima fricción para José y Diego; mínima pérdida de fichas, clases fijas y plantillas de Meta.

No es un objetivo reproducir la libreta ni unificar Kapso y Chatwoot para siempre.

---

## 2. Qué hay hoy

| Sistema | Rol en producción |
|---|---|
| Planilla + libreta + `cal-unif` | Verdad de la semana para José. Verde / azul. |
| Kapso | BSP del `+595 981 078630`. Dueño del webhook que ve Meta. Inbox, plantillas, broadcasts. Coexistence Business App + Cloud API (observado en sesión; reconfirmar en fase C). |
| Railway `etapa-5.4` | Recibe **desde Kapso**, clasifica, escribe Firebase. No contesta. Tandas ~15:00. |
| Función Kapso `anotar-en-libreta-firebase` | Mismo contrato de escritura. El workflow canvas está en draft. |
| Chatwoot CE | Instagram nativo. Inbox WhatsApp de **prueba** `+595 994 374895`. AgentBot → Worker del menú + widget. |
| SimplyBook `academiadg` | Catálogo y widget. Aún no es la planilla viva. |

Identidad: el teléfono **no** es la persona (familias; fichas partidas). SimplyBook = un cliente por `ID` de la madre. Chatwoot = un contacto por WhatsApp. Un hilo, varios alumnos.

Observaciones de Kapso (sesión, **no** están en el repo): ~2461 mensajes, ~8 plantillas, display name LIMITED, coexistence. La fase C tiene que dejar un inventario reproducible.

---

## 3. Fuera de alcance

Cobro automático. Payroll. Login de alumno. Booker Viborea vivo. Verde/azul en Chatwoot. WhatsApp de créditos de SimplyBook. Cuentas Client Login. Portar el clasificador de Railway.

Email opcional en SimplyBook **ya está decidido** (ADR 0004, migración §2.10). Falta ejecutarlo en la UI, no volver a decidirlo.

---

## 4. Principios

1. Calendario ≠ bandeja ≠ cobro. Un escritor por verdad.
2. No portar software que pinta una UI que vamos a apagar (Railway / libreta).
3. No construir un puente cuyo único propósito es retrasar un corte que igual hay que hacer. Espejo de solo lectura, acotado, solo si Diego no puede aprender la UI de otro modo **o** si la doble suscripción de Meta funciona.
4. Migrar operación (fichas, clases, plantillas si el WABA sobrevive). Archivar memoria (hilos).
5. Persona ≠ teléfono ≠ hilo. El bot no confirma a ciegas por teléfono.
6. En producción, silencio por defecto.

---

## 5. Física de Meta (a verificar en fase D, no un hecho)

**Lo que sí es de Meta (docs actuales):**

- Cada **app** tiene un callback por defecto.
- Un **WABA** admite **varias apps** en `GET /{waba-id}/subscribed_apps`. Meta reintenta hacia todas las apps suscritas.
- Cada app puede poner un `override_callback_uri` en el WABA o en el número. La jerarquía es: override de número de **esa app** → override de WABA de **esa app** → callback de la app.
- Embedded Signup como **solution partner** sobre un WABA que ya tiene partner suele fallar con `2655093` (“already sharing this WABA with a partner”) o exigir desconectar al actual. También hay bloqueos por credit line huérfana del BSP.

**Lo que el memo anterior dijo mal:** “un WABA entrega inbound a una sola callback”. Eso describe el override de **una** app (y el rumor de Chatwoot #13497 sobre varios números en el mismo inbox), no la suscripción multi-app.

**Sombra útil, si y solo si se demuestra:**

```text
POST /{waba}/subscribed_apps   ← app de la academia, SIN Embedded Signup,
                                 SIN override_callback_uri de número
Kapso sigue recibiendo
la app de la academia recibe el mismo inbound
  → Worker de solo lectura → Chatwoot canal API
humanos siguen contestando en Kapso
```

Eso **no** es un inbox WhatsApp Cloud nativo de Chatwoot en paralelo. El inbox nativo de Chatwoot, el día del corte, va a querer el override. La sombra es otra app + espejo de lectura. Si `subscribed_apps` rechaza o Kapso desaparece de la lista, no hay sombra: el corte vuelve a ser de minutos, no de días.

Tres preguntas, no una:

1. ¿Quién es dueño del WABA `109244855499704`?
2. ¿La academia puede suscribir **su** app (no Kapso, no Chatwoot Cloud) mientras Kapso sigue?
3. ¿El WABA está compartido con otros clientes de Kapso / credit line OBO?

Solo con las tres se sabe si las plantillas sobreviven (mismo WABA = D1) o hay que re-aprobar (D2).

---

## 6. Destino (cuando Kapso ya no está)

```text
Alumno
  ├─ Widget SimplyBook  →  SimplyBook (sesiones)
  └─ WhatsApp producción + Instagram
                         →  Chatwoot CE
                              humanos: Diego (default), José
                              AgentBot: solo desconocidos o pending-bot
                              plantillas: recordatorio 24 h / cobro, autoría en el WABA
                         →  Cloud API, callback de la app de Chatwoot / academia
```

Canal API **no** es el destino (sin picker de plantillas, sin ventana de 24 h, puente eterno). SimplyBook **no** toca el WABA.

AgentBot hoy: `decide` ignora si hay assignee humano (`handed off`, `bot.ts`). Cualquier otro texto cae en menú. El silencio por default **no** existe; hay que cambiar `decide` y testearlo **antes** de enganchar el bot al número vivo. La allowlist `+595971638427` está en AGENTS.md, no en el Worker.

Precarga de contactos: `core/scripts/madre-chatwoot-contacts.ts` (un contacto por teléfono; las familias quedan en un hilo, que es lo correcto para WhatsApp). En el corte, apuntarlo al inbox **nuevo**.

---

## 7. Secuencia y puertas

Ninguna fase posterior arranca si la anterior no cumple el criterio de salida.

### Fase A — Calendario (cero riesgo de WhatsApp)

**No está implementada.** Existen `madre-csv.ts`, un piloto de 50 alumnos (`madre-simplybook-pilot.ts`) y seeds de providers/bookings. **No** existen los scripts que pide la migración: `madre-report`, `madre-load`, `simplybook-prepare`, `import-clients`, `import-madre`, `reconcile`. Estimación honesta: semanas de trabajo de datos, no “ejecutar un plan ya escrito”.

Prerrequisito, no riesgo: **verificar el plan y la cuota de bookings de `academiadg`** en el panel. La cifra “~500/mes Standard” salió de la lista pública de SimplyBook, no de esta cuenta. La migración estima ~3.500 POST para 6 semanas: si hay tope, choca aquí.

Orden:

1. Informe de la madre (bloqueantes vs importables).
2. Decisiones de academia (RS/PR dos sedes, huecos mezclados, Sin profe). Email opcional: ejecutar en UI.
3. T1.1 catálogo. **T1.2 (mezcla de servicios en un hueco) bloquea la ventana completa** y condiciona el copy del recordatorio. Cerrar T1.2 **antes** de la fase B.
4. Personas, no teléfonos.
5. Una semana, tres huecos, undo, notificaciones SimplyBook apagadas.
6. Ventana 6 semanas + reconcile. José opera excepciones solo en SimplyBook.

**Salida:** una semana laboral en la que José no necesitó la planilla, con muestreo vs cancha.

### Fase B — Ensayo de bandeja (número de prueba + Instagram)

En paralelo a A cuando A ya tiene al menos el piloto estable.

1. Diego atiende Instagram solo en Chatwoot.
2. **Cambiar el default del bot a silencio** (`decide`: sin intención → ignore, no menu) y una **allowlist en código** (hoy no existe), con test. Sin eso no hay fase B seria.
3. Ensayar widget, handoff, plantillas de la WABA de **prueba**.
4. Job de recordatorio en seco: SimplyBook “mañana” vs lo que José mandaría a las 15:00.

La WABA de pruebas estuvo `BLOCKED` (pago + negocio no verificado) el 2026-09-13. Si no se desbloquea, el ensayo de plantillas no corre; no se finge. Si el corte es D2, el WABA nuevo hereda el mismo tipo de bloqueo hasta verificar negocio y método de pago.

**Salida:** un día de Instagram sin salir de Chatwoot; job ≥95 % vs SimplyBook en reservas de un solo teléfono; bot mudo si hay humano o si el número no está allowlisted.

### Fase C — Archivo de Kapso (**antes** de la fase D)

D puede romper el acceso. Exportar ahora, no el día del corte.

1. Contactos, conversaciones, mensajes, plantillas, broadcasts → dump frío.
2. Snapshot Firebase `agente_v1/anotaciones`.
3. Inventario verificable de plantillas y de `subscribed_apps` / partners / credit lines.

**Salida:** se puede buscar un hilo viejo sin entrar a Kapso. Las plantillas están listadas.

### Fase D — Investigación Meta (bloquea la fecha)

Entregable: este ADR ya existe; las **puertas** de abajo no.

1. Dueño del WABA, partners, credit line, `GET /{waba}/subscribed_apps`, `GET /{phone}?fields=webhook_configuration`.
2. Intento de sombra: `POST /{waba}/subscribed_apps` con la app de la academia, sin Embedded Signup, sin override de número. Un mensaje de prueba. ¿Kapso sigue? ¿La academia recibe?
3. Si sí: Worker de solo lectura → Chatwoot **API inbox**. Diego no contesta por Chatwoot. Días, no horas.
4. Si no: no hay sombra; el corte de E es de minutos con rollback solo mientras Kapso siga siendo partner.
5. Display name LIMITED: en paralelo, no el día del corte.
6. Runbook de rollback (devolver override a Kapso **solo** si sigue el partner).

**Salida:** párrafo escrito D1 o D2, con las tres preguntas de la §5. Sombra en marcha o explícitamente descartada.

### Fase E — Corte del número (una ventana)

1. Fase A viva (José operó SimplyBook esa semana).
2. Tandas ~15:00 pausadas o mandadas **antes** por Kapso.
3. AgentBot **desenganchado** del inbox de producción. Default: todo a Diego.
4. Precargar contactos con `madre-chatwoot-contacts.ts` al inbox nuevo.
5. Inbox Chatwoot **WhatsApp Cloud nativo** (Phone Number ID + token de system user de la academia). No Embedded Signup si estamos en D1 y queremos no rotar el partner a ciegas.
6. Mensaje de prueba: entra, Diego responde, el alumno lo ve.
7. **Coexistence:** paso numerado, no un riesgo al margen. O se desconecta la Business App de ese número **antes** de que los humanos usen Chatwoot, o se acepta que Chatwoot verá `smb_message_echoes` como salientes del propio número y **nadie contesta desde el celular**.
8. Recién ahí se revoca Kapso / se apaga su webhook.
9. Railway deja de recibir. La libreta deja de pintar.
10. Kapso 14–30 días de **solo lectura**.

**Salida (48 h):** inbound llega; cero mensajes del bot a la base; plantilla de prueba a 5 allowlisted; Railway sin renglones nuevos.

### Fase F — Recordatorios y bot, número ya en Chatwoot

1. Job 15:00: SimplyBook → plantillas por Chatwoot. Sustituye `envios.html`.
2. AgentBot solo para desconocidos o pending-bot (silencio + allowlist ya en código desde B).
3. Confirmar/reprogramar: enlace si hay **exactamente una** reserva próxima para ese teléfono; si no, humano.
4. Apagar Kapso, Railway, `anotar-en-libreta-firebase`. Planilla in freeze.

**Las primeras dos semanas en producción: solo humanos y plantillas.** Enganchar el bot el día 1 es el incidente de P8.

---

## 8. Datos: transferir / archivar / perder

| Dato | Destino |
|---|---|
| Alumnos | SimplyBook + `client_map`. Filas bloqueantes no se cargan hasta que la academia decida. |
| Clases fijas | Reservas SimplyBook. Por eso A termina antes de E. |
| Verdes/azules | Archivo Firebase. El hábito se reemplaza con el calendario de SimplyBook, no con software. |
| Hilos WhatsApp | Archivo Kapso. Chatwoot nace sin historia. No importar (media caduca, 31 teléfonos compartidos). |
| Plantillas | Mismo WABA (D1) o re-aprobación (D2). |
| Instagram | Ya en Chatwoot. |

Menores: archivo y Chatwoot CE viven en infra de Alejandro. Encargo (quién borra, retención) **antes** de C.

---

## 9. Qué se rechaza

| Camino | Por qué |
|---|---|
| Puente bidireccional como destino | No elimina Kapso. |
| Embedded Signup “para probar” sobre el número vivo | Partner switch / `2655093` / pisa override. |
| Portar Railway al AgentBot | Software para la planilla que apagamos. |
| WhatsApp de créditos SimplyBook | Otro número; respuestas fuera de Chatwoot. |
| Client Login | No enciende avisos. |
| Dos calendarios editables | Doble verdad. |
| Cortar Kapso antes de una semana viva en SimplyBook | Hueco operativo. |

Si la academia insiste en ver verde, el plan tiene que decir en voz alta que se reconstruye Railway contra Chatwoot. Eso está prohibido por el principio 2.

---

## 10. Respuestas a las cinco preguntas

1. **D1 sobre número nuevo, sin discusión.** La pregunta real son las tres de la §5, no solo “dueño”.
2. **Corte corto mejor que puente largo.** Si la doble suscripción funciona, es sombra de días + corte de minutos. Eso es más seguro con un operador que no está 24/7. Si no funciona, se corta en minutos, no se inventa un puente de semanas.
3. **Chatwoot sin historial.** Archivo frío + Kapso read-only 14–30 días. Exportar **antes de D**.
4. **Solo humanos y plantillas las primeras dos semanas.** El bot habla por defecto y no tiene allowlist en código.
5. **No hay motivo de negocio para la libreta** salvo el hábito de José. Se reemplaza con SimplyBook, no con un clasificador nuevo.

---

## 11. Puertas (ADR 0007)

Un agente **no** mueve el número de producción, no hace Embedded Signup sobre ese WABA y no engancha el AgentBot al inbox vivo hasta que:

- [ ] Plan y cuota de SimplyBook `academiadg` verificados en el panel.
- [ ] T1.2 anotado (acepta / rechaza mezcla de servicios).
- [ ] Una semana viva en SimplyBook (criterio de A).
- [ ] Bot: default silencio + allowlist en código, con test.
- [ ] Export Kapso + inventario de plantillas y `subscribed_apps` en frío.
- [ ] Párrafo D1/D2 con las tres preguntas, escrito.
- [ ] Coexistence: desconectar o regla explícita “nadie contesta por el celular”.
- [ ] AgentBot desenganchado el día del corte.

Hasta entonces el piloto sigue en `+595971638427` y el inbox 4.
