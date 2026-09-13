# Conflictos de la planilla madre — Academia DG

Documento de trabajo para **administración**. Fecha de la madre: **2026-09-13**. Contiene nombres, teléfonos e IDs de alumnos: **no publicar**, no mandar a un chat grupal, no pegar en un GPT público si la cuenta no es de la academia.

Sirve para cerrar, uno por uno, lo que impide pasar las clases fijas a SimplyBook. Cada ítem tiene un código (`A01`, `B03`…) y un renglón `Decisión:` para escribir la respuesta. Al final hay una hoja compacta para copiar y pegar.

Si trabaja con una IA: adjunte este archivo y pídale que recorra un bloque por vez, que proponga y que **espere confirmación** antes de rellenar. Las instrucciones para esa IA están en la sección siguiente.

Códigos de profe: FL Fernando Laval · JM Jose Mongelos · MP Matias Popovich · PR Pablo Recalde · VA Viani Alfonzo · RS Rodolfo Silva · TE Tati Enciso · RA Rodrigo Avila · ChG Sergio González · MF Mathias Fernandez · OB Olga Bareiro.

---

## Cómo usarlo (administración)

1. Empiece por el **bloque A**. Sin eso SimplyBook no puede armar el horario de Rodolfo y de Pablo.
2. Siga **B** (fichas dobles). Es un sí/no por persona.
3. **C** es solo confirmar familias: no se unen.
4. **D** y **E** arman el tipo de cada hueco (grupal / dual / individual).
5. **F** son filas que hoy **no se cargan** (sin profe, sin sede, sin tipo).
6. **G** se puede cargar a medias (sin teléfono, sin categoría). Hágalo después.

En cada ítem elija una letra de **Opciones** y complete lo que pida (otro profe, sede, tipo). Si la realidad no entra en las letras, escriba `Otra:` y el texto.

Cuando un bloque esté cerrado, márquelo en el [tablero](#tablero).

---

## Cómo usarlo (IA que asiste al administrador)

Sos el asistente de administración de Academia DG. Tu único trabajo es **cerrar este documento** con decisiones del humano, no reescribir la planilla vos.

Reglas:

- No inventes alumnos, IDs, teléfonos, profes ni horarios. Si no está en este archivo, preguntá.
- No fusiones dos personas porque compartan teléfono (bloque C). Solo se unen las fichas del bloque B si el admin dice UNIR.
- Un profe de carne y hueso no puede estar en Elite y Lomas a la misma hora. La opción `2` (dos agendas en SimplyBook) es un truco de software, no un segundo cuerpo.
- No elijas por el admin en el bloque A cuando hay más de 4 alumnos en total. Ahí hay que sacar gente o partir agendas.
- En D y E, si el admin dice “es un dual con X”, anotás a X aunque X no esté en esa fila.
- Trabajá **un ítem por turno** al principio (A01, después A02…). Si el admin dice “mismo criterio para todos los RS que no superan 4”, aplicá ese criterio a esos ítems y listá lo que marcaste.
- Formato de cada turno: código del ítem, el conflicto en una frase, tu recomendación con letra, por qué, y la pregunta exacta. No vuelvas a pegar la tabla entera si el admin ya la tiene.
- Cuando confirme, escribí la línea `Decisión:` tal cual debe quedar y actualizá el tablero.
- Al terminar un bloque, devolvé la **hoja compacta** de ese bloque (código: decisión) para que la copien.

Recomendaciones por defecto (solo sugerencia; el admin manda):

- B: **UNIR** (misma persona, ficha grupal + ficha individual). Pedro Aguero → `A0538`.
- C: **OK** (personas distintas).
- E: si el alumno aparece en el bloque C con otra persona en el mismo hueco, sugerí que esa persona es la pareja.
- G 6.5 (Santiago Serrati): sugerí **Sexta**, no lo des por cerrado.

---

## Tablero

| Bloque | Qué es | Cantidad | Cierra la carga | Estado |
|---|---|---|---|---|
| A | Profe en dos sedes a la misma hora | 12 horas (5 superan 4 alumnos) | Sí | pendiente |
| B | Ficha partida / sin ID | 6 personas + Pedro Aguero | Sí (identidad) | pendiente |
| C | Teléfono de familia | 31 teléfonos | No (no unir) | pendiente |
| D | Hueco con tipos mezclados | 54 huecos | Sí, si SimplyBook rechaza el mix | pendiente |
| E | Dual sin pareja | 49 huecos | No, pero el cupo queda mal | pendiente |
| F1 | Sin profe | 67 filas / 32 huecos | Sí: no se cargan | pendiente |
| F2 | Sede A Definir | 15 filas | Sí: no se cargan | pendiente |
| F3 | Sin modalidad ni tipo | 60 filas | Sí: no se cargan | pendiente |
| G1 | Sin teléfono | 34 personas | No: se crean igual | pendiente |
| G2 | Sin categoría | 132 alumnos | No en fase 1 | pendiente |
| G3 | Categoría 6.5 | 1 alumno | Elegir valor de Nivel | pendiente |
| G4 | Categorías mezcladas graves | 25 huecos | No | pendiente |

---

## Bloque A — Un profe en dos sedes a la misma hora

SimplyBook tiene **un horario y un cupo por profe**, sin sede. Si Rodolfo está en Elite y en Lomas a las 17:00, el sistema ve un solo montón de alumnos. Con cupo 4, en las horas marcadas **SUPERA 4** alguien queda afuera.

Opciones para cada ítem:

| Letra | Significado |
|---|---|
| `E` | El profe se queda en **Elite**. Hay que decir qué pasa con Lomas (otro profe, o se borra). |
| `L` | El profe se queda en **Lomas**. Hay que decir qué pasa con Elite. |
| `2` | Dos agendas en SimplyBook (`Rodolfo Silva · Elite` y `Rodolfo Silva · Lomas`). Mismo humano, dos cupos. |
| `R` | Reubicar una de las dos tandas a **otro profe** (indicar código). |
| `X` | Eso no es clase / borrar de la madre. |

Si elige `E` o `L`, complete `Lomas:` o `Elite:` con el profe nuevo o `borrar`.

### A01 · Lunes 13:00 · RS Rodolfo Silva · 2 alumnos
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Eber Taveira | A0174 | Grupal | 8 |
| Lomas | David Stegens | A0151 | Individual | — |
> Cupo total ≤ 4. Si confirma que el profe va a una sola sede, `E` o `L`. Si realmente da las dos, `2`.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A02 · Lunes 15:00 · RS Rodolfo Silva · 4 alumnos
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Julieta Zeballos | A0337 | Grupal | 7 |
| Elite | Lionel Amarilla | A0365 | Grupal | 7 |
| Lomas | Coral Warkentin | A0125 | Grupal | 4 |
| Lomas | Giovanni Bogado | A0876 | Grupal | — |
> Cupo total ≤ 4. Si confirma que el profe va a una sola sede, `E` o `L`. Si realmente da las dos, `2`.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A03 · Martes 16:00 · RS Rodolfo Silva · 5 alumnos · **SUPERA 4**
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Dan Herschkowicz | A0135 | Grupal | 7 |
| Lomas | Alexa Diesel | A0029 | Grupal | P |
| Lomas | Olivia Diesel | A0494 | Grupal | P |
| Lomas | Queralt Gebhardt | A0544 | Grupal | P |
| Lomas | Rafaela Angulo | A0545 | Grupal | P |
> No hay default: hay que partir agendas (`2`), reubicar (`R`) o sacar alumnos. Con un solo cupo de 4 no entran.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A04 · Martes 17:00 · RS Rodolfo Silva · 8 alumnos · **SUPERA 4**
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Jeronimo Maldonado | A0287 | Grupal | 7 |
| Elite | Mathias Sanchez | A0434 | Grupal | 7 |
| Elite | Patricio Escobar | A0529 | Grupal | 7 |
| Elite | Rodrigo Mereles | A0567 | Grupal | 6 |
| Lomas | Bastian Santander | A0084 | Grupal | — |
| Lomas | Benjamin Santander | A0089 | Grupal | — |
| Lomas | Hugo Meza | A0745 | Grupal | 7 |
| Lomas | Mateo Meza | A0746 | Grupal | 8 |
> No hay default: hay que partir agendas (`2`), reubicar (`R`) o sacar alumnos. Con un solo cupo de 4 no entran.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A05 · Miercoles 16:00 · RS Rodolfo Silva · 3 alumnos
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Francisco Doldan | A0216 | Grupal | 8 |
| Elite | Piero Battilana | A0540 | Grupal | 8 |
| Lomas | Antonella Ebner | A0067 | Individual | P |
> Cupo total ≤ 4. Si confirma que el profe va a una sola sede, `E` o `L`. Si realmente da las dos, `2`.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A06 · Miercoles 17:00 · RS Rodolfo Silva · 4 alumnos
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Hugo Meza | A0745 | Grupal | 7 |
| Elite | Mateo Meza | A0746 | Grupal | 8 |
| Lomas | Ezequiel Quiroga | A0941 | Grupal | — |
| Lomas | Marcelito Centurión | A0939 | sin tipo | — |
> Cupo total ≤ 4. Si confirma que el profe va a una sola sede, `E` o `L`. Si realmente da las dos, `2`.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A07 · Jueves 15:00 · RS Rodolfo Silva · 2 alumnos
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Nicole Massa | A0909 | sin tipo | — |
| Lomas | Giovanni Bogado | A0876 | Grupal | — |
> Cupo total ≤ 4. Si confirma que el profe va a una sola sede, `E` o `L`. Si realmente da las dos, `2`.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A08 · Jueves 16:00 · RS Rodolfo Silva · 5 alumnos · **SUPERA 4**
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Diego Heisecke | A0165 | Grupal | P |
| Lomas | Alexa Diesel | A0029 | Grupal | P |
| Lomas | Olivia Diesel | A0494 | Grupal | P |
| Lomas | Queralt Gebhardt | A0544 | Grupal | P |
| Lomas | Rafaela Angulo | A0545 | Grupal | P |
> No hay default: hay que partir agendas (`2`), reubicar (`R`) o sacar alumnos. Con un solo cupo de 4 no entran.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A09 · Jueves 17:00 · RS Rodolfo Silva · 5 alumnos · **SUPERA 4**
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Martin Morinigo | A0429 | Grupal | P |
| Elite | Rodrigo Lee GRUPAL | A0705 | Grupal | 7 |
| Elite | Romina Lee GRUPAL | A0706 | Grupal | 7 |
| Lomas | Guido Ferreira | A0247 | Dual | 8 |
| Lomas | Pablo Mercado GRUPAL | A0704 | Grupal | 8 |
> No hay default: hay que partir agendas (`2`), reubicar (`R`) o sacar alumnos. Con un solo cupo de 4 no entran.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A10 · Viernes 16:00 · RS Rodolfo Silva · 4 alumnos
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Dan Herschkowicz | A0135 | Grupal | 7 |
| Elite | Eitan Singer | A0178 | Grupal | 7 |
| Elite | Juan Viedma | A0333 | Grupal | 6 |
| Lomas | Coral Warkentin | A0125 | Grupal | 4 |
> Cupo total ≤ 4. Si confirma que el profe va a una sola sede, `E` o `L`. Si realmente da las dos, `2`.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A11 · Viernes 17:00 · RS Rodolfo Silva · 4 alumnos
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Hugo Meza | A0745 | Grupal | 7 |
| Elite | Rodrigo Mereles | A0567 | Grupal | 6 |
| Elite | Thiago Gandolfo | A0631 | Grupal | 7 |
| Lomas | Marcelito Centurión | A0939 | sin tipo | — |
> Cupo total ≤ 4. Si confirma que el profe va a una sola sede, `E` o `L`. Si realmente da las dos, `2`.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

### A12 · Sabado 11:00 · PR Pablo Recalde · 7 alumnos · **SUPERA 4**
- [ ] Pendiente

| Sede | Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- | --- |
| Elite | Alejandro Lin | A0816 | Grupal | — |
| Elite | Joaquin Avila | A0296 | Grupal | P |
| Elite | Lorena Cho | A0818 | Grupal | — |
| Elite | Natalia Fretes | A0817 | Grupal | — |
| Lomas | Andrea Peralta | A0967 | Dual | — |
| Lomas | Andres Barrios | A0966 | Dual | — |
| Lomas | Patricia Peralta | A0526 | Dual | 8 |
> No hay default: hay que partir agendas (`2`), reubicar (`R`) o sacar alumnos. Con un solo cupo de 4 no entran.

Opciones: `E` · `L` · `2` · `R` · `X`

**Decisión:**
**Elite:**
**Lomas:**

---

## Bloque B — Fichas partidas (misma persona, dos IDs)

En la madre, algunos alumnos tienen una fila “Apellido GRUPAL” y otra “Apellido INDIVIDUAL” con IDs distintos. En SimplyBook tiene que existir **un cliente**. El ID menor queda como principal; el otro va en `other_ids`.

Opciones: `UNIR` · `NO` (son dos personas).

Default sugerido: **UNIR**.

### B01 · Alex Ebner
- [ ] Pendiente

Teléfono: `+595981994444`

**Ficha `A0028`** — Alex Ebner GRUPAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Lunes | 17:00 | Lomas | JM | Grupal |
| Jueves | 17:00 | Lomas | JM | Grupal |
**Ficha `A0564`** — Alex Ebner INDIVIDUAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Martes | 17:00 | Lomas | JM | Individual |
Opciones: `UNIR` (principal `A0028`, otro `A0564`) · `NO`

**Decisión:**

### B02 · Irmina Quintana
- [ ] Pendiente

Teléfono: `+595971730440`

**Ficha `A0750`** — Irmina Quintana GRUPAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Martes | 17:00 | Lomas | TE | Grupal |
| Viernes | 15:00 | Lomas | SP | Grupal |
**Ficha `A0268`** — Irmina Quintana INDIVIDUAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Jueves | 9:00 | Lomas | FL | Individual |
Opciones: `UNIR` (principal `A0268`, otro `A0750`) · `NO`

**Decisión:**

### B03 · John Swanston
- [ ] Pendiente

Teléfono: `+595981228870`

**Ficha `A0675`** — John Swanston GRUPAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Martes | 12:00 | Lomas | RA | Grupal |
**Ficha `A0302`** — John Swanston INDIVIDUAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Jueves | 12:00 | Lomas | RA | Individual |
Opciones: `UNIR` (principal `A0302`, otro `A0675`) · `NO`

**Decisión:**

### B04 · Pablo Mercado
- [ ] Pendiente

Teléfono: `+595983152019`

**Ficha `A0506`** — Pablo Mercado INDIVIDUAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Miercoles | 15:00 | Lomas | SP | Individual |
**Ficha `A0704`** — Pablo Mercado GRUPAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Jueves | 17:00 | Lomas | RS | Grupal |
| Sabado | 11:00 | Lomas | MF | Grupal |
| Sabado | 13:00 | Lomas | TE | Grupal |
Opciones: `UNIR` (principal `A0506`, otro `A0704`) · `NO`

**Decisión:**

### B05 · Rodrigo Lee
- [ ] Pendiente

Teléfono: `+595991502460`

**Ficha `A0705`** — Rodrigo Lee GRUPAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Lunes | 17:00 | Segurola Y Habana | PR | Grupal |
| Miercoles | 16:00 | Elite | ChG | Grupal |
| Jueves | 17:00 | Elite | RS | Grupal |
| Viernes | 17:00 | Segurola Y Habana | PR | Grupal |
| Sabado | 14:00 | Lomas | TE | Grupal |
**Ficha `A0566`** — Rodrigo Lee INDIVIDUAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Miercoles | 15:00 | Elite | RS | Individual |
Opciones: `UNIR` (principal `A0566`, otro `A0705`) · `NO`

**Decisión:**

### B06 · Romina Lee
- [ ] Pendiente

Teléfono: `+595991502460`

**Ficha `A0706`** — Romina Lee GRUPAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Lunes | 17:00 | Segurola Y Habana | PR | Grupal |
| Miercoles | 16:00 | Elite | ChG | Grupal |
| Jueves | 17:00 | Elite | RS | Grupal |
| Viernes | 17:00 | Segurola Y Habana | PR | Grupal |
| Sabado | 14:00 | Lomas | TE | Grupal |
**Ficha `A0575`** — Romina Lee INDIVIDUAL
| Día | Hora | Sede | Profe | Tipo |
| --- | --- | --- | --- | --- |
| Miercoles | 15:00 | Elite | ChG | Individual |
Opciones: `UNIR` (principal `A0575`, otro `A0706`) · `NO`

**Decisión:**

### B07 · Pedro Aguero sin ID

- [ ] Pendiente

Sábado 10:00 Lomas MF, nombre `Pedro Aguero`, **sin ID y sin teléfono**.

En la misma mañana, sábado 11:00 Lomas MF, está `Pedro Aguero GRUPAL` con ID **A0538** (cat 8), en un grupal con Guido Ferreira, Nestor Romero y Pablo Mercado.

Opciones: `UNIR` a `A0538` · `ID nuevo` (indicar) · `X` borrar la fila de las 10:00

**Decisión:**

---

## Bloque C — Un teléfono, dos personas (familias)

No es un error. El import **no** debe crear un solo cliente. Marque `OK` si son personas distintas, o `UNIR` si la planilla duplicó a alguien.

Default: **OK**.

### C01 · `+595971278410`
- [ ] Pendiente

Personas:
- **Fernando Cueto** (`A0207`) — 1 clase(s): Sabado 8:00 Elite SP
- **Gisselle Arias** (`A0237`) — 1 clase(s): Sabado 8:00 Elite SP

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C02 · `+595972123778`
- [ ] Pendiente

Personas:
- **Elian Corteguera** (`A0180`) — 1 clase(s): Miercoles 11:00 Elite RS
- **Paula Aranda** (`A0534`) — 1 clase(s): Miercoles 11:00 Elite RS

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C03 · `+595981103500`
- [ ] Pendiente

Personas:
- **Alzira Sanabria** (`A0040`) — 1 clase(s): Jueves 16:00 Elite ChG
- **Diego Heisecke** (`A0165`) — 2 clase(s): Jueves 16:00 Elite RS; Lunes 16:00 Lomas JM

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C04 · `+595981143917`
- [ ] Pendiente

Personas:
- **Lizzel Vergara** (`A0370`) — 1 clase(s): Sabado 8:00 Lomas VA
- **Tito Vera** (`A0500`) — 1 clase(s): Sabado 8:00 Lomas VA

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C05 · `+595981170163`
- [ ] Pendiente

Personas:
- **Mila Mieres Ugarte** (`A0461`) — 2 clase(s): Lunes 16:00 Segurola Y Habana FL; Miercoles 16:00 A Definir SP
- **Paola Ugarte** (`A0519`) — 1 clase(s): Viernes 8:00 Lomas VA

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C06 · `+595981400476`
- [ ] Pendiente

Personas:
- **Rafaela Angulo** (`A0545`) — 2 clase(s): Jueves 16:00 Lomas RS; Martes 16:00 Lomas RS
- **Silvana Scavone** (`A0610`) — 1 clase(s): Martes 15:00 Lomas JM

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C07 · `+595981402988`
- [ ] Pendiente

Personas:
- **Ana Avila** (`A0702`) — 1 clase(s): Jueves 16:00 A Definir SP
- **Joaquin Avila** (`A0296`) — 3 clase(s): Jueves 14:00 Segurola Y Habana PR; Martes 14:00 Segurola Y Habana PR; Sabado 11:00 Elite PR

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C08 · `+595981413952`
- [ ] Pendiente

Personas:
- **Pablo Orichio** (`A0507`) — 1 clase(s): Sabado 9:00 Lomas PR
- **Sofia Benza** (`A0616`) — 1 clase(s): Sabado 9:00 Lomas PR

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C09 · `+595981522098`
- [ ] Pendiente

Personas:
- **Jose Cantero** (`A0311`) — 3 clase(s): Jueves 11:00 Elite RS; Miercoles 6:00 Lomas FL; Sabado 10:00 Segurola Y Habana FL
- **Maxi Cantero** (`A0447`) — 1 clase(s): Sabado 9:00 Segurola Y Habana RS

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C10 · `+595981591059`
- [ ] Pendiente

Personas:
- **Antonella Wasmosy** (`A0070`) — 2 clase(s): Lunes 17:00 Lomas OB; Viernes 17:00 Lomas RA
- **Enzo Wasmosy** (`A0923`) — 1 clase(s): Lunes 17:00 Lomas OB

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C11 · `+595981768333`
- [ ] Pendiente

Personas:
- **Ana Gonzalez** (`A0047`) — 1 clase(s): Miercoles 16:00 Lomas JM
- **Federico Oviedo** (`A0203`) — 1 clase(s): Miercoles 16:00 Lomas JM

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C12 · `+595981821018`
- [ ] Pendiente

Personas:
- **Antonella Ebner** (`A0067`) — 4 clase(s): Jueves 16:00 Lomas RA; Martes 15:00 Lomas RS; Miercoles 16:00 Lomas RS; Viernes 14:00 Lomas SP
- **Mia Ebner** (`A0453`) — 5 clase(s): Jueves 16:00 Lomas MF; Lunes 16:00 Lomas TE; Martes 16:00 Lomas TE; Miercoles 16:00 Lomas SP; Viernes 14:00 Lomas MF

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C13 · `+595981879473`
- [ ] Pendiente

Personas:
- **Karen Zapata** (`A0341`) — 1 clase(s): Martes 17:00 Lomas TE
- **Pablo Salinas** (`A0509`) — 1 clase(s): Martes 17:00 Lomas TE

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C14 · `+595981919981`
- [ ] Pendiente

Personas:
- **Sofia Gonzalez** (`A0981`) — 2 clase(s): Jueves 17:00 Segurola Y Habana FL; Martes 17:00 Segurola Y Habana FL
- **Violeta Del Puerto** (`A0975`) — 2 clase(s): Jueves 17:00 Segurola Y Habana FL; Martes 17:00 Segurola Y Habana FL

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C15 · `+595981954957`
- [ ] Pendiente

Personas:
- **Ami Nakagoe** (`A0042`) — 1 clase(s): Viernes 16:00 Segurola Y Habana FL
- **Noriyuki Watanabe** (`A0488`) — 1 clase(s): Viernes 16:00 Segurola Y Habana PR

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C16 · `+595982204072`
- [ ] Pendiente

Personas:
- **Maria Paz Romero** (`A0419`) — 1 clase(s): Sabado 11:00 Elite SP
- **Nestor Romero** (`A0476`) — 1 clase(s): Sabado 11:00 Lomas MF

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C17 · `+595982241484`
- [ ] Pendiente

Personas:
- **Celeste González** (`A0113`) — 1 clase(s): Sabado 9:00 A Definir SP
- **Luciana Planas** (`A0679`) — 2 clase(s): Jueves 16:00 A Definir SP; Martes 16:00 A Definir SP

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C18 · `+595982340164`
- [ ] Pendiente

Personas:
- **Hugo Meza** (`A0745`) — 4 clase(s): Lunes 17:00 Segurola Y Habana PR; Martes 17:00 Lomas RS; Miercoles 17:00 Elite RS; Viernes 17:00 Elite RS
- **Mateo Meza** (`A0746`) — 4 clase(s): Lunes 17:00 Lomas VA; Martes 17:00 Lomas RS; Miercoles 17:00 Elite RS; Viernes 17:00 Segurola Y Habana FL

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C19 · `+595982439208`
- [ ] Pendiente

Personas:
- **Andres Marti** (`A0819`) — 2 clase(s): Miercoles 16:00 Elite ChG; Sabado 14:00 Lomas TE
- **Enzo Marti** (`A0187`) — 2 clase(s): Miercoles 15:00 Lomas SP; Sabado 9:00 Segurola Y Habana FL

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C20 · `+595983362685`
- [ ] Pendiente

Personas:
- **Agostina Rodas** (`A0006`) — 2 clase(s): Lunes 17:00 Lomas OB; Miercoles 17:00 Lomas VA
- **Nicolle Planas** (`A0481`) — 2 clase(s): Jueves 14:00 Lomas SP; Martes 14:00 Lomas TE

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C21 · `+595983436103`
- [ ] Pendiente

Personas:
- **Andrea Mongelos DUAL** (`A0707`) — 1 clase(s): Viernes 9:00 Lomas PR
- **Jose Carlos Brunetti** (`A0312`) — 1 clase(s): Viernes 9:00 Lomas PR

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C22 · `+595983489168`
- [ ] Pendiente

Personas:
- **Armindo Portillo** (`A0077`) — 1 clase(s): Martes 17:00 Segurola Y Habana PR
- **Gabriela Benitez** (`A0225`) — 1 clase(s): Martes 17:00 Segurola Y Habana PR

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C23 · `+595983757010`
- [ ] Pendiente

Personas:
- **Bastian Santander** (`A0084`) — 2 clase(s): Martes 17:00 Lomas RS; Viernes 16:00 Segurola Y Habana PR
- **Benjamin Santander** (`A0089`) — 2 clase(s): Martes 17:00 Lomas RS; Viernes 16:00 Segurola Y Habana PR

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C24 · `+595984107150`
- [ ] Pendiente

Personas:
- **Beltran Rodriguez** (`A0789`) — 2 clase(s): Martes 17:00 A Definir SP; Viernes 16:00 A Definir SP
- **Matias Rodriguez** (`A0790`) — 2 clase(s): Martes 17:00 A Definir SP; Viernes 16:00 A Definir SP

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C25 · `+595986105542`
- [ ] Pendiente

Personas:
- **Andrea Peralta** (`A0967`) — 1 clase(s): Sabado 11:00 Lomas PR
- **Andres Barrios** (`A0966`) — 1 clase(s): Sabado 11:00 Lomas PR

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C26 · `+595986546412`
- [ ] Pendiente

Personas:
- **Daniel Schirmacher** (`A0840`) — 2 clase(s): Jueves 9:00 Lomas VA; Martes 9:00 Lomas PR
- **Natalia Schirmacher** (`A0841`) — 1 clase(s): Jueves 9:00 Lomas PR

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C27 · `+595991502460`
- [ ] Pendiente

Personas:
- **Rodrigo Lee INDIVIDUAL / Rodrigo Lee GRUPAL** (`A0566, A0705`) — 6 clase(s): Jueves 17:00 Elite RS; Lunes 17:00 Segurola Y Habana PR; Miercoles 15:00 Elite RS; Miercoles 16:00 Elite ChG; Sabado 14:00 Lomas TE; Viernes 17:00 Segurola Y Habana PR
- **Romina Lee INDIVIDUAL / Romina Lee GRUPAL** (`A0575, A0706`) — 6 clase(s): Jueves 17:00 Elite RS; Lunes 17:00 Segurola Y Habana PR; Miercoles 15:00 Elite ChG; Miercoles 16:00 Elite ChG; Sabado 14:00 Lomas TE; Viernes 17:00 Segurola Y Habana PR

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C28 · `+595992433020`
- [ ] Pendiente

Personas:
- **Meir Herskowicz** (`A0451`) — 2 clase(s): Miercoles 17:00 Segurola Y Habana FL; Viernes 16:00 Segurola Y Habana PR
- **Ruth Singer** (`A0586`) — 2 clase(s): Jueves 14:00 Lomas VA; Martes 14:00 Lomas VA

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C29 · `+595994139707`
- [ ] Pendiente

Personas:
- **Jorge Bernal** (`A0304`) — 1 clase(s): Sabado 8:00 Lomas PR
- **Liz Roman** (`A0369`) — 1 clase(s): Sabado 8:00 Lomas PR

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C30 · `+595994256076`
- [ ] Pendiente

Personas:
- **Angela Rolon** (`A0063`) — 3 clase(s): Jueves 11:00 Lomas SP; Martes 11:00 Lomas TE; Miercoles 14:00 Lomas VA
- **Areia Benitez** (`A0902`) — 1 clase(s): Miercoles 14:00 Lomas VA

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

### C31 · `+595994767852`
- [ ] Pendiente

Personas:
- **Elisa Kim** (`A0182`) — 4 clase(s): Lunes 8:00 Lomas VA; Martes 16:00 Lomas MF; Miercoles 8:00 Lomas JM; Viernes 16:00 Lomas MF
- **Min A Han** (`A0462`) — 2 clase(s): Martes 16:00 Lomas MF; Viernes 16:00 Lomas MF

Opciones: `OK` (distintas) · `UNIR`

**Decisión:**

---

## Bloque D — Hueco con tipos mezclados

Mismo día, hora, sede y profe, pero unos están en Individual, otros Dual, otros Grupal. SimplyBook no “clava” el tipo del hueco: si el sistema acepta el mix, un suelto puede meter una individual encima de un grupal.

Opciones:

| Letra | Significado |
|---|---|
| `G` | Todo el hueco es **grupal**. Pasar a Grupal a quienes figuran dual/individual. |
| `D` | Todo el hueco es **dual** (2 alumnos). Reubicar o borrar al resto. |
| `I` | Todo el hueco es **individual**. Reubicar al resto. |
| `M` | **Aceptar el mix** (excepción). |
| `S` | **Separar**: indicar quién se mueve a otro profe/hora. |

Si elige `G`/`D`/`I` y hay que reubicar a alguien, nómbrelo en `Mover:`.

### D01 · Lunes 6:00 · Lomas · JM (Jose Mongelos) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Egidio Machado | A0970 | ∅ | D | Dual | — |
| Giusepe Ottonelli | A0241 | Grupal | G | Grupal | 5 |
| Jose Franco | A0971 | ∅ | D | Dual | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D02 · Lunes 7:00 · Lomas · MP (Matias Popovich) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Ariel Triderman | A0074 | Grupal | G | Grupal | 6 |
| Wilfried Ediger | A0664 | Dual | D | Dual | 7 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D03 · Lunes 8:00 · Lomas · JM (Jose Mongelos) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Alejandra Garcia Petty | A0018 | Dual | D | Dual | 3 |
| Nicole Heyn | A0915 | Grupal | ∅ | Grupal | 3 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D04 · Lunes 8:00 · Lomas · VA (Viani Alfonzo) · Dual, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Elisa Kim | A0182 | Dual | D | Dual | 8 |
| Gustavo Lopez | A0033 | Individual | IND | Individual | P |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D05 · Lunes 9:00 · Lomas · JM (Jose Mongelos) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Alejandra Garcia Petty | A0018 | Dual | D | Dual | 3 |
| Nicole Heyn | A0915 | Grupal | ∅ | Grupal | 3 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D06 · Lunes 11:00 · Lomas · TE (Tati Enciso) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Leslie Schaerer | A0357 | Grupal | G | Grupal | 7 |
| Oscar Elizeche | A0496 | Dual | D | Dual | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D07 · Lunes 16:00 · Lomas · RA (Rodrigo Avila) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Alejandro Goffa GRUPAL | A0852 | Grupal | G | Grupal | P |
| Giovanni Bogado | A0876 | Grupal | G | Grupal | — |
| Leonardo Bogado | A0356 | Dual | D | Dual | 5 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D08 · Lunes 16:00 · Lomas · TE (Tati Enciso) · Grupal, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Coral Warkentin | A0125 | Grupal | G | Grupal | 4 |
| Mia Ebner | A0453 | Individual | IND | Individual | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D09 · Lunes 17:00 · Lomas · TE (Tati Enciso) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Liliana Campuzano | A0362 | Dual | D | Dual | 7 |
| Patricia Fois Angulo | A0525 | Dual | D | Dual | 8 |
| Shirley Arce | A0604 | Grupal | G | Grupal | 7 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D10 · Lunes 17:00 · Lomas · VA (Viani Alfonzo) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Federico Galeano | A0202 | Grupal | G | Grupal | P |
| Lis Vera | A0899 | ∅ | D | Dual | — |
| Mateo Meza | A0746 | Grupal | G | Grupal | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D11 · Martes 9:00 · Lomas · PR (Pablo Recalde) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Daniel Schirmacher | A0840 | ∅ | D | Dual | — |
| Jazmin Arnold | A0778 | Grupal | G | Grupal | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D12 · Martes 10:00 · Lomas · JM (Jose Mongelos) · Dual, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Jesper Hallas | A0288 | Individual | IND | Individual | — |
| Paola Valeff | A0520 | Dual | D | Dual | P |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D13 · Martes 13:00 · Lomas · TE (Tati Enciso) · Dual, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Coty Caballero | A0127 | Individual | IND | Individual | 8 |
| Shirley Torres | A0605 | Dual | D | Dual | P |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D14 · Martes 14:00 · Lomas · RA (Rodrigo Avila) · Dual, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Ana Paleari | A0989 | ∅ | D | Dual | — |
| Carlos Duarte Reguera | A0880 | Individual | IND | Individual | — |
| Eugenia Celauro | A0991 | ∅ | D | Dual | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D15 · Martes 14:00 · Lomas · TE (Tati Enciso) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Leslie Schaerer | A0357 | Grupal | G | Grupal | 7 |
| Lisa Zanotti | A0366 | Dual | D | Dual | 7 |
| Nicolle Planas | A0481 | Grupal | G | Grupal | 7 |
| Paola Caner | A0513 | Grupal | G | Grupal | 7 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D16 · Martes 14:00 · Lomas · VA (Viani Alfonzo) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Maria Crespi | A0413 | Dual | D | Dual | 6 |
| Ruth Singer | A0586 | Grupal | G | Grupal | 7 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D17 · Martes 15:00 · Elite · ChG (Sergio González (Checho)) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Danna Benitez | A0146 | Grupal | G | Grupal | P |
| Leticia Sanchez | A0359 | Dual | D | Dual | P |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D18 · Martes 15:00 · Lomas · JM (Jose Mongelos) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Eleonora Scavone | A0179 | Grupal | G | Grupal | 6 |
| Giovanni Bogado | A0876 | Grupal | G | Grupal | — |
| Silvana Scavone | A0610 | Dual | D | Dual | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D19 · Martes 17:00 · Segurola Y Habana · FL (Fernando Laval) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Maria Sonia Arrellaga | A0420 | Grupal | G | Grupal | 7 |
| Sofia Gonzalez | A0981 | ∅ | D | Dual | — |
| Violeta Del Puerto | A0975 | ∅ | D | Dual | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D20 · Martes 17:00 · Lomas · TE (Tati Enciso) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Irmina Quintana GRUPAL | A0750 | Grupal | G | Grupal | — |
| Karen Zapata | A0341 | Dual | D | Dual | — |
| Pablo Salinas | A0509 | Dual | D | Dual | — |
| Paola Scavone | A0518 | Dual | D | Dual | 6 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D21 · Miercoles 6:00 · Lomas · FL (Fernando Laval) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Jose Cantero | A0311 | Dual | D | Dual | 6 |
| Rodrigo Olmedo | A0568 | Grupal | G | Grupal | 6 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D22 · Miercoles 7:00 · Lomas · FL (Fernando Laval) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Liza Mereles | A0791 | Dual | D | Dual | — |
| Mariela Ramirez | A0701 | Dual | D | Dual | — |
| Myrian Duarte | A0467 | Grupal | G | Grupal | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D23 · Miercoles 7:00 · Lomas · MP (Matias Popovich) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Ariel Triderman | A0074 | Grupal | G | Grupal | 6 |
| Carlos Orihuela | A0794 | Grupal | G | Grupal | — |
| Wilfried Ediger | A0664 | Dual | D | Dual | 7 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D24 · Miercoles 8:00 · Lomas · FL (Fernando Laval) · Dual, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Coti Urbieta | A0825 | ∅ | ∅ | sin tipo | — |
| Sol Barrientos | A0676 | Individual | IND | Individual | — |
| Sol Godoy | A0731 | Dual | D | Dual | P |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D25 · Miercoles 8:00 · Lomas · JM (Jose Mongelos) · Dual, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Elisa Kim | A0182 | Dual | D | Dual | 8 |
| Gustavo Lopez | A0033 | Individual | IND | Individual | P |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D26 · Miercoles 10:00 · Lomas · VA (Viani Alfonzo) · Grupal, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Facu Martinez | A0761 | Individual | IND | Individual | — |
| Nathalia Rolon | A0473 | Grupal | G | Grupal | 7 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D27 · Miercoles 13:00 · Lomas · SP (Sin profe) · Grupal, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| David Stegens | A0151 | Individual | IND | Individual | — |
| Rodrigo Trinidad INDIVIDUAL | A0572 | Grupal | G | Grupal | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D28 · Miercoles 14:00 · Lomas · JM (Jose Mongelos) · Grupal, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Lechu González | A0353 | Grupal | G | Grupal | 5 |
| Melissa Machado | A0957 | ∅ | IND | Individual | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D29 · Miercoles 14:00 · Lomas · VA (Viani Alfonzo) · Grupal, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Angela Rolon | A0063 | Grupal | G | Grupal | 8 |
| Areia Benitez | A0902 | ∅ | G | Grupal | — |
| Cesar Denis | A0751 | Individual | IND | Individual | 5 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D30 · Miercoles 15:00 · Elite · ChG (Sergio González (Checho)) · Grupal, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Maria Ines Torres | A0858 | Grupal | D | Grupal | — |
| Romina Lee INDIVIDUAL | A0575 | Individual | IND | Individual | 7 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D31 · Miercoles 15:00 · Lomas · RA (Rodrigo Avila) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Fabiola Franchi | A0944 | Dual | D | Dual | — |
| Joaquín Costas | A0888 | Grupal | G | Grupal | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D32 · Miercoles 15:00 · Lomas · SP (Sin profe) · Grupal, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Enzo Marti | A0187 | Grupal | G | Grupal | 4 |
| Jessica Mercado | A0290 | Grupal | G | Grupal | 8 |
| Maria Caballero | A0412 | Individual | IND | Individual | 6 |
| Pablo Mercado INDIVIDUAL | A0506 | Individual | IND | Individual | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D33 · Miercoles 16:00 · A Definir · SP (Sin profe) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Leonardo Bogado | A0356 | Dual | D | Dual | 5 |
| Mila Mieres Ugarte | A0461 | Grupal | G | Grupal | 7 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D34 · Miercoles 16:00 · Lomas · SP (Sin profe) · Dual, Grupal, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Coral Warkentin | A0125 | Grupal | G | Grupal | 4 |
| Liz Cantero | A0367 | Dual | D | Dual | 6 |
| Mia Ebner | A0453 | Individual | IND | Individual | 8 |
| Micaella Garcia | A0925 | ∅ | ∅ | sin tipo | — |
| Rebeca Julian | A0548 | ∅ | ∅ | sin tipo | 6 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D35 · Miercoles 17:00 · Lomas · JM (Jose Mongelos) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Celeste Portillo | A0114 | Dual | D | Dual | — |
| Rosti Veselinov | A0585 | Grupal | G | Grupal | 8 |
| Stefania Ortega | A0621 | Grupal | G | Grupal | 6 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D36 · Miercoles 17:00 · Lomas · SP (Sin profe) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Aleli Lopez | A0025 | Dual | D | Dual | 4 |
| Andres Garcia | A0061 | Grupal | G | Grupal | 7 |
| Jeronimo Maldonado | A0287 | Grupal | G | Grupal | 7 |
| Liz Cantero | A0367 | Dual | D | Dual | 6 |
| Mathias Sanchez | A0434 | Grupal | G | Grupal | 7 |
| Rodrigo Mereles | A0567 | Grupal | G | Grupal | 6 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D37 · Jueves 6:00 · Lomas · FL (Fernando Laval) · Dual, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Albert Gross Brown | A0010 | ∅ | D | Dual | 7 |
| Marina Baumann | A0807 | Individual | IND | Individual | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D38 · Jueves 8:00 · Lomas · FL (Fernando Laval) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Carolina Mendoza | A0108 | Grupal | G | Grupal | 6 |
| Maria Crespi | A0413 | Dual | D | Dual | 6 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D39 · Jueves 11:00 · Lomas · VA (Viani Alfonzo) · Dual, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Jesper Hallas | A0288 | Individual | IND | Individual | — |
| Raul Doria | A0914 | ∅ | D | Dual | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D40 · Jueves 12:00 · Lomas · RA (Rodrigo Avila) · Grupal, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| John Swanston INDIVIDUAL | A0302 | Individual | IND | Individual | 7 |
| Luis Martinez | A0384 | Grupal | G | Grupal | 6 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D41 · Jueves 14:00 · Lomas · JM (Jose Mongelos) · Dual, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Ana Paleari | A0989 | ∅ | D | Dual | — |
| Eugenia Celauro | A0991 | ∅ | D | Dual | — |
| Violeta Centurion | A0805 | Individual | IND | Individual | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D42 · Jueves 17:00 · Lomas · RS (Rodolfo Silva) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Guido Ferreira | A0247 | Dual | D | Dual | 8 |
| Pablo Mercado GRUPAL | A0704 | Grupal | G | Grupal | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D43 · Viernes 8:00 · Lomas · MF (Mathias Fernandez) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Alejandra Garcia Petty | A0018 | Dual | D | Dual | 3 |
| Nicole Heyn | A0915 | Grupal | ∅ | Grupal | 3 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D44 · Viernes 9:00 · Lomas · FL (Fernando Laval) · Dual, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Sol Barrientos | A0676 | Individual | IND | Individual | — |
| Sol Godoy | A0731 | Dual | D | Dual | P |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D45 · Viernes 9:00 · Lomas · MF (Mathias Fernandez) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Alejandra Garcia Petty | A0018 | Dual | D | Dual | 3 |
| Nicole Heyn | A0915 | Grupal | ∅ | Grupal | 3 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D46 · Viernes 11:00 · Lomas · SP (Sin profe) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Leslie Schaerer | A0357 | Grupal | G | Grupal | 7 |
| Oscar Elizeche | A0496 | Dual | D | Dual | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D47 · Viernes 14:00 · Lomas · VA (Viani Alfonzo) · Grupal, Individual
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Adriana Korpershoek | A0004 | Grupal | G | Grupal | 7 |
| Melissa Machado | A0957 | ∅ | IND | Individual | — |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D48 · Viernes 15:00 · Lomas · SP (Sin profe) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Irmina Quintana GRUPAL | A0750 | Grupal | G | Grupal | — |
| Paola Scavone | A0518 | Dual | D | Dual | 6 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D49 · Viernes 16:00 · Lomas · RA (Rodrigo Avila) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Alejandro Goffa GRUPAL | A0852 | Grupal | G | Grupal | P |
| Giselle Manzoni | A0695 | Dual | D | Dual | 8 |
| Magali Ibarra | A0694 | Dual | D | Dual | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D50 · Sabado 9:00 · Segurola Y Habana · FL (Fernando Laval) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Enzo Marti | A0187 | Grupal | G | Grupal | 4 |
| Magin Gomez | A0393 | Grupal | G | Grupal | 4 |
| Matias Sosa | A0440 | Dual | D | Dual | 4 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D51 · Sabado 10:00 · Segurola Y Habana · FL (Fernando Laval) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Esteban Candia | A0191 | Grupal | G | Grupal | 7 |
| Jose Cantero | A0311 | Dual | D | Dual | 6 |
| Rene Meza | A0553 | Grupal | G | Grupal | 7 |
| Rodrigo Olmedo | A0568 | Grupal | G | Grupal | 6 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D52 · Sabado 11:00 · Segurola Y Habana · FL (Fernando Laval) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Silvana Romero | A0609 | Grupal | G | Grupal | 6 |
| Tali Cárdenas | A0729 | Dual | D | Dual | 6 |
| Tamara Candia | A0846 | Grupal | G | Grupal | 7 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D53 · Sabado 11:00 · Lomas · MF (Mathias Fernandez) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Guido Ferreira | A0247 | Dual | D | Dual | 8 |
| Nestor Romero | A0476 | Grupal | G | Grupal | 8 |
| Pablo Mercado GRUPAL | A0704 | Grupal | G | Grupal | 8 |
| Pedro Aguero GRUPAL | A0538 | Grupal | G | Grupal | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

### D54 · Sabado 12:00 · Lomas · PR (Pablo Recalde) · Dual, Grupal
- [ ] Pendiente

| Alumno | ID | Modalidad | Tipo | Inferido | Cat |
| --- | --- | --- | --- | --- | --- |
| Daisi Mendez | A0134 | Dual | D | Dual | P |
| Jhonatan Maldonado | A0295 | Dual | D | Dual | P |
| Paloma Alonso | A0510 | Grupal | G | Grupal | — |
| Paola Espinola | A0514 | Grupal | G | Grupal | 8 |
Opciones: `G` · `D` · `I` · `M` · `S`

**Decisión:**
**Mover:**

---

## Bloque E — Dual sin pareja

Un solo alumno Dual en ese hueco. O le falta la pareja, o es un individual mal tipificado.

Opciones: `PAREJA` (nombre o ID de quien falta) · `I` pasar a individual · `G` pasar a grupal · `X` borrar.

### E01 · Lunes 11:00 · Lomas · JM
- [ ] Pendiente

- Raul Doria (`A0914`) · Dual · cat —
- Teléfono: +595974219201
- En planilla: Modalidad `∅`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E02 · Lunes 11:00 · Lomas · VA
- [ ] Pendiente

- Daniel Acosta (`A0137`) · Dual · cat 6
- Teléfono: +595981553854
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E03 · Lunes 12:00 · Elite · ChG
- [ ] Pendiente

- Carlos Dure (`A0101`) · Dual · cat —
- Teléfono: +595971108796
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E04 · Lunes 12:00 · Lomas · JM
- [ ] Pendiente

- Adrian Cuartas (`A0949`) · Dual · cat —
- Teléfono: +595981791579
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E05 · Lunes 12:00 · Lomas · RS
- [ ] Pendiente

- Luis Rojas (`A0387`) · Dual · cat 7
- Teléfono: +595992589510
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E06 · Lunes 13:00 · Lomas · TE
- [ ] Pendiente

- José Alejandro Morao (`A0955`) · Dual · cat —
- Teléfono: +595991708488
- En planilla: Modalidad `∅`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E07 · Lunes 14:00 · Lomas · TE
- [ ] Pendiente

- Delfina Urdampilleta (`A0152`) · Dual · cat —
- Teléfono: —
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E08 · Lunes 15:00 · Lomas · TE
- [ ] Pendiente

- Fabiola Franchi (`A0944`) · Dual · cat —
- Teléfono: —
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E09 · Martes 6:00 · Lomas · PR
- [ ] Pendiente

- Albert Gross Brown (`A0010`) · Dual · cat 7
- Teléfono: +595981864874
- En planilla: Modalidad `∅`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E10 · Martes 7:00 · Lomas · JM
- [ ] Pendiente

- Crispin Trinthammer (`A0129`) · Dual · cat 5
- Teléfono: +595984256722
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E11 · Martes 8:00 · Lomas · PR
- [ ] Pendiente

- Cesar Fretes (`A0115`) · Dual · cat 5
- Teléfono: +595981998348
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E12 · Martes 11:00 · Lomas · MF
- [ ] Pendiente

- Larissa Recalde (`A0349`) · Dual · cat 6
- Teléfono: +595971715500
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E13 · Martes 11:00 · Elite · RS
- [ ] Pendiente

- Alejandra Arguello (`A0017`) · Dual · cat 8
- Teléfono: +595971444734
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E14 · Martes 12:00 · Lomas · MF
- [ ] Pendiente

- Hugo Corrales (`A0258`) · Dual · cat 8
- Teléfono: +595981144147
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E15 · Martes 12:00 · Lomas · VA
- [ ] Pendiente

- María Lucy Medina (`A0689`) · Dual · cat —
- Teléfono: +595981509440
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E16 · Martes 13:00 · Lomas · JM
- [ ] Pendiente

- Valerie Barrail (`A0646`) · Dual · cat —
- Teléfono: +595981933338
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E17 · Martes 13:00 · Lomas · VA
- [ ] Pendiente

- Luciano Zampedri (`A0906`) · Dual · cat —
- Teléfono: —
- En planilla: Modalidad `∅`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E18 · Martes 16:00 · Elite · ChG
- [ ] Pendiente

- India Rojas (`A0267`) · Dual · cat 8
- Teléfono: +595981470312
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E19 · Miercoles 6:00 · Lomas · MP
- [ ] Pendiente

- Luis Rojas (`A0387`) · Dual · cat 7
- Teléfono: +595992589510
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E20 · Miercoles 6:00 · Lomas · PR
- [ ] Pendiente

- Ximena Ramirez (`A0823`) · Dual · cat —
- Teléfono: +595991757928
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E21 · Miercoles 8:00 · Elite · RS
- [ ] Pendiente

- Lorena Fridman (`A0373`) · Dual · cat P
- Teléfono: +595982712610
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E22 · Miercoles 11:00 · Elite · ChG
- [ ] Pendiente

- Marian Ruiz (`A0806`) · Dual · cat —
- Teléfono: +595991321107
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E23 · Miercoles 11:00 · Lomas · SP
- [ ] Pendiente

- Juan Pablo Angulo (`A0328`) · Dual · cat 8
- Teléfono: +595986611001
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E24 · Miercoles 12:00 · Segurola Y Habana · FL
- [ ] Pendiente

- Alu Espinola (`A0036`) · Dual · cat 7
- Teléfono: +595981590006
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E25 · Jueves 6:00 · Elite · RS
- [ ] Pendiente

- Diego Romero (`A0170`) · Dual · cat 7
- Teléfono: +595971950216
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E26 · Jueves 8:00 · Lomas · MP
- [ ] Pendiente

- Cesar Fretes (`A0115`) · Dual · cat 5
- Teléfono: +595981998348
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E27 · Jueves 9:00 · Lomas · VA
- [ ] Pendiente

- Daniel Schirmacher (`A0840`) · Dual · cat —
- Teléfono: +595986546412
- En planilla: Modalidad `∅`, Tipo `D`
- Mismo teléfono que: Natalia Schirmacher (`A0841`) — ¿es la pareja?

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E28 · Jueves 11:00 · Elite · ChG
- [ ] Pendiente

- Sol Godoy (`A0731`) · Dual · cat P
- Teléfono: +595982931761
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E29 · Jueves 11:00 · Lomas · MF
- [ ] Pendiente

- Larissa Recalde (`A0349`) · Dual · cat 6
- Teléfono: +595971715500
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E30 · Jueves 11:00 · Lomas · PR
- [ ] Pendiente

- Daniel Acosta (`A0137`) · Dual · cat 6
- Teléfono: +595981553854
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E31 · Jueves 11:00 · Elite · RS
- [ ] Pendiente

- Jose Cantero (`A0311`) · Dual · cat 6
- Teléfono: +595981522098
- En planilla: Modalidad `Dual`, Tipo `D`
- Mismo teléfono que: Maxi Cantero (`A0447`) — ¿es la pareja?

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E32 · Jueves 12:00 · Elite · ChG
- [ ] Pendiente

- Carlos Dure (`A0101`) · Dual · cat —
- Teléfono: +595971108796
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E33 · Jueves 12:00 · Lomas · MF
- [ ] Pendiente

- Hugo Corrales (`A0258`) · Dual · cat 8
- Teléfono: +595981144147
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E34 · Jueves 12:00 · Lomas · VA
- [ ] Pendiente

- María Lucy Medina (`A0689`) · Dual · cat —
- Teléfono: +595981509440
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E35 · Jueves 14:00 · Lomas · RA
- [ ] Pendiente

- Alexander Alcaraz (`A0910`) · Dual · cat —
- Teléfono: +595972205198
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E36 · Jueves 15:00 · Elite · ChG
- [ ] Pendiente

- Leticia Sanchez (`A0359`) · Dual · cat P
- Teléfono: +595994981309
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E37 · Jueves 15:00 · Segurola Y Habana · PR
- [ ] Pendiente

- Kino Bernabeu (`A0344`) · Dual · cat P
- Teléfono: —
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E38 · Viernes 8:00 · Lomas · MP
- [ ] Pendiente

- Sebastian Van Kuyk DUAL (`A0739`) · Dual · cat —
- Teléfono: —
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E39 · Viernes 8:00 · Lomas · VA
- [ ] Pendiente

- Paola Ugarte (`A0519`) · Dual · cat 6
- Teléfono: +595981170163
- En planilla: Modalidad `Dual`, Tipo `D`
- Mismo teléfono que: Mila Mieres Ugarte (`A0461`) — ¿es la pareja?

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E40 · Viernes 9:00 · Lomas · VA
- [ ] Pendiente

- Jazmin Larreinegabe (`A0845`) · Dual · cat —
- Teléfono: +595981430348
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E41 · Viernes 12:00 · Segurola Y Habana · FL
- [ ] Pendiente

- Alu Espinola (`A0036`) · Dual · cat 7
- Teléfono: +595981590006
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E42 · Viernes 12:00 · Lomas · VA
- [ ] Pendiente

- Adrian Cuartas (`A0949`) · Dual · cat —
- Teléfono: +595981791579
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E43 · Viernes 14:00 · Elite · RS
- [ ] Pendiente

- Lorena Fridman (`A0373`) · Dual · cat P
- Teléfono: +595982712610
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E44 · Viernes 15:00 · Elite · RS
- [ ] Pendiente

- Maria Ines Torres (`A0858`) · Dual · cat —
- Teléfono: +595971205088
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E45 · Viernes 17:00 · Lomas · SP
- [ ] Pendiente

- Camila Alcaraz (`A0096`) · Dual · cat 5
- Teléfono: +595986263259
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E46 · Sabado 7:00 · Lomas · MF
- [ ] Pendiente

- Victor Cardozo (`A0653`) · Dual · cat 7
- Teléfono: +595982539000
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E47 · Sabado 7:00 · Elite · SP
- [ ] Pendiente

- Rolf Gebhardt (`A0574`) · Dual · cat 7
- Teléfono: +595981478860
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E48 · Sabado 8:00 · Lomas · MF
- [ ] Pendiente

- Romina Lugo (`A0576`) · Dual · cat P
- Teléfono: +595971997858
- En planilla: Modalidad `Dual`, Tipo `D`

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

### E49 · Sabado 9:00 · A Definir · SP
- [ ] Pendiente

- Celeste González (`A0113`) · Dual · cat 6
- Teléfono: +595982241484
- En planilla: Modalidad `Dual`, Tipo `D`
- Mismo teléfono que: Luciana Planas (`A0679`) — ¿es la pareja?

Opciones: `PAREJA` · `I` · `G` · `X`

**Decisión:**

---

## Bloque F — No se carga hasta que esté completo

### F1 · Sin profe (67 filas)

Opciones por hueco: código de profe (`FL` `JM` `MP` `PR` `VA` `RS` `TE` `RA` `ChG` `MF` `OB`) · `X` no va.

### F1-01 · Lunes 17:00 · A Definir · 2 alumno(s) · sede A Definir (ver también F2)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Oliver Harper | A0493 | Grupal | P |
| Tiziana Caffarena | A0636 | Grupal | P |
**Profe:**
**Decisión:**

### F1-02 · Martes 16:00 · A Definir · 2 alumno(s) · sede A Definir (ver también F2)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Luciana Planas | A0679 | Grupal | P |
| Tiana Milena D’Ecclesiis | A0635 | Grupal | P |
**Profe:**
**Decisión:**

### F1-03 · Martes 17:00 · A Definir · 2 alumno(s) · sede A Definir (ver también F2)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Beltran Rodriguez | A0789 | sin tipo | — |
| Matias Rodriguez | A0790 | sin tipo | — |
**Profe:**
**Decisión:**

### F1-04 · Miercoles 11:00 · Lomas · 1 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Juan Pablo Angulo | A0328 | Dual | 8 |
**Profe:**
**Decisión:**

### F1-05 · Miercoles 12:00 · Lomas · 1 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Isabel Leon | A0269 | sin tipo | 7 |
**Profe:**
**Decisión:**

### F1-06 · Miercoles 13:00 · Lomas · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| David Stegens | A0151 | Individual | — |
| Rodrigo Trinidad INDIVIDUAL | A0572 | Grupal | 8 |
**Profe:**
**Decisión:**

### F1-07 · Miercoles 14:00 · Lomas · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Adriana Korpershoek | A0004 | Grupal | 7 |
| Roger Barboza | A0573 | Grupal | 3 |
**Profe:**
**Decisión:**

### F1-08 · Miercoles 15:00 · Lomas · 4 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Enzo Marti | A0187 | Grupal | 4 |
| Jessica Mercado | A0290 | Grupal | 8 |
| Maria Caballero | A0412 | Individual | 6 |
| Pablo Mercado INDIVIDUAL | A0506 | Individual | 8 |
**Profe:**
**Decisión:**

### F1-09 · Miercoles 16:00 · A Definir · 2 alumno(s) · sede A Definir (ver también F2)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Leonardo Bogado | A0356 | Dual | 5 |
| Mila Mieres Ugarte | A0461 | Grupal | 7 |
**Profe:**
**Decisión:**

### F1-10 · Miercoles 16:00 · Lomas · 5 alumno(s) · **más de 4 alumnos**
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Coral Warkentin | A0125 | Grupal | 4 |
| Liz Cantero | A0367 | Dual | 6 |
| Mia Ebner | A0453 | Individual | 8 |
| Micaella Garcia | A0925 | sin tipo | — |
| Rebeca Julian | A0548 | sin tipo | 6 |
**Profe:**
**Decisión:**

### F1-11 · Miercoles 17:00 · Lomas · 6 alumno(s) · **más de 4 alumnos**
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Aleli Lopez | A0025 | Dual | 4 |
| Andres Garcia | A0061 | Grupal | 7 |
| Jeronimo Maldonado | A0287 | Grupal | 7 |
| Liz Cantero | A0367 | Dual | 6 |
| Mathias Sanchez | A0434 | Grupal | 7 |
| Rodrigo Mereles | A0567 | Grupal | 6 |
**Profe:**
**Decisión:**

### F1-12 · Jueves 10:00 · Lomas · 1 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Johana Aguinagalde | A0300 | Grupal | 8 |
**Profe:**
**Decisión:**

### F1-13 · Jueves 11:00 · Lomas · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Angela Rolon | A0063 | Grupal | 8 |
| Leslie Schaerer | A0357 | Grupal | 7 |
**Profe:**
**Decisión:**

### F1-14 · Jueves 12:00 · Lomas · 1 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Marisa Santacruz | A0426 | Individual | 7 |
**Profe:**
**Decisión:**

### F1-15 · Jueves 13:00 · Lomas · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Juan Pablo Angulo | A0328 | Dual | 8 |
| Patricia Fois Angulo | A0525 | Dual | 8 |
**Profe:**
**Decisión:**

### F1-16 · Jueves 14:00 · Lomas · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Ale Kallsen | A0016 | Grupal | 7 |
| Nicolle Planas | A0481 | Grupal | 7 |
**Profe:**
**Decisión:**

### F1-17 · Jueves 16:00 · A Definir · 4 alumno(s) · sede A Definir (ver también F2)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Ana Avila | A0702 | Grupal | — |
| Andres Moreno | A0062 | Grupal | P |
| Luciana Planas | A0679 | Grupal | P |
| Tiana Milena D’Ecclesiis | A0635 | Grupal | P |
**Profe:**
**Decisión:**

### F1-18 · Jueves 16:00 · Lomas · 3 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Aldo Gonzalez | A0014 | Grupal | 6 |
| Alexis Doutreloff | A0031 | Grupal | 7 |
| Arnaldo Fernandez | A0078 | Grupal | 7 |
**Profe:**
**Decisión:**

### F1-19 · Jueves 17:00 · Lomas · 1 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Susana Cañiza | A0929 | sin tipo | — |
**Profe:**
**Decisión:**

### F1-20 · Viernes 11:00 · Lomas · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Leslie Schaerer | A0357 | Grupal | 7 |
| Oscar Elizeche | A0496 | Dual | 8 |
**Profe:**
**Decisión:**

### F1-21 · Viernes 12:00 · Lomas · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Daniel Walde | A0143 | Dual | 7 |
| Mathias Melgarejo | A0433 | Dual | 7 |
**Profe:**
**Decisión:**

### F1-22 · Viernes 13:00 · Lomas · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Javiera Henriquez Carrera | A0280 | Dual | — |
| Jessica Harrison | A0289 | Dual | 5 |
**Profe:**
**Decisión:**

### F1-23 · Viernes 14:00 · Lomas · 1 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Antonella Ebner | A0067 | Individual | P |
**Profe:**
**Decisión:**

### F1-24 · Viernes 15:00 · Lomas · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Irmina Quintana GRUPAL | A0750 | Grupal | — |
| Paola Scavone | A0518 | Dual | 6 |
**Profe:**
**Decisión:**

### F1-25 · Viernes 16:00 · A Definir · 2 alumno(s) · sede A Definir (ver también F2)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Beltran Rodriguez | A0789 | sin tipo | — |
| Matias Rodriguez | A0790 | sin tipo | — |
**Profe:**
**Decisión:**

### F1-26 · Viernes 17:00 · Lomas · 1 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Camila Alcaraz | A0096 | Dual | 5 |
**Profe:**
**Decisión:**

### F1-27 · Sabado 7:00 · Elite · 1 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Rolf Gebhardt | A0574 | Dual | 7 |
**Profe:**
**Decisión:**

### F1-28 · Sabado 8:00 · Elite · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Fernando Cueto | A0207 | Dual | 8 |
| Gisselle Arias | A0237 | Dual | 8 |
**Profe:**
**Decisión:**

### F1-29 · Sabado 9:00 · A Definir · 1 alumno(s) · sede A Definir (ver también F2)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Celeste González | A0113 | Dual | 6 |
**Profe:**
**Decisión:**

### F1-30 · Sabado 10:00 · Elite · 1 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Rodrigo Franco | A0565 | Grupal | 5 |
**Profe:**
**Decisión:**

### F1-31 · Sabado 11:00 · Elite · 3 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Aracely Rolon | A0072 | Grupal | P |
| Maria Paz Romero | A0419 | Grupal | P |
| Maxi Auad | A0446 | Grupal | P |
**Profe:**
**Decisión:**

### F1-32 · Sabado 12:00 · Elite · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Gabriel Ojeda | A0223 | Grupal | 8 |
| Martin Morinigo | A0429 | Grupal | P |
**Profe:**
**Decisión:**

### F2 · Sede A Definir (15 filas)

Todas están también en F1 (sin profe). Acá solo falta la **sede**: `Lomas` · `Elite` · `Segurola`.

### F2-01 · Lunes 17:00 · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo |
| --- | --- | --- |
| Oliver Harper | A0493 | Grupal |
| Tiziana Caffarena | A0636 | Grupal |
**Sede:**
**Decisión:**

### F2-02 · Martes 16:00 · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo |
| --- | --- | --- |
| Luciana Planas | A0679 | Grupal |
| Tiana Milena D’Ecclesiis | A0635 | Grupal |
**Sede:**
**Decisión:**

### F2-03 · Martes 17:00 · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo |
| --- | --- | --- |
| Beltran Rodriguez | A0789 | sin tipo |
| Matias Rodriguez | A0790 | sin tipo |
**Sede:**
**Decisión:**

### F2-04 · Miercoles 16:00 · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo |
| --- | --- | --- |
| Leonardo Bogado | A0356 | Dual |
| Mila Mieres Ugarte | A0461 | Grupal |
**Sede:**
**Decisión:**

### F2-05 · Jueves 16:00 · 4 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo |
| --- | --- | --- |
| Ana Avila | A0702 | Grupal |
| Andres Moreno | A0062 | Grupal |
| Luciana Planas | A0679 | Grupal |
| Tiana Milena D’Ecclesiis | A0635 | Grupal |
**Sede:**
**Decisión:**

### F2-06 · Viernes 16:00 · 2 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo |
| --- | --- | --- |
| Beltran Rodriguez | A0789 | sin tipo |
| Matias Rodriguez | A0790 | sin tipo |
**Sede:**
**Decisión:**

### F2-07 · Sabado 9:00 · 1 alumno(s)
- [ ] Pendiente

| Alumno | ID | Tipo |
| --- | --- | --- |
| Celeste González | A0113 | Dual |
**Sede:**
**Decisión:**

### F3 · Sin modalidad ni tipo (60 filas)

Hay que poner `I` individual · `D` dual · `G` grupal. Si es dual, indique pareja si la sabe.

### F3-01 · Lunes 12:00 · Lomas · RA
- [ ] Pendiente

- Thania Ibarra (`A0629`) · sin tipo · cat 8

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-02 · Lunes 14:00 · Lomas · VA
- [ ] Pendiente

- Diego Acuña Papa (`A0986`) · sin tipo · cat 2

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-03 · Lunes 16:00 · Lomas · VA
- [ ] Pendiente

- Carol Brizuela (`A0959`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-04 · Lunes 16:00 · Lomas · JM
- [ ] Pendiente

- Marques Koerich (`A0958`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-05 · Lunes 16:00 · Lomas · OB
- [ ] Pendiente

- Micaella Garcia (`A0925`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-06 · Lunes 16:00 · Lomas · VA
- [ ] Pendiente

- Paloma Sandoval (`A0869`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-07 · Lunes 17:00 · Elite · ChG
- [ ] Pendiente

- Violeta Ortega (`A0657`) · sin tipo · cat 7

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-08 · Lunes 17:00 · Lomas · OB
- [ ] Pendiente

- Enzo Wasmosy (`A0923`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-09 · Martes 8:00 · Elite · RS
- [ ] Pendiente

- Veronica Valdiglesias (`A0895`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-10 · Martes 10:00 · Lomas · VA
- [ ] Pendiente

- Daniel Valerio (`A0811`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-11 · Martes 11:00 · Lomas · JM
- [ ] Pendiente

- Romina Delgado (`A0974`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-12 · Martes 11:00 · Lomas · MP
- [ ] Pendiente

- Santi Muñoz (`A0824`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-13 · Martes 13:00 · Lomas · RA
- [ ] Pendiente

- Thania Ibarra (`A0629`) · sin tipo · cat 8

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-14 · Martes 14:00 · Elite · ChG
- [ ] Pendiente

- Adolfo Aguero (`A0736`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-15 · Martes 16:00 · Segurola Y Habana · PR
- [ ] Pendiente

- Jorge Nasta (`A0892`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-16 · Martes 16:00 · Segurola Y Habana · PR
- [ ] Pendiente

- Sebastian Fernandez (`A0893`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-17 · Martes 17:00 · A Definir · SP
- [ ] Pendiente

- Beltran Rodriguez (`A0789`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-18 · Martes 17:00 · A Definir · SP
- [ ] Pendiente

- Matias Rodriguez (`A0790`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-19 · Martes 17:00 · Lomas · VA
- [ ] Pendiente

- April Molinas (`A0994`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-20 · Martes 17:00 · Lomas · VA
- [ ] Pendiente

- Piero Ghiglione (`A0541`) · sin tipo · cat P

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-21 · Martes 17:00 · Lomas · RA
- [ ] Pendiente

- Santiago Serrati (`A0594`) · sin tipo · cat 6.5

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-22 · Miercoles 6:00 · Lomas · VA
- [ ] Pendiente

- Gregory Segatel (`A0839`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-23 · Miercoles 8:00 · Elite · ChG
- [ ] Pendiente

- Veronica Valdiglesias (`A0895`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-24 · Miercoles 8:00 · Lomas · FL
- [ ] Pendiente

- Coti Urbieta (`A0825`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-25 · Miercoles 8:00 · Lomas · PR
- [ ] Pendiente

- Marcos Martinez (`A0843`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-26 · Miercoles 12:00 · Lomas · SP
- [ ] Pendiente

- Isabel Leon (`A0269`) · sin tipo · cat 7

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-27 · Miercoles 14:00 · Lomas · RA
- [ ] Pendiente

- Thania Ibarra (`A0629`) · sin tipo · cat 8

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-28 · Miercoles 16:00 · Lomas · VA
- [ ] Pendiente

- Carol Brizuela (`A0959`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-29 · Miercoles 16:00 · Lomas · SP
- [ ] Pendiente

- Micaella Garcia (`A0925`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-30 · Miercoles 16:00 · Lomas · VA
- [ ] Pendiente

- Paloma Sandoval (`A0869`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-31 · Miercoles 16:00 · Lomas · SP
- [ ] Pendiente

- Rebeca Julian (`A0548`) · sin tipo · cat 6

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-32 · Miercoles 17:00 · Elite · ChG
- [ ] Pendiente

- Lili Fernanez (`A0884`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-33 · Miercoles 17:00 · Lomas · RS
- [ ] Pendiente

- Marcelito Centurión (`A0939`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-34 · Jueves 8:00 · Lomas · PR
- [ ] Pendiente

- Marcos Martinez (`A0843`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-35 · Jueves 9:00 · Lomas · PR
- [ ] Pendiente

- Natalia Schirmacher (`A0841`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-36 · Jueves 10:00 · Lomas · VA
- [ ] Pendiente

- Daniel Valerio (`A0811`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-37 · Jueves 11:00 · Lomas · JM
- [ ] Pendiente

- Romina Delgado (`A0974`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-38 · Jueves 11:00 · Lomas · MP
- [ ] Pendiente

- Santi Muñoz (`A0824`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-39 · Jueves 13:00 · Lomas · RA
- [ ] Pendiente

- Thania Ibarra (`A0629`) · sin tipo · cat 8

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-40 · Jueves 15:00 · Elite · RS
- [ ] Pendiente

- Nicole Massa (`A0909`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-41 · Jueves 15:00 · Lomas · RA
- [ ] Pendiente

- Susan Paradeda (`A0898`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-42 · Jueves 16:00 · Segurola Y Habana · PR
- [ ] Pendiente

- Jorge Nasta (`A0892`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-43 · Jueves 16:00 · Segurola Y Habana · PR
- [ ] Pendiente

- Sebastian Fernandez (`A0893`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-44 · Jueves 17:00 · Lomas · MF
- [ ] Pendiente

- Santiago Serrati (`A0594`) · sin tipo · cat 6.5

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-45 · Jueves 17:00 · Lomas · SP
- [ ] Pendiente

- Susana Cañiza (`A0929`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-46 · Viernes 6:00 · Lomas · JM
- [ ] Pendiente

- Gregory Segatel (`A0839`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-47 · Viernes 6:00 · Lomas · PR
- [ ] Pendiente

- Marcelo Sanz (`A0408`) · sin tipo · cat 7

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-48 · Viernes 11:00 · Elite · RS
- [ ] Pendiente

- Belen Fuster (`A0926`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-49 · Viernes 14:00 · Lomas · RA
- [ ] Pendiente

- Coti Urbieta (`A0825`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-50 · Viernes 14:00 · Lomas · RA
- [ ] Pendiente

- Thania Ibarra (`A0629`) · sin tipo · cat 8

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-51 · Viernes 14:00 · Segurola Y Habana · PR
- [ ] Pendiente

- Yanina Bernardis (`A0770`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-52 · Viernes 16:00 · A Definir · SP
- [ ] Pendiente

- Beltran Rodriguez (`A0789`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-53 · Viernes 16:00 · A Definir · SP
- [ ] Pendiente

- Matias Rodriguez (`A0790`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-54 · Viernes 17:00 · Lomas · RS
- [ ] Pendiente

- Marcelito Centurión (`A0939`) · sin tipo · cat —

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-55 · Sabado 8:00 · Lomas · VA
- [ ] Pendiente

- Tito Vera (`A0500`) · sin tipo · cat 6

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-56 · Sabado 8:00 · Segurola Y Habana · FL
- [ ] Pendiente

- Paola Lesme (`A0516`) · sin tipo · cat 8

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-57 · Sabado 10:00 · Lomas · VA
- [ ] Pendiente

- Matias Grijalba (`A0437`) · sin tipo · cat 8

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-58 · Sabado 11:00 · Lomas · VA
- [ ] Pendiente

- Talitha Rodriguez (`A0623`) · sin tipo · cat P

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-59 · Sabado 12:00 · Lomas · TE
- [ ] Pendiente

- Luis Ramirez (`A0386`) · sin tipo · cat 7

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

### F3-60 · Sabado 12:00 · Segurola Y Habana · RS
- [ ] Pendiente

- Rocio Gamarra (`A0559`) · sin tipo · cat 8

Opciones: `I` · `D` · `G` · `X`

**Decisión:**

---

## Bloque G — Se puede cargar, pero incompleto

### G1 · Sin teléfono (34 personas)

Se crea el cliente en SimplyBook igual. Guest book y WhatsApp van a fallar hasta que haya número.

Complete la columna **Teléfono** (E.164, Paraguay `+595…`) o escriba `no tiene`.
| Código | ID | Nombre | Teléfono |
| --- | --- | --- | --- |
| G1-01 | A0004 | Adriana Korpershoek |  |
| G1-02 | A0011 | Alberto Masquieira |  |
| G1-03 | A0037 | Alvaro Navarro |  |
| G1-04 | A0989 | Ana Paleari |  |
| G1-05 | A0994 | April Molinas |  |
| G1-06 | A0959 | Carol Brizuela |  |
| G1-07 | A0134 | Daisi Mendez |  |
| G1-08 | A0811 | Daniel Valerio |  |
| G1-09 | A0152 | Delfina Urdampilleta |  |
| G1-10 | A0992 | Emanuel Rodriguez |  |
| G1-11 | A0991 | Eugenia Celauro |  |
| G1-12 | A0944 | Fabiola Franchi |  |
| G1-13 | A0761 | Facu Martinez |  |
| G1-14 | A0280 | Javiera Henriquez Carrera |  |
| G1-15 | A0903 | Jerome Rolland |  |
| G1-16 | A0288 | Jesper Hallas |  |
| G1-17 | A0295 | Jhonatan Maldonado |  |
| G1-18 | A0336 | Juliana Valerio |  |
| G1-19 | A0337 | Julieta Zeballos |  |
| G1-20 | A0344 | Kino Bernabeu |  |
| G1-21 | A0356 | Leonardo Bogado |  |
| G1-22 | A0828 | Leticia Martinez |  |
| G1-23 | A0365 | Lionel Amarilla |  |
| G1-24 | A0818 | Lorena Cho |  |
| G1-25 | A0906 | Luciano Zampedri |  |
| G1-26 | A0412 | Maria Caballero |  |
| G1-27 | A0520 | Paola Valeff |  |
| G1-28 | SIN-ID | Pedro Aguero |  |
| G1-29 | A0541 | Piero Ghiglione |  |
| G1-30 | A0585 | Rosti Veselinov |  |
| G1-31 | A0592 | Santiago Cogorno |  |
| G1-32 | A0739 | Sebastian Van Kuyk DUAL |  |
| G1-33 | A0643 | Uma Paleari |  |
| G1-34 | A0770 | Yanina Bernardis |  |
**Notas G1:**

### G2 · Sin categoría (132 alumnos)

No bloquea la carga de las clases. Bloquea cualquier candado por nivel después.

Valores: `P` principiante · `1` … `8` · `6.5` (ver G3).
| Código | ID | Nombre | Categoría |
| --- | --- | --- | --- |
| G2-01 | A0011 | Alberto Masquieira |  |
| G2-02 | A0040 | Alzira Sanabria |  |
| G2-03 | A0047 | Ana Gonzalez |  |
| G2-04 | A0068 | Antonella Sandoval |  |
| G2-05 | A0071 | Araceli Caballero |  |
| G2-06 | A0084 | Bastian Santander |  |
| G2-07 | A0089 | Benjamin Santander |  |
| G2-08 | A0101 | Carlos Dure |  |
| G2-09 | A0114 | Celeste Portillo |  |
| G2-10 | A0120 | Clarissa Sanchez |  |
| G2-11 | A0151 | David Stegens |  |
| G2-12 | A0152 | Delfina Urdampilleta |  |
| G2-13 | A0154 | Denise Achi |  |
| G2-14 | A0203 | Federico Oviedo |  |
| G2-15 | A0228 | Geraldine Eissler |  |
| G2-16 | A0280 | Javiera Henriquez Carrera |  |
| G2-17 | A0288 | Jesper Hallas |  |
| G2-18 | A0317 | Jose Meza |  |
| G2-19 | A0340 | Karen Morales |  |
| G2-20 | A0341 | Karen Zapata |  |
| G2-21 | A0479 | Nicolas Talavera |  |
| G2-22 | A0507 | Pablo Orichio |  |
| G2-23 | A0509 | Pablo Salinas |  |
| G2-24 | A0510 | Paloma Alonso |  |
| G2-25 | A0511 | Paloma Colman |  |
| G2-26 | A0607 | Silvana Avalos |  |
| G2-27 | A0610 | Silvana Scavone |  |
| G2-28 | A0616 | Sofia Benza |  |
| G2-29 | A0624 | Tamar Schuartzman |  |
| G2-30 | A0646 | Valerie Barrail |  |
| G2-31 | A0676 | Sol Barrientos |  |
| G2-32 | A0678 | Luciano Grassi |  |
| G2-33 | A0680 | Abril Chagra |  |
| G2-34 | A0681 | Maximo Faccas |  |
| G2-35 | A0683 | Cesare Orihuela |  |
| G2-36 | A0689 | María Lucy Medina |  |
| G2-37 | A0691 | Héctor Vega |  |
| G2-38 | A0701 | Mariela Ramirez |  |
| G2-39 | A0702 | Ana Avila |  |
| G2-40 | A0719 | Carlos Gill Robbiani |  |
| G2-41 | A0728 | Lorena Santin |  |
| G2-42 | A0736 | Adolfo Aguero |  |
| G2-43 | A0739 | Sebastian Van Kuyk DUAL |  |
| G2-44 | A0750 | Irmina Quintana |  |
| G2-45 | A0761 | Facu Martinez |  |
| G2-46 | A0763 | Silvio Aguilar |  |
| G2-47 | A0764 | Naoki Sosa |  |
| G2-48 | A0765 | Marcelo Frutos |  |
| G2-49 | A0766 | Tania Morel |  |
| G2-50 | A0770 | Yanina Bernardis |  |
| G2-51 | A0773 | Bruno Giagni |  |
| G2-52 | A0778 | Jazmin Arnold |  |
| G2-53 | A0779 | Alicia Escobar |  |
| G2-54 | A0780 | Fabiola Meza |  |
| G2-55 | A0789 | Beltran Rodriguez |  |
| G2-56 | A0790 | Matias Rodriguez |  |
| G2-57 | A0791 | Liza Mereles |  |
| G2-58 | A0794 | Carlos Orihuela |  |
| G2-59 | A0795 | Alexa Noceda |  |
| G2-60 | A0800 | Addis Acosta |  |
| G2-61 | A0805 | Violeta Centurion |  |
| G2-62 | A0806 | Marian Ruiz |  |
| G2-63 | A0807 | Marina Baumann |  |
| G2-64 | A0811 | Daniel Valerio |  |
| G2-65 | A0816 | Alejandro Lin |  |
| G2-66 | A0817 | Natalia Fretes |  |
| G2-67 | A0818 | Lorena Cho |  |
| G2-68 | A0819 | Andres Marti |  |
| G2-69 | A0823 | Ximena Ramirez |  |
| G2-70 | A0824 | Santi Muñoz |  |
| G2-71 | A0825 | Coti Urbieta |  |
| G2-72 | A0828 | Leticia Martinez |  |
| G2-73 | A0839 | Gregory Segatel |  |
| G2-74 | A0840 | Daniel Schirmacher |  |
| G2-75 | A0841 | Natalia Schirmacher |  |
| G2-76 | A0843 | Marcos Martinez |  |
| G2-77 | A0845 | Jazmin Larreinegabe |  |
| G2-78 | A0858 | Maria Ines Torres |  |
| G2-79 | A0869 | Paloma Sandoval |  |
| G2-80 | A0874 | Cristina Ferrario de De Gasperi |  |
| G2-81 | A0876 | Giovanni Bogado |  |
| G2-82 | A0877 | Jose Santos |  |
| G2-83 | A0880 | Carlos Duarte Reguera |  |
| G2-84 | A0884 | Lili Fernanez |  |
| G2-85 | A0888 | Joaquín Costas |  |
| G2-86 | A0892 | Jorge Nasta |  |
| G2-87 | A0893 | Sebastian Fernandez |  |
| G2-88 | A0895 | Veronica Valdiglesias |  |
| G2-89 | A0896 | David Colman |  |
| G2-90 | A0897 | Fabiola Echauri |  |
| G2-91 | A0898 | Susan Paradeda |  |
| G2-92 | A0899 | Lis Vera |  |
| G2-93 | A0902 | Areia Benitez |  |
| G2-94 | A0903 | Jerome Rolland |  |
| G2-95 | A0906 | Luciano Zampedri |  |
| G2-96 | A0909 | Nicole Massa |  |
| G2-97 | A0910 | Alexander Alcaraz |  |
| G2-98 | A0913 | Lucia Barrios |  |
| G2-99 | A0914 | Raul Doria |  |
| G2-100 | A0923 | Enzo Wasmosy |  |
| G2-101 | A0925 | Micaella Garcia |  |
| G2-102 | A0926 | Belen Fuster |  |
| G2-103 | A0929 | Susana Cañiza |  |
| G2-104 | A0931 | Marilina Raymondy |  |
| G2-105 | A0933 | Araceli Aranda |  |
| G2-106 | A0939 | Marcelito Centurión |  |
| G2-107 | A0941 | Ezequiel Quiroga |  |
| G2-108 | A0942 | Benjamín Acuña |  |
| G2-109 | A0944 | Fabiola Franchi |  |
| G2-110 | A0949 | Adrian Cuartas |  |
| G2-111 | A0954 | Melissa Parodi |  |
| G2-112 | A0955 | José Alejandro Morao |  |
| G2-113 | A0957 | Melissa Machado |  |
| G2-114 | A0958 | Marques Koerich |  |
| G2-115 | A0959 | Carol Brizuela |  |
| G2-116 | A0960 | Magali Caballero |  |
| G2-117 | A0961 | Cristina Zacarias |  |
| G2-118 | A0962 | Gloria Silveira |  |
| G2-119 | A0963 | Clari Silveira |  |
| G2-120 | A0966 | Andres Barrios |  |
| G2-121 | A0967 | Andrea Peralta |  |
| G2-122 | A0970 | Egidio Machado |  |
| G2-123 | A0971 | Jose Franco |  |
| G2-124 | A0974 | Romina Delgado |  |
| G2-125 | A0975 | Violeta Del Puerto |  |
| G2-126 | A0981 | Sofia Gonzalez |  |
| G2-127 | A0989 | Ana Paleari |  |
| G2-128 | A0991 | Eugenia Celauro |  |
| G2-129 | A0992 | Emanuel Rodriguez |  |
| G2-130 | A0993 | Bianca Boscarino |  |
| G2-131 | A0994 | April Molinas |  |
| G2-132 | A1056 | Iris Alicia Genes Apthorpe |  |
**Notas G2:**

### G3 · Categoría `6.5`

- [ ] Pendiente

**Santiago Serrati** (`A0594`): martes 17:00 Lomas RA y jueves 17:00 Lomas MF. Las dos filas están además **sin tipo** (F3).

Opciones de Nivel en SimplyBook: `Sexta` (default del plan) · `Quinta` · otra.

**Decisión:**

### G4 · Categorías mezcladas en el mismo hueco (los graves)

71 huecos tienen más de una categoría. Abajo solo los **graves**: principiante con 6–8, o tres categorías distintas. El resto es 6 con 7, 7 con 8, etc. No bloquea la carga. Sirve para que el profe sepa que el grupo no está nivelado.

Opciones: `OK` se acepta · `M` mover a los que no corresponden (indicar a quién).

### G4-01 · Lunes 8:00 · Lomas · VA · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Elisa Kim | A0182 | Dual | 8 |
| Gustavo Lopez | A0033 | Individual | P |
**Decisión:**

### G4-02 · Lunes 17:00 · Lomas · VA · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Federico Galeano | A0202 | Grupal | P |
| Lis Vera | A0899 | Dual | — |
| Mateo Meza | A0746 | Grupal | 8 |
**Decisión:**

### G4-03 · Martes 13:00 · Lomas · TE · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Coty Caballero | A0127 | Individual | 8 |
| Shirley Torres | A0605 | Dual | P |
**Decisión:**

### G4-04 · Martes 14:00 · Segurola Y Habana · PR · cats 7, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Ale Kallsen | A0016 | Grupal | 7 |
| Joaquin Avila | A0296 | Grupal | P |
| Tomás Ruger | A0686 | Grupal | P |
**Decisión:**

### G4-05 · Martes 17:00 · Lomas · VA · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| April Molinas | A0994 | ? | — |
| Piero Ghiglione | A0541 | ? | P |
| Rosa Garcete | A0581 | Grupal | 8 |
**Decisión:**

### G4-06 · Miercoles 8:00 · Lomas · JM · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Elisa Kim | A0182 | Dual | 8 |
| Gustavo Lopez | A0033 | Individual | P |
**Decisión:**

### G4-07 · Miercoles 8:00 · Lomas · VA · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Ana Paula Aquino | A0048 | Dual | P |
| Mangui Petersen | A0396 | Dual | 8 |
**Decisión:**

### G4-08 · Miercoles 11:00 · Elite · RS · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Elian Corteguera | A0180 | Dual | 8 |
| Paula Aranda | A0534 | Dual | P |
**Decisión:**

### G4-09 · Miercoles 14:00 · Lomas · SP · cats 3, 7
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Adriana Korpershoek | A0004 | Grupal | 7 |
| Roger Barboza | A0573 | Grupal | 3 |
**Decisión:**

### G4-10 · Miercoles 15:00 · Lomas · SP · cats 4, 6, 8
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Enzo Marti | A0187 | Grupal | 4 |
| Jessica Mercado | A0290 | Grupal | 8 |
| Maria Caballero | A0412 | Individual | 6 |
| Pablo Mercado INDIVIDUAL | A0506 | Individual | 8 |
**Decisión:**

### G4-11 · Miercoles 16:00 · Lomas · SP · cats 4, 6, 8
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Coral Warkentin | A0125 | Grupal | 4 |
| Liz Cantero | A0367 | Dual | 6 |
| Mia Ebner | A0453 | Individual | 8 |
| Micaella Garcia | A0925 | ? | — |
| Rebeca Julian | A0548 | ? | 6 |
**Decisión:**

### G4-12 · Miercoles 17:00 · Segurola Y Habana · FL · cats 7, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Meir Herskowicz | A0451 | Grupal | P |
| Thiago Gandolfo | A0631 | Grupal | 7 |
**Decisión:**

### G4-13 · Miercoles 17:00 · Lomas · SP · cats 4, 6, 7
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Aleli Lopez | A0025 | Dual | 4 |
| Andres Garcia | A0061 | Grupal | 7 |
| Jeronimo Maldonado | A0287 | Grupal | 7 |
| Liz Cantero | A0367 | Dual | 6 |
| Mathias Sanchez | A0434 | Grupal | 7 |
| Rodrigo Mereles | A0567 | Grupal | 6 |
**Decisión:**

### G4-14 · Jueves 16:00 · Lomas · JM · cats 5, 7, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Analia Ferreira | A0054 | Grupal | P |
| Giovanni Bogado | A0876 | Grupal | — |
| Giuliano Pecci | A0239 | Grupal | 7 |
| Lechu González | A0353 | Grupal | 5 |
**Decisión:**

### G4-15 · Jueves 17:00 · Lomas · JM · cats 4, 6, 7
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Alex Ebner GRUPAL | A0028 | Grupal | 6 |
| Osvaldo Ortiz | A0498 | Grupal | 4 |
| Patricio Escobar | A0529 | Grupal | 7 |
**Decisión:**

### G4-16 · Jueves 17:00 · Elite · RS · cats 7, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Martin Morinigo | A0429 | Grupal | P |
| Rodrigo Lee GRUPAL | A0705 | Grupal | 7 |
| Romina Lee GRUPAL | A0706 | Grupal | 7 |
**Decisión:**

### G4-17 · Viernes 8:00 · Lomas · FL · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Ana Paula Aquino | A0048 | Dual | P |
| Mangui Petersen | A0396 | Dual | 8 |
**Decisión:**

### G4-18 · Viernes 9:00 · Lomas · PR · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Andrea Mongelos DUAL | A0707 | Dual | P |
| Jose Carlos Brunetti | A0312 | Dual | 8 |
**Decisión:**

### G4-19 · Viernes 15:00 · Segurola Y Habana · PR · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Danna Benitez | A0146 | Grupal | P |
| Tiziano Garozzo | A0637 | Grupal | 8 |
**Decisión:**

### G4-20 · Viernes 16:00 · Segurola Y Habana · PR · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Bastian Santander | A0084 | Grupal | — |
| Benjamin Santander | A0089 | Grupal | — |
| Meir Herskowicz | A0451 | Grupal | P |
| Noriyuki Watanabe | A0488 | Grupal | 8 |
**Decisión:**

### G4-21 · Viernes 16:00 · Lomas · RA · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Alejandro Goffa GRUPAL | A0852 | Grupal | P |
| Giselle Manzoni | A0695 | Dual | 8 |
| Magali Ibarra | A0694 | Dual | 8 |
**Decisión:**

### G4-22 · Viernes 17:00 · Lomas · RA · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Antonella Wasmosy | A0070 | Grupal | P |
| Aracely Angulo | A0900 | Grupal | 8 |
**Decisión:**

### G4-23 · Sabado 9:00 · Segurola Y Habana · RS · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Andrea Gagliardone | A0056 | Grupal | 8 |
| Maxi Cantero | A0447 | Grupal | P |
**Decisión:**

### G4-24 · Sabado 12:00 · Lomas · PR · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Daisi Mendez | A0134 | Dual | P |
| Jhonatan Maldonado | A0295 | Dual | P |
| Paloma Alonso | A0510 | Grupal | — |
| Paola Espinola | A0514 | Grupal | 8 |
**Decisión:**

### G4-25 · Sabado 12:00 · Elite · SP · cats 8, P
- [ ] Pendiente

| Alumno | ID | Tipo | Cat |
| --- | --- | --- | --- |
| Gabriel Ojeda | A0223 | Grupal | 8 |
| Martin Morinigo | A0429 | Grupal | P |
**Decisión:**

---

## Hoja compacta de respuestas

Copiar, rellenar, devolver. La IA puede ir tachando.

### A — Profes dos sedes

```
A01 Lunes 13:00 RS n=2:
A02 Lunes 15:00 RS n=4:
A03 Martes 16:00 RS n=5 SUPERA4:
A04 Martes 17:00 RS n=8 SUPERA4:
A05 Miercoles 16:00 RS n=3:
A06 Miercoles 17:00 RS n=4:
A07 Jueves 15:00 RS n=2:
A08 Jueves 16:00 RS n=5 SUPERA4:
A09 Jueves 17:00 RS n=5 SUPERA4:
A10 Viernes 16:00 RS n=4:
A11 Viernes 17:00 RS n=4:
A12 Sabado 11:00 PR n=7 SUPERA4:
```

### B — Fichas

```
B01 Alex Ebner (A0028/A0564):
B02 Irmina Quintana (A0750/A0268):
B03 John Swanston (A0675/A0302):
B04 Pablo Mercado (A0506/A0704):
B05 Rodrigo Lee (A0705/A0566):
B06 Romina Lee (A0706/A0575):
B07 Pedro Aguero → A0538?:
```

### C — Familias (OK o UNIR)

```
C01 Fernando Cueto · Gisselle Arias:
C02 Elian Corteguera · Paula Aranda:
C03 Alzira Sanabria · Diego Heisecke:
C04 Lizzel Vergara · Tito Vera:
C05 Mila Mieres Ugarte · Paola Ugarte:
C06 Rafaela Angulo · Silvana Scavone:
C07 Ana Avila · Joaquin Avila:
C08 Pablo Orichio · Sofia Benza:
C09 Jose Cantero · Maxi Cantero:
C10 Antonella Wasmosy · Enzo Wasmosy:
C11 Ana Gonzalez · Federico Oviedo:
C12 Antonella Ebner · Mia Ebner:
C13 Karen Zapata · Pablo Salinas:
C14 Sofia Gonzalez · Violeta Del Puerto:
C15 Ami Nakagoe · Noriyuki Watanabe:
C16 Maria Paz Romero · Nestor Romero:
C17 Celeste González · Luciana Planas:
C18 Hugo Meza · Mateo Meza:
C19 Andres Marti · Enzo Marti:
C20 Agostina Rodas · Nicolle Planas:
C21 Andrea Mongelos DUAL · Jose Carlos Brunetti:
C22 Armindo Portillo · Gabriela Benitez:
C23 Bastian Santander · Benjamin Santander:
C24 Beltran Rodriguez · Matias Rodriguez:
C25 Andrea Peralta · Andres Barrios:
C26 Daniel Schirmacher · Natalia Schirmacher:
C27 Rodrigo Lee · Romina Lee:
C28 Meir Herskowicz · Ruth Singer:
C29 Jorge Bernal · Liz Roman:
C30 Angela Rolon · Areia Benitez:
C31 Elisa Kim · Min A Han:
```

### D — Mix de tipo

```
D01 Lunes 6:00 Lomas JM Dual,Grupal:
D02 Lunes 7:00 Lomas MP Dual,Grupal:
D03 Lunes 8:00 Lomas JM Dual,Grupal:
D04 Lunes 8:00 Lomas VA Dual,Individual:
D05 Lunes 9:00 Lomas JM Dual,Grupal:
D06 Lunes 11:00 Lomas TE Dual,Grupal:
D07 Lunes 16:00 Lomas RA Dual,Grupal:
D08 Lunes 16:00 Lomas TE Grupal,Individual:
D09 Lunes 17:00 Lomas TE Dual,Grupal:
D10 Lunes 17:00 Lomas VA Dual,Grupal:
D11 Martes 9:00 Lomas PR Dual,Grupal:
D12 Martes 10:00 Lomas JM Dual,Individual:
D13 Martes 13:00 Lomas TE Dual,Individual:
D14 Martes 14:00 Lomas RA Dual,Individual:
D15 Martes 14:00 Lomas TE Dual,Grupal:
D16 Martes 14:00 Lomas VA Dual,Grupal:
D17 Martes 15:00 Elite ChG Dual,Grupal:
D18 Martes 15:00 Lomas JM Dual,Grupal:
D19 Martes 17:00 Segurola Y Habana FL Dual,Grupal:
D20 Martes 17:00 Lomas TE Dual,Grupal:
D21 Miercoles 6:00 Lomas FL Dual,Grupal:
D22 Miercoles 7:00 Lomas FL Dual,Grupal:
D23 Miercoles 7:00 Lomas MP Dual,Grupal:
D24 Miercoles 8:00 Lomas FL Dual,Individual:
D25 Miercoles 8:00 Lomas JM Dual,Individual:
D26 Miercoles 10:00 Lomas VA Grupal,Individual:
D27 Miercoles 13:00 Lomas SP Grupal,Individual:
D28 Miercoles 14:00 Lomas JM Grupal,Individual:
D29 Miercoles 14:00 Lomas VA Grupal,Individual:
D30 Miercoles 15:00 Elite ChG Grupal,Individual:
D31 Miercoles 15:00 Lomas RA Dual,Grupal:
D32 Miercoles 15:00 Lomas SP Grupal,Individual:
D33 Miercoles 16:00 A Definir SP Dual,Grupal:
D34 Miercoles 16:00 Lomas SP Dual,Grupal,Individual:
D35 Miercoles 17:00 Lomas JM Dual,Grupal:
D36 Miercoles 17:00 Lomas SP Dual,Grupal:
D37 Jueves 6:00 Lomas FL Dual,Individual:
D38 Jueves 8:00 Lomas FL Dual,Grupal:
D39 Jueves 11:00 Lomas VA Dual,Individual:
D40 Jueves 12:00 Lomas RA Grupal,Individual:
D41 Jueves 14:00 Lomas JM Dual,Individual:
D42 Jueves 17:00 Lomas RS Dual,Grupal:
D43 Viernes 8:00 Lomas MF Dual,Grupal:
D44 Viernes 9:00 Lomas FL Dual,Individual:
D45 Viernes 9:00 Lomas MF Dual,Grupal:
D46 Viernes 11:00 Lomas SP Dual,Grupal:
D47 Viernes 14:00 Lomas VA Grupal,Individual:
D48 Viernes 15:00 Lomas SP Dual,Grupal:
D49 Viernes 16:00 Lomas RA Dual,Grupal:
D50 Sabado 9:00 Segurola Y Habana FL Dual,Grupal:
D51 Sabado 10:00 Segurola Y Habana FL Dual,Grupal:
D52 Sabado 11:00 Segurola Y Habana FL Dual,Grupal:
D53 Sabado 11:00 Lomas MF Dual,Grupal:
D54 Sabado 12:00 Lomas PR Dual,Grupal:
```

### E — Dual solo

```
E01 Lunes 11:00 Lomas JM Raul Doria:
E02 Lunes 11:00 Lomas VA Daniel Acosta:
E03 Lunes 12:00 Elite ChG Carlos Dure:
E04 Lunes 12:00 Lomas JM Adrian Cuartas:
E05 Lunes 12:00 Lomas RS Luis Rojas:
E06 Lunes 13:00 Lomas TE José Alejandro Morao:
E07 Lunes 14:00 Lomas TE Delfina Urdampilleta:
E08 Lunes 15:00 Lomas TE Fabiola Franchi:
E09 Martes 6:00 Lomas PR Albert Gross Brown:
E10 Martes 7:00 Lomas JM Crispin Trinthammer:
E11 Martes 8:00 Lomas PR Cesar Fretes:
E12 Martes 11:00 Lomas MF Larissa Recalde:
E13 Martes 11:00 Elite RS Alejandra Arguello:
E14 Martes 12:00 Lomas MF Hugo Corrales:
E15 Martes 12:00 Lomas VA María Lucy Medina:
E16 Martes 13:00 Lomas JM Valerie Barrail:
E17 Martes 13:00 Lomas VA Luciano Zampedri:
E18 Martes 16:00 Elite ChG India Rojas:
E19 Miercoles 6:00 Lomas MP Luis Rojas:
E20 Miercoles 6:00 Lomas PR Ximena Ramirez:
E21 Miercoles 8:00 Elite RS Lorena Fridman:
E22 Miercoles 11:00 Elite ChG Marian Ruiz:
E23 Miercoles 11:00 Lomas SP Juan Pablo Angulo:
E24 Miercoles 12:00 Segurola Y Habana FL Alu Espinola:
E25 Jueves 6:00 Elite RS Diego Romero:
E26 Jueves 8:00 Lomas MP Cesar Fretes:
E27 Jueves 9:00 Lomas VA Daniel Schirmacher:
E28 Jueves 11:00 Elite ChG Sol Godoy:
E29 Jueves 11:00 Lomas MF Larissa Recalde:
E30 Jueves 11:00 Lomas PR Daniel Acosta:
E31 Jueves 11:00 Elite RS Jose Cantero:
E32 Jueves 12:00 Elite ChG Carlos Dure:
E33 Jueves 12:00 Lomas MF Hugo Corrales:
E34 Jueves 12:00 Lomas VA María Lucy Medina:
E35 Jueves 14:00 Lomas RA Alexander Alcaraz:
E36 Jueves 15:00 Elite ChG Leticia Sanchez:
E37 Jueves 15:00 Segurola Y Habana PR Kino Bernabeu:
E38 Viernes 8:00 Lomas MP Sebastian Van Kuyk DUAL:
E39 Viernes 8:00 Lomas VA Paola Ugarte:
E40 Viernes 9:00 Lomas VA Jazmin Larreinegabe:
E41 Viernes 12:00 Segurola Y Habana FL Alu Espinola:
E42 Viernes 12:00 Lomas VA Adrian Cuartas:
E43 Viernes 14:00 Elite RS Lorena Fridman:
E44 Viernes 15:00 Elite RS Maria Ines Torres:
E45 Viernes 17:00 Lomas SP Camila Alcaraz:
E46 Sabado 7:00 Lomas MF Victor Cardozo:
E47 Sabado 7:00 Elite SP Rolf Gebhardt:
E48 Sabado 8:00 Lomas MF Romina Lugo:
E49 Sabado 9:00 A Definir SP Celeste González:
```

### F1 — Sin profe

```
F1-01 Lunes 17:00 A Definir n=2:
F1-02 Martes 16:00 A Definir n=2:
F1-03 Martes 17:00 A Definir n=2:
F1-04 Miercoles 11:00 Lomas n=1:
F1-05 Miercoles 12:00 Lomas n=1:
F1-06 Miercoles 13:00 Lomas n=2:
F1-07 Miercoles 14:00 Lomas n=2:
F1-08 Miercoles 15:00 Lomas n=4:
F1-09 Miercoles 16:00 A Definir n=2:
F1-10 Miercoles 16:00 Lomas n=5:
F1-11 Miercoles 17:00 Lomas n=6:
F1-12 Jueves 10:00 Lomas n=1:
F1-13 Jueves 11:00 Lomas n=2:
F1-14 Jueves 12:00 Lomas n=1:
F1-15 Jueves 13:00 Lomas n=2:
F1-16 Jueves 14:00 Lomas n=2:
F1-17 Jueves 16:00 A Definir n=4:
F1-18 Jueves 16:00 Lomas n=3:
F1-19 Jueves 17:00 Lomas n=1:
F1-20 Viernes 11:00 Lomas n=2:
F1-21 Viernes 12:00 Lomas n=2:
F1-22 Viernes 13:00 Lomas n=2:
F1-23 Viernes 14:00 Lomas n=1:
F1-24 Viernes 15:00 Lomas n=2:
F1-25 Viernes 16:00 A Definir n=2:
F1-26 Viernes 17:00 Lomas n=1:
F1-27 Sabado 7:00 Elite n=1:
F1-28 Sabado 8:00 Elite n=2:
F1-29 Sabado 9:00 A Definir n=1:
F1-30 Sabado 10:00 Elite n=1:
F1-31 Sabado 11:00 Elite n=3:
F1-32 Sabado 12:00 Elite n=2:
```

### F2 — Sede

```
F2-01 Lunes 17:00:
F2-02 Martes 16:00:
F2-03 Martes 17:00:
F2-04 Miercoles 16:00:
F2-05 Jueves 16:00:
F2-06 Viernes 16:00:
F2-07 Sabado 9:00:
```

### F3 — Tipo

```
F3-01 Thania Ibarra Lunes 12:00 RA:
F3-02 Diego Acuña Papa Lunes 14:00 VA:
F3-03 Carol Brizuela Lunes 16:00 VA:
F3-04 Marques Koerich Lunes 16:00 JM:
F3-05 Micaella Garcia Lunes 16:00 OB:
F3-06 Paloma Sandoval Lunes 16:00 VA:
F3-07 Violeta Ortega Lunes 17:00 ChG:
F3-08 Enzo Wasmosy Lunes 17:00 OB:
F3-09 Veronica Valdiglesias Martes 8:00 RS:
F3-10 Daniel Valerio Martes 10:00 VA:
F3-11 Romina Delgado Martes 11:00 JM:
F3-12 Santi Muñoz Martes 11:00 MP:
F3-13 Thania Ibarra Martes 13:00 RA:
F3-14 Adolfo Aguero Martes 14:00 ChG:
F3-15 Jorge Nasta Martes 16:00 PR:
F3-16 Sebastian Fernandez Martes 16:00 PR:
F3-17 Beltran Rodriguez Martes 17:00 SP:
F3-18 Matias Rodriguez Martes 17:00 SP:
F3-19 April Molinas Martes 17:00 VA:
F3-20 Piero Ghiglione Martes 17:00 VA:
F3-21 Santiago Serrati Martes 17:00 RA:
F3-22 Gregory Segatel Miercoles 6:00 VA:
F3-23 Veronica Valdiglesias Miercoles 8:00 ChG:
F3-24 Coti Urbieta Miercoles 8:00 FL:
F3-25 Marcos Martinez Miercoles 8:00 PR:
F3-26 Isabel Leon Miercoles 12:00 SP:
F3-27 Thania Ibarra Miercoles 14:00 RA:
F3-28 Carol Brizuela Miercoles 16:00 VA:
F3-29 Micaella Garcia Miercoles 16:00 SP:
F3-30 Paloma Sandoval Miercoles 16:00 VA:
F3-31 Rebeca Julian Miercoles 16:00 SP:
F3-32 Lili Fernanez Miercoles 17:00 ChG:
F3-33 Marcelito Centurión Miercoles 17:00 RS:
F3-34 Marcos Martinez Jueves 8:00 PR:
F3-35 Natalia Schirmacher Jueves 9:00 PR:
F3-36 Daniel Valerio Jueves 10:00 VA:
F3-37 Romina Delgado Jueves 11:00 JM:
F3-38 Santi Muñoz Jueves 11:00 MP:
F3-39 Thania Ibarra Jueves 13:00 RA:
F3-40 Nicole Massa Jueves 15:00 RS:
F3-41 Susan Paradeda Jueves 15:00 RA:
F3-42 Jorge Nasta Jueves 16:00 PR:
F3-43 Sebastian Fernandez Jueves 16:00 PR:
F3-44 Santiago Serrati Jueves 17:00 MF:
F3-45 Susana Cañiza Jueves 17:00 SP:
F3-46 Gregory Segatel Viernes 6:00 JM:
F3-47 Marcelo Sanz Viernes 6:00 PR:
F3-48 Belen Fuster Viernes 11:00 RS:
F3-49 Coti Urbieta Viernes 14:00 RA:
F3-50 Thania Ibarra Viernes 14:00 RA:
F3-51 Yanina Bernardis Viernes 14:00 PR:
F3-52 Beltran Rodriguez Viernes 16:00 SP:
F3-53 Matias Rodriguez Viernes 16:00 SP:
F3-54 Marcelito Centurión Viernes 17:00 RS:
F3-55 Tito Vera Sabado 8:00 VA:
F3-56 Paola Lesme Sabado 8:00 FL:
F3-57 Matias Grijalba Sabado 10:00 VA:
F3-58 Talitha Rodriguez Sabado 11:00 VA:
F3-59 Luis Ramirez Sabado 12:00 TE:
F3-60 Rocio Gamarra Sabado 12:00 RS:
```

### G3

```
G3 Santiago Serrati 6.5:
```

---

## Prompt listo para pegar

```
Te adjunto PLANILLA-CONFLICTOS.md de Academia DG.
Sos el asistente de administración. Recorremos el documento para cerrar decisiones.
Empezá por A01: en una frase el conflicto, tu recomendación con letra (E/L/2/R/X), y la pregunta.
No rellenes Decisión hasta que yo confirme. No fusiones familias. No inventes profes.
```
