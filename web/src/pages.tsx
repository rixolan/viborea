import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Link, NavLink, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CreateOrganization, SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { accountContact, accountReady, type AccountContact } from "./account";
import {
  api,
  type AcademySettings,
  type Availability,
  type Coach,
  type HistoryBooking,
  type Offering,
  type Session,
  type SessionDetail,
  type StaffCatalog,
  type Student,
  type Template,
} from "./api";
import { RequireAcademia, RequireAuth, useStaffToken } from "./auth";
import { Badge, Button, Card, Input } from "./ui";
import { Booker, coachPhoto, languageLabels } from "./booker";
import { WeekGrid } from "./week-grid";
import { dayAt, dayLongLabel, thisMondayKey } from "./time";
import { AvailabilityEditor } from "./availability-editor";
import { PhoneField } from "./phone-field";
import { parsePhone, phoneIssue } from "./phone";

const clerkFields = { layout: { showOptionalFields: true } };



export function Landing() {
  return (
    <div>
      <section className="mx-auto max-w-5xl px-4 py-20">
        <p className="text-sm font-medium text-stone-500">Software para academias de pádel</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          La academia, en un solo sistema
        </h1>
        <p className="mt-4 max-w-xl text-lg text-stone-600">
          Grilla con sede, pista y entrenador. Packs o clase suelta. Cobro adelantado. Sin doble reserva.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/entrar" className="inline-flex h-11 items-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white">
            Entrar
          </Link>
          <Link to="/registro" className="inline-flex h-11 items-center rounded-lg border border-stone-300 px-5 text-sm font-medium">
            Registrar academia
          </Link>
        </div>
      </section>
    </div>
  );
}

function clerkMissing() {
  return <p className="text-sm text-stone-600">Falta VITE_CLERK_PUBLISHABLE_KEY.</p>;
}

export function Entrar() {
  const [params] = useSearchParams();
  const next = params.get("next") ?? "";
  const player = next.match(/^\/reservar\/([^/]+)/);
  if (player) return <Navigate to={`/entrar/jugador/${player[1]}`} replace />;
  if (next.startsWith("/academia")) return <Navigate to="/entrar/academia" replace />;
  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="mt-1 text-sm text-stone-600">Viborea sirve a academias. Cada una tiene sus jugadores.</p>
      </div>
      <Link
        to="/entrar/jugador"
        className="block rounded-md border border-stone-200 bg-white px-4 py-3 hover:border-stone-900"
      >
        <span className="block font-medium">Soy jugador</span>
        <span className="mt-0.5 block text-sm text-stone-500">Entrá con el enlace de tu academia</span>
      </Link>
      <Link
        to="/entrar/academia"
        className="block rounded-md border border-stone-200 bg-white px-4 py-3 hover:border-stone-900"
      >
        <span className="block font-medium">Soy de la academia</span>
        <span className="mt-0.5 block text-sm text-stone-500">Grilla, roster y cobro</span>
      </Link>
    </div>
  );
}

export function EntrarAcademia() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key) return clerkMissing();
  return <EntrarAcademiaGate />;
}

function EntrarAcademiaGate() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  if (isSignedIn) return <Navigate to="/academia" replace />;
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-2 text-2xl font-semibold">Academia</h1>
      <p className="mb-6 text-sm text-stone-600">Entrá para operar la grilla de tu academia.</p>
      <SignIn routing="hash" forceRedirectUrl="/academia" signUpUrl="/registro" appearance={clerkFields} />
    </div>
  );
}

export function Registro() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key) return clerkMissing();
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-2 text-2xl font-semibold">Registrar academia</h1>
      <p className="mb-6 text-sm text-stone-600">Después creás el espacio de tu academia.</p>
      <SignUp routing="hash" forceRedirectUrl="/academia/nueva" signInUrl="/entrar/academia" appearance={clerkFields} />
    </div>
  );
}

export function EntrarJugadorIndex() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-8">
      <h1 className="text-2xl font-semibold">Jugador</h1>
      <p className="text-sm text-stone-600">
        Entrá con el enlace que te dio tu academia. No publicamos un directorio de academias.
      </p>
      <Link to="/entrar" className="text-sm underline">
        Volver
      </Link>
    </div>
  );
}

export function EntrarJugador() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const { slug } = useParams();
  if (!key) return clerkMissing();
  if (!slug) return <EntrarJugadorIndex />;
  return <EntrarJugadorGate slug={slug} />;
}

function EntrarJugadorGate({ slug }: { slug: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const after = `/reservar/${slug}/clases`;
  if (!isLoaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  if (isSignedIn) return <Navigate to={after} replace />;
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-2 text-2xl font-semibold">Jugador</h1>
      <p className="mb-6 text-sm text-stone-600">
        Entrá para ver tus clases de esta academia en cualquier dispositivo. Podés reservar sin cuenta; este paso las
        ata a vos.
      </p>
      <SignIn routing="hash" forceRedirectUrl={after} signUpUrl={`/entrar/jugador/${slug}/registro`} appearance={clerkFields} />
    </div>
  );
}

export function RegistroJugador() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const { slug } = useParams();
  if (!key) return clerkMissing();
  if (!slug) return <Navigate to="/entrar/jugador" replace />;
  const after = `/reservar/${slug}/clases`;
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-2 text-2xl font-semibold">Crear cuenta de jugador</h1>
      <p className="mb-6 text-sm text-stone-600">
        El correo es tu entrada. El WhatsApp lo cargás en la primera reserva: Clerk no admite números de Paraguay.
      </p>
      <SignUp routing="hash" forceRedirectUrl={after} signInUrl={`/entrar/jugador/${slug}`} appearance={clerkFields} />
    </div>
  );
}

export function AcademiaNueva() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-md py-8">
        <h1 className="mb-2 text-2xl font-semibold">Tu academia</h1>
        <p className="mb-6 text-sm text-stone-600">
          El slug es la URL pública <span className="font-medium">/reservar/tu-slug</span>. No uses reservar, academia,
          api. Quedás como admin.
        </p>
        <CreateOrganization afterCreateOrganizationUrl="/academia" />
      </div>
    </RequireAuth>
  );
}


function WeekNav({ monday, onMonday }: { monday: string; onMonday: (v: string) => void }) {
  const d = new Date(`${monday}T00:00:00.000Z`);
  const prev = new Date(d);
  prev.setUTCDate(d.getUTCDate() - 7);
  const next = new Date(d);
  next.setUTCDate(d.getUTCDate() + 7);
  return (
    <div className="flex items-center gap-3 text-sm">
      <Button variant="outline" type="button" onClick={() => onMonday(prev.toISOString().slice(0, 10))}>
        ← Semana
      </Button>
      <span className="text-stone-600">{monday}</span>
      <Button variant="outline" type="button" onClick={() => onMonday(next.toISOString().slice(0, 10))}>
        Semana →
      </Button>
    </div>
  );
}


export function ReservarIndex() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key) return <ReservarIndexAnon />;
  return <ReservarIndexAuthed />;
}

function ReservarIndexAnon() {
  const [to, setTo] = useState<string | null>(null);
  useEffect(() => {
    api
      .bookerHome()
      .then((r) => setTo(r.slug ? `/reservar/${r.slug}` : "/"))
      .catch(() => setTo("/"));
  }, []);
  if (!to) return <p className="text-sm text-stone-500">Cargando…</p>;
  return <Navigate to={to} replace />;
}

function ReservarIndexAuthed() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [to, setTo] = useState<string | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      if (isSignedIn) {
        try {
          const token = (await getToken()) ?? undefined;
          const s = await api.settings(token);
          setTo(s.booker_path);
          return;
        } catch {
          /* fall through */
        }
      }
      const r = await api.bookerHome().catch(() => ({ slug: null as string | null }));
      setTo(r.slug ? `/reservar/${r.slug}` : "/");
    })();
  }, [isLoaded, isSignedIn, getToken]);
  if (!to) return <p className="text-sm text-stone-500">Cargando…</p>;
  return <Navigate to={to} replace />;
}

export function Reservar() {
  const { slug } = useParams();
  if (!slug) return <ReservarIndex />;
  return <Booker slug={slug} />;
}

export function ReservarClases() {
  const { slug } = useParams();
  if (!slug) return <ReservarIndex />;
  return <Booker slug={slug} view="clases" />;
}

export function ReservarTurno() {
  const { slug, token } = useParams();
  const [booking, setBooking] = useState<(HistoryBooking & { can_change: boolean; offering_id?: string }) | null>(null);
  const [alts, setAlts] = useState<Session[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function load() {
    if (!slug || !token) return;
    const r = await api.manage(slug, token);
    setBooking(r.booking);
    setAlts(r.alternatives);
  }
  useEffect(() => {
    void load().catch((e) => setErr(e instanceof Error ? e.message : "Error"));
  }, [slug, token]);
  if (err) return <p className="text-sm text-red-700">{err}</p>;
  if (!booking || !slug || !token) return <p className="text-sm text-stone-500">Cargando…</p>;
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Tu clase</h1>
      <Card className="space-y-1 p-4">
        <p className="font-medium">
          {dayAt(booking.starts_at, booking.time_zone)} {booking.local_time}
        </p>
        <p className="text-sm text-stone-600">
          {booking.offering_name} · {booking.coach_name} · {booking.location_name} · {booking.court_name}
        </p>
        <p className="text-xs text-stone-400">{booking.status}</p>
      </Card>
      {msg ? <p className="text-sm text-teal-800">{msg}</p> : null}
      {booking.can_change ? (
        <div className="space-y-3">
          <Button
            type="button"
            onClick={() => {
              void (async () => {
                try {
                  const r = await api.manageCancel(slug, token);
                  setMsg(r.message);
                  await load();
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Error");
                }
              })();
            }}
          >
            Cancelar
          </Button>
          {alts.length ? (
            <div>
              <p className="text-sm font-medium">Reprogramar</p>
              <ul className="mt-2 divide-y rounded-md border">
                {alts.slice(0, 12).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span>
                      {dayLongLabel(s.local_date)} {s.local_time} · {s.coach_name} · {s.location_name}
                    </span>
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => {
                        void (async () => {
                          try {
                            const r = await api.manageReschedule(slug, token, s.id, s.offering_id || booking.offering_id);
                            setMsg(r.message);
                            await load();
                          } catch (e) {
                            setErr(e instanceof Error ? e.message : "Error");
                          }
                        })();
                      }}
                    >
                      Elegir
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-stone-500">No hay otro hueco esta semana.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-stone-600">Fuera de plazo: no se puede cancelar ni reprogramar desde acá.</p>
      )}
      <Link to={`/reservar/${slug}`} className="text-sm underline">
        Ver la grilla
      </Link>
    </div>
  );
}

export function ReservarSesion() {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return <ReservarSesionForm getToken={async () => null} signedIn={false} account={null} />;
  }
  return <ReservarSesionAuthed />;
}

function ReservarSesionAuthed() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { openUserProfile } = useClerk();
  if (!isLoaded || !userLoaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  return (
    <ReservarSesionForm
      getToken={getToken}
      signedIn={Boolean(isSignedIn)}
      account={accountContact(user)}
      onEditName={() => openUserProfile()}
      onSaveWhatsapp={
        user
          ? async (whatsapp) => {
              await user.update({
                unsafeMetadata: { ...user.unsafeMetadata, whatsapp },
              });
            }
          : undefined
      }
    />
  );
}

function ReservarSesionForm({
  getToken,
  signedIn,
  account,
  onEditName,
  onSaveWhatsapp,
}: {
  getToken: (opts?: { skipCache?: boolean }) => Promise<string | null>;
  signedIn: boolean;
  account: AccountContact | null;
  onEditName?: () => void;
  onSaveWhatsapp?: (whatsapp: string) => Promise<void>;
}) {
  const { slug, sessionId } = useParams();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [wa, setWa] = useState(false);
  const [waitlist, setWaitlist] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Student | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [offeringId, setOfferingId] = useState("");
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [meReady, setMeReady] = useState(!signedIn);
  const [editingPhone, setEditingPhone] = useState(false);
  useEffect(() => {
    if (!slug || !sessionId) return;
    api.bookerSession(slug, sessionId).then((r) => setSession(r.session)).catch((e) => setMsg(e.message));
    api
      .bookerCatalog(slug)
      .then((c) => {
        setOfferings(c.offerings.filter((o) => o.capacity === 1 || o.capacity === 4));
        setCoaches(c.coaches);
      })
      .catch(() => undefined);
    void (async () => {
      setMeReady(!signedIn);
      const token = (await getToken({ skipCache: true })) ?? undefined;
      const r = await api.bookerMe(slug, token).catch(() => null);
      if (r?.student) {
        setMe(r.student);
        setName(r.student.name);
        setPhone(r.student.phone);
      }
      setMeReady(true);
    })();
  }, [slug, sessionId, getToken, signedIn]);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!slug || !sessionId) return;
    setMsg(null);
    const known = accountReady(account) ? account : me ? { name: me.name, phone: me.phone } : null;
    const open = session?.source === "availability";
    if (open && !offeringId) {
      setMsg("Elegí individual o grupal");
      return;
    }
    let bookName = known?.name ?? name;
    let bookPhone = known?.phone ?? phone;
    if (!accountReady(account) || editingPhone) {
      const issue = phoneIssue(phone || bookPhone);
      if (issue) {
        setMsg(issue);
        return;
      }
      bookPhone = parsePhone(phone || bookPhone);
      if (signedIn && onSaveWhatsapp) {
        try {
          await onSaveWhatsapp(bookPhone);
        } catch {
          setMsg("No se pudo guardar el WhatsApp en la cuenta.");
          return;
        }
      }
    } else {
      bookPhone = parsePhone(known!.phone);
    }
    if (!bookName.trim()) {
      setMsg("Falta el nombre.");
      return;
    }
    try {
      const token = (await getToken({ skipCache: true })) ?? (await getToken()) ?? undefined;
      const r = await api.book(
        slug,
        { sessionId, name: bookName, phone: bookPhone, offeringId: open ? offeringId : undefined },
        token,
      );
      setWaitlist(r.status === "waitlisted");
      setWa(Boolean(r.whatsapp_ok && r.whatsapp !== "dry-run"));
      setDone(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Error";
      setMsg(signedIn && /ficha tiene cuenta/i.test(raw) ? "Ese teléfono ya está ligado a otra cuenta." : raw);
    }
  }
  if (!session) return <p className="text-sm text-stone-500">{msg ?? "Cargando…"}</p>;
  const back = `/reservar/${slug}`;
  const open = session.source === "availability";
  const clase = open ? offerings.find((o) => o.id === offeringId)?.name ?? "Libre" : session.offering_name;
  const coach = coaches.find((c) => c.id === session.coach_id);
  const coachLangs = languageLabels(coach?.languages);
  const rows = [
    ["Día", dayLongLabel(session.local_date)],
    ["Hora", session.local_time],
    ["Sede", session.location_name],
    ["Cancha", session.court_name || "Se asigna al reservar"],
    ["Profe", session.coach_name],
    ["Clase", clase],
  ];
  const known = accountReady(account) ? account : me ? { name: me.name, phone: me.phone } : null;
  if (done) {
    rows.push(["A nombre de", known?.name || name]);
  }
  return (
    <div className="mx-auto max-w-md space-y-4">
      <button type="button" className="text-sm text-stone-500" onClick={() => nav(back)}>
        ← Horarios
      </button>
      {done ? (
        <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
          <div className="bg-stone-900 px-5 py-6 text-white">
            <p className="text-[11px] uppercase tracking-wide text-stone-400">Reserva</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{waitlist ? "Lista de espera" : "Anotada"}</h1>
            <p className="mt-2 text-sm text-stone-300">{waitlist ? "Si se libera un cupo, te avisamos." : "Pendiente de pago"}</p>
          </div>
          <dl className="divide-y divide-stone-100">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-3 text-sm">
                <dt className="text-stone-500">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {wa ? (
            <p className="border-t border-stone-100 px-5 py-3 text-sm text-stone-600">Te escribimos por WhatsApp.</p>
          ) : null}
          <div className="border-t border-stone-100 px-5 py-4 space-y-2">
            <Button type="button" className="w-full" onClick={() => nav(`/reservar/${slug}/clases`)}>
              Ver tus clases
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => nav(back)}>
              Otra clase
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Confirmar reserva</h1>
          <div className="rounded-md border border-stone-200 bg-white px-5 py-4 text-sm">
            <p className="font-medium">
              {dayLongLabel(session.local_date)} · {session.local_time}
            </p>
            <p className="mt-1 text-stone-600">
              {session.location_name}
              {session.court_name ? ` · ${session.court_name}` : ""} · {session.coach_name}
            </p>
            {coach ? (
              <div className="mt-3 flex items-start gap-3 border-t border-stone-100 pt-3">
                <img
                  src={coachPhoto(coach.id)}
                  alt=""
                  className="h-16 w-14 shrink-0 rounded-md bg-stone-100 object-cover object-top"
                />
                <div className="min-w-0">
                  {coachLangs.length ? <p className="text-[11px] text-stone-500">{coachLangs.join(" · ")}</p> : null}
                  {coach.bio ? <p className="mt-1 text-[11px] leading-snug text-stone-500">{coach.bio}</p> : null}
                </div>
              </div>
            ) : null}
          </div>
          <form className="space-y-3" onSubmit={onSubmit}>
            {open ? (
              <div className="flex gap-2">
                {offerings.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOfferingId(o.id)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm ${offeringId === o.id ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200"}`}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">{session.offering_name}</p>
            )}
            {!meReady ? (
              <p className="text-sm text-stone-500">Cargando tu ficha…</p>
            ) : signedIn && known && !editingPhone ? (
              <div className="rounded-md border border-stone-200 bg-white px-4 py-3 text-sm">
                <p className="text-stone-500">Reservás como</p>
                <p className="mt-0.5 font-medium">
                  {known.name}
                  {known.phone ? ` · ${known.phone}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {onEditName ? (
                    <button type="button" className="text-xs underline" onClick={onEditName}>
                      Editar nombre
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => {
                      setPhone(known.phone);
                      setEditingPhone(true);
                    }}
                  >
                    Cambiar WhatsApp
                  </button>
                </div>
              </div>
            ) : signedIn ? (
              <div className="space-y-3">
                {known?.name ? <p className="text-sm text-stone-600">{known.name}</p> : null}
                <label className="block text-sm" htmlFor="phone">
                  WhatsApp
                  <div className="mt-1">
                    <PhoneField value={phone} onChange={setPhone} />
                  </div>
                </label>
                <p className="text-xs text-stone-500">Queda en tu cuenta. Clerk no admite números de Paraguay.</p>
              </div>
            ) : (
              <>
                <label className="block text-sm" htmlFor="name">
                  Nombre
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    autoCapitalize="words"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm" htmlFor="phone">
                  Teléfono
                  <div className="mt-1">
                    <PhoneField value={phone} onChange={setPhone} />
                  </div>
                </label>
              </>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={
                !meReady ||
                (signedIn && known && !editingPhone
                  ? false
                  : Boolean(phoneIssue(phone)))
              }
            >
              Reservar
            </Button>
            {msg ? (
              <p className="text-sm text-red-700">
                {msg}{" "}
                {msg.includes("cuenta") && slug && !signedIn ? (
                  <Link className="underline" to={`/entrar/jugador/${slug}`}>
                    Entrar
                  </Link>
                ) : null}
              </p>
            ) : null}
          </form>
        </>
      )}
    </div>
  );
}

function AcademiaNav() {
  const item = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-sm ${isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`;
  return (
    <nav className="flex flex-wrap gap-1">
      <NavLink to="/academia" end className={item}>
        Grilla
      </NavLink>
      <NavLink to="/academia/profes" className={item}>
        Profes
      </NavLink>
      <NavLink to="/academia/catalogo" className={item}>
        Sedes y clases
      </NavLink>
      <NavLink to="/academia/ajustes" className={item}>
        Reservas
      </NavLink>
    </nav>
  );
}

function AcademiaInner() {
  const getToken = useStaffToken();
  const [monday, setMonday] = useState(thisMondayKey());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coachId, setCoachId] = useState("");
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([]);
  const [bookerPath, setBookerPath] = useState("");
  useEffect(() => {
    void (async () => {
      const token = (await getToken()) ?? undefined;
      const [c, s] = await Promise.all([api.catalog(token), api.settings(token)]);
      setCoaches(c.coaches);
      setBookerPath(s.booker_path);
    })();
  }, [getToken]);
  const [msg, setMsg] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  async function load() {
    const token = (await getToken()) ?? undefined;
    const r = await api.week(monday, token);
    if (r.monday !== monday) setMonday(r.monday);
    setSessions(r.sessions);
  }
  useEffect(() => {
    void load().catch((e: Error) => setMsg(e.message));
  }, [monday, getToken]);
  async function cancel(s: Session) {
    const people = s.booked;
    const warning = people
      ? `Cancelar ${s.offering_name} del ${s.local_date} ${s.local_time}? Se cancelan ${people} reserva(s) y avisamos por WhatsApp.`
      : `Cancelar ${s.offering_name} del ${s.local_date} ${s.local_time}?`;
    if (!window.confirm(warning)) return;
    try {
      const token = (await getToken()) ?? undefined;
      const r = await api.cancelSession(s.id, token);
      setMsg(r.message);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }
  const shown = sessions.filter((s) => !coachId || s.coach_id === coachId);
  return (
    <RequireAcademia>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Academia</h1>
            <p className="mt-1 text-sm text-stone-600">Grilla de la semana. Filtrá por profe si hace falta.</p>
          </div>
          {bookerPath ? (
            <Link
              to={bookerPath}
              className="inline-flex h-10 items-center rounded-lg bg-stone-900 px-4 text-sm font-medium text-white"
            >
              Reservar clases
            </Link>
          ) : null}
        </div>
        <AcademiaNav />
        <div className="flex flex-wrap gap-3">
          <WeekNav monday={monday} onMonday={setMonday} />
          <select
            className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm"
            value={coachId}
            onChange={(e) => setCoachId(e.target.value)}
          >
            <option value="">Todos los profes</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {msg ? <p className="text-sm text-stone-700">{msg}</p> : null}
        <div>
          <Button type="button" variant="outline" onClick={() => setAdding(!adding)}>
            {adding ? "Cerrar" : "Nueva clase"}
          </Button>
        </div>
        {adding ? (
          <NuevaClase
            monday={monday}
            onDone={async (message) => {
              setMsg(message);
              setAdding(false);
              await load();
            }}
          />
        ) : null}
        <WeekGrid
          monday={monday}
          sessions={shown}
          action={(s) => (
            <span className="flex items-center gap-2">
              <Link to={`/academia/sesion/${s.id}`} className="text-sm underline">
                Abrir
              </Link>
              {s.cancelled === 1 ? null : (
                <button type="button" className="text-xs text-stone-500 underline" onClick={() => void cancel(s)}>
                  Cancelar
                </button>
              )}
            </span>
          )}
        />
      </div>
    </RequireAcademia>
  );
}

function AcademiaSesionInner() {
  const { id } = useParams();
  const getToken = useStaffToken();
  const [data, setData] = useState<SessionDetail | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function load() {
    if (!id) return;
    const token = (await getToken()) ?? undefined;
    setData(await api.session(id, token));
  }
  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, [id]);
  async function pay(bookingId: string, status: string) {
    const token = (await getToken()) ?? undefined;
    const r = await api.setStatus(bookingId, status, token);
    setMsg(r.message);
    await load();
  }
  async function cancelClass() {
    if (!id || !data) return;
    const people = data.bookings.filter((b) => b.status !== "cancelled").length;
    const warning = people
      ? `Cancelar la clase? Se cancelan ${people} reserva(s), se devuelven las clases de pack y avisamos por WhatsApp.`
      : "Cancelar la clase?";
    if (!window.confirm(warning)) return;
    try {
      const token = (await getToken()) ?? undefined;
      const r = await api.cancelSession(id, token);
      setMsg(r.message);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }
  if (!data) return <p className="text-sm text-stone-500">{msg ?? "Cargando…"}</p>;
  const s = data.session;
  return (
    <RequireAcademia>
      <div className="space-y-4">
        <AcademiaNav />
        <Link to="/academia" className="text-sm text-stone-500">
          ← Grilla
        </Link>
        <h1 className="text-2xl font-semibold">
          {s.offering_name} · {s.local_time}
        </h1>
        <p className="text-sm text-stone-600">
          {dayLongLabel(s.local_date)} · {s.coach_name} · {s.location_name} · {s.court_name}
        </p>
        {s.cancelled === 1 ? (
          <p className="text-sm text-red-700">Clase cancelada.</p>
        ) : (
          <Button type="button" variant="outline" onClick={() => void cancelClass()}>
            Cancelar la clase
          </Button>
        )}
        {msg ? <p className="text-sm">{msg}</p> : null}
        <Card>
          <p className="mb-3 font-medium">Jugadores</p>
          <ul className="divide-y">
            {data.bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {b.student_name}{" "}
                  <span className="text-stone-400">
                    {b.category}
                    {b.side ? ` · ${b.side}` : ""}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone={b.status === "confirmed" ? "teal" : "amber"}>{b.status}</Badge>
                  {b.status === "confirmed" ? (
                    <button className="underline" type="button" onClick={() => pay(b.id, "pending_payment")}>
                      pendiente
                    </button>
                  ) : (
                    <button className="underline" type="button" onClick={() => pay(b.id, "confirmed")}>
                      pagado
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </RequireAcademia>
  );
}

const WEEKDAYS = [
  ["monday", "Lunes"],
  ["tuesday", "Martes"],
  ["wednesday", "Miércoles"],
  ["thursday", "Jueves"],
  ["friday", "Viernes"],
  ["saturday", "Sábado"],
  ["sunday", "Domingo"],
] as const;

function weekdayLabel(weekday: string): string {
  return WEEKDAYS.find((w) => w[0] === weekday)?.[1] ?? weekday;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-stone-600">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      className="h-10 w-full rounded-md border border-stone-300 bg-white px-2 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

/** One-off class outside the planilla madre. */
function NuevaClase({ monday, onDone }: { monday: string; onDone: (message: string) => Promise<void> }) {
  const getToken = useStaffToken();
  const [cat, setCat] = useState<StaffCatalog | null>(null);
  const [locationId, setLocationId] = useState("");
  const [courtId, setCourtId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [offeringId, setOfferingId] = useState("");
  const [date, setDate] = useState(monday);
  const [startTime, setStartTime] = useState("15:00");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    void (async () => {
      const token = (await getToken()) ?? undefined;
      const c = await api.catalog(token);
      setCat(c);
      setLocationId(c.locations[0]?.id ?? "");
      setCoachId(c.coaches[0]?.id ?? "");
      setOfferingId(c.offerings[0]?.id ?? "");
    })().catch((e: Error) => setMsg(e.message));
  }, [getToken]);
  const courts = (cat?.courts ?? []).filter((c) => c.location_id === locationId);
  useEffect(() => {
    if (courts.length && !courts.some((c) => c.id === courtId)) setCourtId(courts[0].id);
  }, [courtId, courts]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const token = (await getToken()) ?? undefined;
      const r = await api.addSession({ offeringId, courtId, coachId, date, startTime }, token);
      await onDone(r.message);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }
  if (!cat) return <p className="text-sm text-stone-500">{msg ?? "Cargando…"}</p>;
  if (!cat.locations.length || !cat.offerings.length || !cat.coaches.length) {
    return (
      <Card className="max-w-lg space-y-2">
        <p className="text-sm text-stone-600">
          Falta cargar sedes, canchas, profes o tipos de clase antes de poder crear una.
        </p>
        <Link to="/academia/catalogo" className="text-sm underline">
          Ir a Sedes y clases
        </Link>
      </Card>
    );
  }
  return (
    <Card className="max-w-2xl">
      <p className="mb-3 font-medium">Nueva clase</p>
      <form className="grid gap-3 sm:grid-cols-3" onSubmit={submit}>
        <Field label="Día">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label={`Hora (${cat.timezone})`}>
          <Input type="time" step={300} value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </Field>
        <Field label="Clase">
          <Select value={offeringId} onChange={setOfferingId}>
            {cat.offerings.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} · {o.capacity} cupo(s)
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Sede">
          <Select value={locationId} onChange={setLocationId}>
            {cat.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cancha">
          <Select value={courtId} onChange={setCourtId}>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Profe">
          <Select value={coachId} onChange={setCoachId}>
            {cat.coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit">Crear</Button>
          {msg ? <span className="ml-3 text-sm text-red-700">{msg}</span> : null}
        </div>
      </form>
    </Card>
  );
}

function AcademiaAjustesInner() {
  const getToken = useStaffToken();
  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [currency, setCurrency] = useState("");
  const [hours, setHours] = useState("12");
  const [hold, setHold] = useState("0");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    void (async () => {
      try {
        const token = (await getToken()) ?? undefined;
        const s = await api.settings(token);
        setSettings(s);
        setName(s.name);
        setTimezone(s.timezone);
        setCurrency(s.currency);
        setHours(String(s.cutoff_hours));
        setHold(String(s.hold_minutes));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      }
    })();
  }, [getToken]);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      const token = (await getToken()) ?? undefined;
      const r = await api.saveSettings(
        {
          name,
          timezone,
          currency,
          cutoff_hours: Number(hours),
          hold_minutes: Number(hold),
        },
        token,
      );
      setSettings(r);
      setMsg(r.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }
  return (
    <RequireAcademia>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Reservas</h1>
          <p className="mt-1 text-sm text-stone-600">
            Nombre, zona horaria y los plazos con los que el jugador reserva, cancela y paga.
          </p>
        </div>
        <AcademiaNav />
        <Card className="max-w-xl">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <Field label="Nombre de la academia">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Zona horaria">
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="America/Asuncion"
                required
              />
            </Field>
            <Field label="Moneda">
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="PYG"
                required
              />
            </Field>
            <Field label="Plazo de auto-reserva (horas)">
              <Input type="number" min={1} max={72} value={hours} onChange={(e) => setHours(e.target.value)} required />
            </Field>
            <Field label="Vencimiento del pago (minutos)">
              <Input
                type="number"
                min={0}
                max={20160}
                step={15}
                value={hold}
                onChange={(e) => setHold(e.target.value)}
                required
              />
            </Field>
            <div className="sm:col-span-2 space-y-2">
              <p className="text-xs text-stone-500">
                Los horarios de la grilla se leen en esa zona horaria. El jugador no reserva ni cancela (con devolución
                del pack) dentro del plazo de auto-reserva; el escritorio de la academia sí.
              </p>
              <p className="text-xs text-stone-500">
                Vencimiento del pago: una reserva web sin pagar se libera pasados esos minutos y el jugador recibe el
                aviso. En 0 no vence nunca y el cupo queda tomado hasta que alguien lo marque.
              </p>
              <Button type="submit">Guardar</Button>
              {msg ? <span className="ml-3 text-sm text-teal-800">{msg}</span> : null}
              {err ? <span className="ml-3 text-sm text-red-700">{err}</span> : null}
            </div>
          </form>
        </Card>
        {settings ? (
          <Card className="max-w-lg space-y-2">
            <p className="text-sm font-medium">Link para jugadores</p>
            <p className="break-all text-sm text-stone-600">{`${window.location.origin}${settings.booker_path}`}</p>
            <p className="text-xs text-stone-500">Mandalo por WhatsApp. El slug no se cambia después.</p>
          </Card>
        ) : null}
      </div>
    </RequireAcademia>
  );
}

function AcademiaProfesInner() {
  const getToken = useStaffToken();
  const [coachId, setCoachId] = useState("");
  const [cat, setCat] = useState<StaffCatalog | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [locationId, setLocationId] = useState("");
  const [courtId, setCourtId] = useState("");
  const [offeringId, setOfferingId] = useState("");
  const [weekday, setWeekday] = useState("monday");
  const [startTime, setStartTime] = useState("15:00");

  async function load() {
    const token = (await getToken()) ?? undefined;
    const [c, tpl, av] = await Promise.all([api.catalog(token), api.templates(token), api.availability(token)]);
    setCat(c);
    setTemplates(tpl.templates);
    setAvailability(av.availability);
    setCoachId((prev) => prev || c.coaches[0]?.id || "");
    setLocationId((prev) => prev || c.locations[0]?.id || "");
    setOfferingId((prev) => prev || c.offerings[0]?.id || "");
  }

  useEffect(() => {
    load().catch((e: Error) => setMsg(e.message));
  }, []);

  const courtsHere = (cat?.courts ?? []).filter((c) => c.location_id === locationId);
  const mine = templates.filter((t) => t.coach_id === coachId);

  const selectedCoach = cat?.coaches.find((c) => c.id === coachId);

  async function addSlot(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const court = courtId || courtsHere[0]?.id;
    if (!court) {
      setMsg("Falta cancha en esa sede.");
      return;
    }
    try {
      const token = (await getToken()) ?? undefined;
      await api.addTemplate({ offeringId, locationId, courtId: court, coachId, weekday, startTime }, token);
      await load();
      setMsg("Horario agregado a la planilla madre.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  async function removeSlot(id: string) {
    const token = (await getToken()) ?? undefined;
    await api.deleteTemplate(id, token);
    await load();
  }

  return (
    <RequireAcademia>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Profes</h1>
          <p className="mt-1 text-sm text-stone-600">
            Franjas de presencia por entrenador y, si la academia las usa, clases clavadas.
          </p>
        </div>
        <AcademiaNav />
        {cat && cat.coaches.length === 0 ? (
          <Card className="max-w-lg space-y-2">
            <p className="text-sm text-stone-600">Todavía no hay profes cargados.</p>
            <Link to="/academia/catalogo" className="text-sm underline">
              Cargar profes
            </Link>
          </Card>
        ) : null}
        <div className="flex flex-wrap gap-3">
          {(cat?.coaches ?? []).map((c) => {
            const on = coachId === c.id;
            const langs = languageLabels(c.languages);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCoachId(c.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-left text-sm ${on ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}
              >
                <img src={coachPhoto(c.id)} alt="" className="h-7 w-7 rounded-full bg-stone-200 object-cover" />
                <span>
                  <span className="block">{c.name}</span>
                  {langs.length ? (
                    <span className={`block text-[10px] ${on ? "text-stone-300" : "text-stone-500"}`}>
                      {langs.join(" · ")}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        {selectedCoach?.bio ? <p className="text-sm text-stone-600">{selectedCoach.bio}</p> : null}
        {msg ? <p className="text-sm text-stone-700">{msg}</p> : null}

        <Card>
          <p className="font-medium">Disponibilidad de la semana</p>
          <p className="mb-4 text-xs text-stone-500">
            La madre del booker. Lo que marcás acá es lo que el jugador puede reservar.
          </p>
          {coachId ? (
            <AvailabilityEditor
              coachId={coachId}
              coachName={selectedCoach?.name ?? "el profe"}
              locations={cat?.locations ?? []}
              availability={availability}
              getToken={async () => (await getToken()) ?? undefined}
              onSaved={(list, message) => {
                setAvailability(list);
                setMsg(message);
              }}
            />
          ) : (
            <p className="text-sm text-stone-500">Elegí un profe.</p>
          )}
        </Card>

        <Card>
          <p className="font-medium">Clases clavadas</p>
          <p className="mb-3 text-xs text-stone-500">
            Opcional: una fila fija por día y hora que se materializa sola cada semana.
          </p>
          <ul className="divide-y text-sm">
            {mine.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2">
                <span>
                  {weekdayLabel(t.weekday)} {t.start_time}–{t.end_time}
                  <span className="text-stone-400">
                    {" "}
                    · {t.location_name} · {t.court_name} · {t.offering_name}
                  </span>
                </span>
                <button type="button" className="text-xs underline" onClick={() => void removeSlot(t.id)}>
                  Quitar
                </button>
              </li>
            ))}
            {mine.length === 0 ? <li className="py-2 text-stone-500">Sin clases clavadas.</li> : null}
          </ul>
          {coachId && courtsHere.length && cat?.offerings.length ? (
            <form className="mt-4 grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-5" onSubmit={addSlot}>
              <Field label="Día">
                <Select value={weekday} onChange={setWeekday}>
                  {WEEKDAYS.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Hora">
                <Input type="time" step={300} value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </Field>
              <Field label="Sede">
                <Select value={locationId} onChange={setLocationId}>
                  {(cat?.locations ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Cancha">
                <Select value={courtId || courtsHere[0]?.id || ""} onChange={setCourtId}>
                  {courtsHere.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Clase">
                <Select value={offeringId} onChange={setOfferingId}>
                  {(cat?.offerings ?? []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-5">
                <Button type="submit">Agregar</Button>
              </div>
            </form>
          ) : null}
        </Card>
      </div>
    </RequireAcademia>
  );
}

/**
 * Sedes, canchas, profes and class types. Without this screen onboarding an
 * academia meant editing `seed.ts` and deploying.
 */
function AcademiaCatalogoInner() {
  const getToken = useStaffToken();
  const [cat, setCat] = useState<StaffCatalog | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locMaps, setLocMaps] = useState("");
  const [courtFor, setCourtFor] = useState("");
  const [courtName, setCourtName] = useState("");
  const [coachName, setCoachName] = useState("");
  const [coachLangs, setCoachLangs] = useState("es");
  const [coachBio, setCoachBio] = useState("");
  const [offName, setOffName] = useState("");
  const [offCapacity, setOffCapacity] = useState("4");
  const [offDuration, setOffDuration] = useState("60");
  const [offPrice, setOffPrice] = useState("0");

  async function load() {
    const token = (await getToken()) ?? undefined;
    setCat(await api.catalog(token));
  }
  useEffect(() => {
    load().catch((e: Error) => setErr(e.message));
  }, []);

  async function run(what: string, action: (token?: string) => Promise<unknown>) {
    setMsg(null);
    setErr(null);
    try {
      const token = (await getToken()) ?? undefined;
      await action(token);
      await load();
      setMsg(what);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  if (!cat) return <p className="text-sm text-stone-500">{err ?? "Cargando…"}</p>;
  const currency = (n: number) => n.toLocaleString("es-PY");

  return (
    <RequireAcademia>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Sedes y clases</h1>
          <p className="mt-1 text-sm text-stone-600">
            Lo que la grilla necesita para existir: sedes, canchas, profes y tipos de clase.
          </p>
        </div>
        <AcademiaNav />
        {msg ? <p className="text-sm text-teal-800">{msg}</p> : null}
        {err ? <p className="text-sm text-red-700">{err}</p> : null}

        <Card>
          <p className="mb-3 font-medium">Sedes y canchas</p>
          <ul className="divide-y text-sm">
            {cat.locations.map((l) => {
              const courts = cat.courts.filter((c) => c.location_id === l.id);
              return (
                <li key={l.id} className="py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      <span className="font-medium">{l.name}</span>
                      {l.address ? <span className="text-stone-400"> · {l.address}</span> : null}
                    </span>
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => void run("Sede borrada.", (t) => api.deleteLocation(l.id, t))}
                    >
                      Borrar sede
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {courts.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs">
                        {c.name}
                        <button
                          type="button"
                          className="text-stone-500 underline"
                          onClick={() => void run("Cancha borrada.", (t) => api.deleteCourt(c.id, t))}
                        >
                          quitar
                        </button>
                      </span>
                    ))}
                    {courts.length === 0 ? <span className="text-xs text-stone-500">Sin canchas.</span> : null}
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => {
                        setCourtFor(l.id);
                        setCourtName(`Cancha ${courts.length + 1}`);
                      }}
                    >
                      + cancha
                    </button>
                  </div>
                  {courtFor === l.id ? (
                    <form
                      className="mt-3 flex flex-wrap items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void run("Cancha agregada.", (t) => api.addCourt({ locationId: l.id, name: courtName }, t)).then(
                          () => setCourtFor(""),
                        );
                      }}
                    >
                      <span className="w-48">
                        <Input value={courtName} onChange={(e) => setCourtName(e.target.value)} required />
                      </span>
                      <Button type="submit">Agregar</Button>
                      <Button type="button" variant="ghost" onClick={() => setCourtFor("")}>
                        Cancelar
                      </Button>
                    </form>
                  ) : null}
                </li>
              );
            })}
            {cat.locations.length === 0 ? <li className="py-2 text-stone-500">Sin sedes todavía.</li> : null}
          </ul>
          <form
            className="mt-4 grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run("Sede agregada.", (t) =>
                api.addLocation({ name: locName, address: locAddress, mapsUrl: locMaps }, t),
              ).then(() => {
                setLocName("");
                setLocAddress("");
                setLocMaps("");
              });
            }}
          >
            <Field label="Nueva sede">
              <Input value={locName} onChange={(e) => setLocName(e.target.value)} required />
            </Field>
            <Field label="Dirección">
              <Input value={locAddress} onChange={(e) => setLocAddress(e.target.value)} />
            </Field>
            <Field label="Link de Maps">
              <Input value={locMaps} onChange={(e) => setLocMaps(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button type="submit">Agregar sede</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="mb-3 font-medium">Profes</p>
          <ul className="divide-y text-sm">
            {cat.coaches.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-stone-400"> · {languageLabels(c.languages).join(" · ") || "sin idiomas"}</span>
                </span>
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => void run("Profe borrado.", (t) => api.deleteCoach(c.id, t))}
                >
                  Borrar
                </button>
              </li>
            ))}
            {cat.coaches.length === 0 ? <li className="py-2 text-stone-500">Sin profes todavía.</li> : null}
          </ul>
          <form
            className="mt-4 grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run("Profe agregado.", (t) =>
                api.addCoach({ name: coachName, languages: coachLangs, bio: coachBio }, t),
              ).then(() => {
                setCoachName("");
                setCoachBio("");
              });
            }}
          >
            <Field label="Nombre">
              <Input value={coachName} onChange={(e) => setCoachName(e.target.value)} required />
            </Field>
            <Field label="Idiomas (es, pt, gn)">
              <Input value={coachLangs} onChange={(e) => setCoachLangs(e.target.value)} />
            </Field>
            <Field label="Bio">
              <Input value={coachBio} onChange={(e) => setCoachBio(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button type="submit">Agregar profe</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="mb-3 font-medium">Tipos de clase</p>
          <ul className="divide-y text-sm">
            {cat.offerings.map((o) => (
              <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span>
                  <span className="font-medium">{o.name}</span>
                  <span className="text-stone-400">
                    {" "}
                    · {o.capacity} cupo(s) · {o.duration_minutes} min · {currency(o.price)}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => void run("Clase borrada.", (t) => api.deleteOffering(o.id, t))}
                >
                  Borrar
                </button>
              </li>
            ))}
            {cat.offerings.length === 0 ? <li className="py-2 text-stone-500">Sin tipos de clase.</li> : null}
          </ul>
          <form
            className="mt-4 grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              void run("Clase agregada.", (t) =>
                api.addOffering(
                  {
                    name: offName,
                    capacity: Number(offCapacity),
                    durationMinutes: Number(offDuration),
                    price: Number(offPrice),
                  },
                  t,
                ),
              ).then(() => setOffName(""));
            }}
          >
            <Field label="Nombre">
              <Input value={offName} onChange={(e) => setOffName(e.target.value)} required />
            </Field>
            <Field label="Cupos">
              <Input
                type="number"
                min={1}
                max={12}
                value={offCapacity}
                onChange={(e) => setOffCapacity(e.target.value)}
                required
              />
            </Field>
            <Field label="Minutos">
              <Input
                type="number"
                min={15}
                max={240}
                step={5}
                value={offDuration}
                onChange={(e) => setOffDuration(e.target.value)}
                required
              />
            </Field>
            <Field label="Precio">
              <Input type="number" min={0} value={offPrice} onChange={(e) => setOffPrice(e.target.value)} required />
            </Field>
            <div className="flex items-end">
              <Button type="submit">Agregar clase</Button>
            </div>
          </form>
        </Card>
      </div>
    </RequireAcademia>
  );
}

export const Academia = AcademiaInner;
export const AcademiaSesion = AcademiaSesionInner;
export const AcademiaProfes = AcademiaProfesInner;
export const AcademiaCatalogo = AcademiaCatalogoInner;
export const AcademiaAjustes = AcademiaAjustesInner;
