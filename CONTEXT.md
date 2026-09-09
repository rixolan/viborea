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
Tipo de clase reutilizable. Solo **individual** (`capacity` 1) y **grupal** (`capacity` 4, tope por profesor en ese intervalo). No hay dual.
_Avoid_: dual, class type como tres motores, product

**Session**:
Instancia concreta de un offering en un intervalo, con sede + court + entrenador. Existe aunque nadie reserve ni pague. Nace al primer booking sobre un hueco de availability.
_Avoid_: class, booking, slot, reservation

**Schedule rule**:
Fila de la planilla madre de *clases clavadas* (día + hora + offering + court + entrenador). En DG la madre actual es availability, no esto.
_Avoid_: Calendly event type, recurrence (como producto)

**Availability**:
Presencia de un entrenador en una sede: día de semana + franja. Se explota a huecos de 60 min. No es una Session. El primer booking clava offering (individual cupo 1 o grupal cupo 4) y asigna pista libre.
_Avoid_: template, slot (como identidad), package

**Series**:
Compromiso de un student a un solo día+hora (una schedule rule) por hasta N sessions (pack 5 o 10). Mar+jue son dos series. Materializa bookings en las ocurrencias con cupo; si alguna ya está llena, ese remaining queda suelto para auto-reserva. No es la planilla madre ni un slot infinito.
_Avoid_: recurrence, subscription, membership, cupo fijo (como sinónimo de schedule rule)

**Exception**:
Cambio o cancelación de **una** session. No pisa el template, salvo “aplicar a partir de esta semana”.
_Avoid_: override (como identidad de producto), edit-in-place del template

**Booking**:
Hecho operativo: una persona está prevista en una session. No es el cobro.
_Avoid_: reservation, payment, appointment

**Cutoff**:
Horas antes del inicio de la session (default 12) que cada academia fija. Dentro de ese plazo no hay auto-reserva ni cancelación con devolución del entitlement.
_Avoid_: deadline, booking window, last-minute

**Entitlement**:
Permiso de asistir (pack, membresía, cortesía). No es el cobro.
_Avoid_: credit, pass (como sinónimo de payment)

**Transaction**:
Settlement de dinero. Independiente de si la session ocurre.
_Avoid_: booking, charge (como sinónimo de session)

**Channel**:
Metadata de origen del booking (`web`, `whatsapp`, `admin`). No forka la grilla.
_Avoid_: inbox, conversation

**Student**:
Ficha de **una** academia. Teléfono único dentro de esa academia. No es la persona ni un usuario de software.
_Avoid_: client, user, member, Person

**Category**:
Nivel de juego del alumno: principiante, 1–8 o profesional. No es un ranking externo ni un pack.
_Avoid_: level, ranking, handicap

**Playing side**:
Lado de la pista que ocupa el alumno: drive o revés. No es la mano hábil.
_Avoid_: handedness, diestro, zurdo
