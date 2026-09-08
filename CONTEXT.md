# Bandeja

Software de gestión de academias de pádel. Controla la grilla (sede, pista, entrenador, horario); no remata con automatización.

## Language

**Studio**:
Academia. Raíz organizativa. No es un tenant de facturación de Bandeja.
_Avoid_: Club (como marketplace), tenant

**Location**:
Sede física de la academia.
_Avoid_: Club, venue, studio (para la sede)

**Court**:
Pista/cancha: recurso escaso con identidad, dentro de una sede.
_Avoid_: room, pista (en schema), cancha (en schema)

**Offering**:
Tipo de clase reutilizable. Individual, dual y grupal se distinguen por `capacity` (1 / 2 / N), no por productos distintos.
_Avoid_: class type como tres motores, product

**Session**:
Instancia concreta de un offering en un intervalo, con sede + court + entrenador. Existe aunque nadie reserve ni pague.
_Avoid_: class, booking, slot, reservation

**Schedule rule**:
Fila de la planilla madre: día de semana + hora + offering + court + entrenador.
_Avoid_: Calendly event type, recurrence (como producto)

**Exception**:
Cambio o cancelación de **una** session. No pisa el template, salvo “aplicar a partir de esta semana”.
_Avoid_: override (como identidad de producto), edit-in-place del template

**Booking**:
Hecho operativo: una persona está prevista en una session. No es el cobro.
_Avoid_: reservation, payment, appointment

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
Alumno de la academia. Persona que reserva; no es un usuario de software.
_Avoid_: client, user, member

**Category**:
Nivel de juego del alumno: principiante, 1–8 o profesional. No es un ranking externo ni un pack.
_Avoid_: level, ranking, handicap

**Playing side**:
Lado de la pista que ocupa el alumno: drive o revés. No es la mano hábil.
_Avoid_: handedness, diestro, zurdo
