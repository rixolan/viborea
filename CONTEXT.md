# Viborea

Software de gestión de academias de pádel. Controla la grilla (sede, pista, entrenador, horario); no remata con automatización.

## Language

**Studio**:
Academia. Raíz organizativa. No es un tenant de facturación de Viborea.
_Avoid_: Club (como marketplace), tenant

**Location**:
Sede física de la academia.
_Avoid_: Club, venue, studio (para la sede)

**Court**:
Pista/cancha: recurso escaso con identidad, dentro de una sede.
_Avoid_: room, pista (en schema), cancha (en schema)

**Offering**:
Tipo de clase reutilizable. **individual** (`capacity` 1), **dual** (`capacity` 2, Gs. 120.000 en DG) y **grupal** (`capacity` 4). Dual no es un tercer motor: es un offering con cupo 2.
_Avoid_: class type como tres motores, product

**Dual**:
Offering de clase en pareja. Solo cuando el booker trae a su companion. Un checkout; dos Students en la misma session. No es un grupal chico ni dos drop-ins que se coordinan.
_Avoid_: pair as two widget checkouts, dual as small grupal, Limit Bookings = 2 as the pair

**Companion**:
El segundo Student de un Dual. Lo nombra el booker en el checkout (intake solo de Dual: nombre + WhatsApp). No reserva por su cuenta. Tiene ficha propia.
_Avoid_: plus-one without a Student, guest+1 as text only, second login

**Session**:
Instancia concreta de un offering en un intervalo, con sede + court + entrenador. Existe aunque nadie reserve ni pague. Nace al primer booking sobre un hueco de availability.
_Avoid_: class, booking, slot, reservation

**Schedule rule**:
Fila de la planilla madre de *clases clavadas* (día + hora + offering + court + entrenador). En DG se materializa como series (un booking por alumno y ocurrencia); availability es solo la presencia del profe.
_Avoid_: Calendly event type, recurrence (como producto)

**Availability**:
Presencia de un entrenador en una sede: día de semana + franja. Se explota a huecos de 60 min. No es una Session. El primer booking clava offering (individual cupo 1, dual cupo 2 o grupal cupo 4) y asigna pista libre.
_Avoid_: template, slot (como identidad), package

**Series**:
Compromiso de un student a un solo día+hora (una schedule rule) por hasta N sessions. Lo que en la academia se llama clase fija. Mar+mié+vie son tres series, no una recurrencia. Materializa bookings en las ocurrencias con cupo; si alguna ya está llena, ese remaining queda suelto para drop-in. No es la planilla madre, ni el pack, ni un slot infinito.
_Avoid_: recurrence, subscription, membership, cupo fijo (como sinónimo de schedule rule), SimplyBook recurring booking

**Drop-in**:
Un booking de una sola session, sin series. El alumno ve la disponibilidad por entrenador y reserva sin un agente. Puede coexistir con series del mismo student (fijo lun/mié y suelto el sábado).
_Avoid_: appointment, walk-in, clase suelta como producto distinto del pack, reserva mediada por inbox

**Exception**:
Cambio o cancelación de **una** session. No pisa el template, salvo “aplicar a partir de esta semana”.
_Avoid_: override (como identidad de producto), edit-in-place del template

**Absence**:
Entrenador o sede no disponible en una fecha o franja, sin cambiar la schedule rule. Cada session afectada es una Exception. En DG se registra en SimplyBook (special day o block time) y, aparte, se cancelan o reasignan las reservas ya clavadas.
_Avoid_: vacation as edit of the mother, sick as deleting weekly availability, feriado as pruning `madre_rows`

**Booking**:
Hecho operativo: una persona está prevista en una session. No es el cobro.
_Avoid_: reservation, payment, appointment

**Cutoff**:
Horas antes del inicio de la session (default 12) que cada academia fija. Dentro de ese plazo no hay auto-reserva ni cancelación con devolución del entitlement.
_Avoid_: deadline, booking window, last-minute

**Entitlement**:
Permiso de asistir (pack, membresía, cortesía). Paga series y drop-in por igual. No clava un horario.
_Avoid_: credit, pass (como sinónimo de payment), paquete (como si fuera la clase fija)

**Transaction**:
Settlement de dinero. Independiente de si la session ocurre.
_Avoid_: booking, charge (como sinónimo de session)

**Channel**:
Metadata de origen del booking (`web`, `whatsapp`, `admin`). No forka la grilla: el inbox entrega el enlace al booker o a gestionar esa reserva; no clasifica sessions ni pinta celdas.
_Avoid_: inbox as calendar, conversation, bot as booker

**WhatsApp message template**:
Mensaje preaprobado por Meta para hablarle a un student fuera de la ventana de 24 h. Vive en la WABA. No es la planilla madre (`templates`) ni un artefacto de Chatwoot.
_Avoid_: template (a secas), Chatwoot template como fuente

**Student**:
Ficha de **una** academia. Teléfono único dentro de esa academia. No es la persona ni un usuario de software.
_Avoid_: client, user, member, Person

**Guest**:
Student que reserva con nombre + WhatsApp, sin login. La ficha existe igual; el login es para ver esa ficha en otro dispositivo, no un requisito para agendar.
_Avoid_: anonymous, visitor, portal account as a prerequisite to book

**Category**:
Nivel de juego del alumno: principiante, 1–8 o profesional. No es un ranking externo ni un pack.
_Avoid_: level, ranking, handicap

**Playing side**:
Lado de la pista que ocupa el alumno: drive o revés. No es la mano hábil.
_Avoid_: handedness, diestro, zurdo
