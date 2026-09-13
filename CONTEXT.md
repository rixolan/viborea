# Academia DG

Operación de la academia de pádel de Diego González (Asunción): calendario en SimplyBook.me, bandeja en Chatwoot, WhatsApp vía Meta. Este repo no es un producto de reservas propio ni un tenant de facturación.

## Language

**Academia**:
Academia Diego González. Una sola operación. No es un tenant de software.
_Avoid_: Viborea (como producto hacia el alumno), studio, club (marketplace)

**Location**:
Sede física (Lomas, Elite, Segurola).
_Avoid_: Club, venue, studio (para la sede)

**Coach**:
Entrenador / profe. En SimplyBook es un provider.
_Avoid_: staff area `/profe`, teacher as a product shell

**Offering**:
Tipo de clase: **individual** (cupo 1), **dual** (cupo 2), **grupal** (cupo 4). Dual no es un tercer motor.
_Avoid_: class type como tres motores, product

**Dual**:
Clase en pareja. El booker trae a su companion. Un checkout; dos Students en el mismo hueco.
_Avoid_: pair as two widget checkouts, dual as small grupal

**Companion**:
El segundo Student de un Dual. Lo nombra el booker. Ficha propia. No reserva por su cuenta.
_Avoid_: plus-one without a Student, guest+1 as text only

**Student**:
Alumno de esta academia. Teléfono único. No es un usuario de software.
_Avoid_: client, user, member, Person, cliente

**Series**:
Clase fija: un student en un solo día+hora. Mar+mié+vie son tres series. En SimplyBook son reservas que se repiten; no es un membership.
_Avoid_: recurrence as product, subscription, SimplyBook recurring booking as the domain name

**Drop-in**:
Una sola clase, sin series. El alumno la toma en el widget SimplyBook.
_Avoid_: walk-in, reserva mediada por el bot como booker

**Absence**:
Profe o sede no disponible en una fecha o franja. Se marca en SimplyBook (special day o block time) y, aparte, se cancelan o reasignan las reservas ya clavadas.
_Avoid_: vacation as edit of weekly hours, sick as pruning `madre_rows`

**Booking**:
Una persona está prevista en un hueco de SimplyBook. No es el cobro.
_Avoid_: reservation as identity, payment, appointment, Viborea `bookings` row as calendar of record

**Inbox**:
Chatwoot. Recibe WhatsApp (e Instagram). Entrega el widget o el enlace de esa reserva. No clasifica huecos ni pinta la grilla.
_Avoid_: inbox as calendar, conversation as booker, bot as booker

**WhatsApp message template**:
Mensaje preaprobado por Meta para hablarle a un student fuera de la ventana de 24 h. Vive en la WABA. No es una respuesta preparada de Chatwoot.
_Avoid_: template (a secas), Chatwoot canned reply as Meta template, planilla madre

**Widget**:
SimplyBook público: `https://academiadg.simplybook.me/v2/`. Book / cancel / reschedule. El host sin `/v2/` es el panel interno.
_Avoid_: `/reservar`, viborea.com, SimplyBook Client Login as the player portal
