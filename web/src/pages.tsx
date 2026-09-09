import { FormEvent, useEffect, useState } from "react";
import { Link, NavLink, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CreateOrganization, SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { api, type HistoryBooking, type Offering, type Session, type SessionDetail, type Student } from "./api";
import { RequireAcademia, RequireAuth } from "./auth";
import { Badge, Button, Card, Input } from "./ui";
import { Booker, coachPhoto } from "./booker";
import { WeekGrid, hhmm } from "./week-grid";
import { PhoneField } from "./phone-field";
import { parsePhone, phoneIssue } from "./phone";

function mondayISO(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - day + 1);
  return x.toISOString().slice(0, 10);
}

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

export function Entrar() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    return <p className="text-sm text-stone-600">Falta VITE_CLERK_PUBLISHABLE_KEY.</p>;
  }
  return <EntrarGate />;
}

function EntrarGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const [params] = useSearchParams();
  const next = params.get("next");
  const after = next?.startsWith("/reservar/") ? next : "/academia";
  if (!isLoaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  if (isSignedIn) return <Navigate to={after} replace />;
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-2 text-2xl font-semibold">Entrar</h1>
      <p className="mb-6 text-sm text-stone-600">Academia o jugador, con la misma pantalla.</p>
      <SignIn routing="hash" forceRedirectUrl={after} signUpUrl="/registro" />
    </div>
  );
}

export function Registro() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    return <p className="text-sm text-stone-600">Falta VITE_CLERK_PUBLISHABLE_KEY.</p>;
  }
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-2 text-2xl font-semibold">Registrar academia</h1>
      <p className="mb-6 text-sm text-stone-600">Después creás el espacio de tu academia.</p>
      <SignUp routing="hash" forceRedirectUrl="/academia/nueva" />
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
        <p className="font-medium">{formatDay(booking.starts_at)} {hhmm(new Date(booking.starts_at))}</p>
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
                      {formatDay(s.starts_at)} {hhmm(new Date(s.starts_at))} · {s.coach_name} · {s.location_name}
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

function formatDay(iso: string) {
  const d = new Date(iso);
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}

export function ReservarSesion() {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return <ReservarSesionForm getToken={async () => null} />;
  }
  return <ReservarSesionAuthed />;
}

function ReservarSesionAuthed() {
  const { getToken } = useAuth();
  return <ReservarSesionForm getToken={getToken} />;
}

function ReservarSesionForm({ getToken }: { getToken: () => Promise<string | null> }) {
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
  useEffect(() => {
    if (!slug || !sessionId) return;
    api.bookerSession(slug, sessionId).then((r) => setSession(r.session)).catch((e) => setMsg(e.message));
    api.bookerCatalog(slug).then((c) => setOfferings(c.offerings.filter((o) => o.capacity === 1 || o.capacity === 4))).catch(() => undefined);
    void (async () => {
      const token = (await getToken()) ?? undefined;
      const r = await api.bookerMe(slug, token).catch(() => null);
      if (r?.student) {
        setMe(r.student);
        setName(r.student.name);
        setPhone(r.student.phone);
      }
    })();
  }, [slug, sessionId, getToken]);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!slug || !sessionId) return;
    setMsg(null);
    if (!me) {
      const issue = phoneIssue(phone);
      if (issue) {
        setMsg(issue);
        return;
      }
    }
    const open = session?.source === "availability";
    if (open && !offeringId) {
      setMsg("Elegí individual o grupal");
      return;
    }
    try {
      const token = (await getToken()) ?? undefined;
      const r = await api.book(
        slug,
        { sessionId, name, phone: me?.phone ?? parsePhone(phone), offeringId: open ? offeringId : undefined },
        token,
      );
      setWaitlist(r.status === "waitlisted");
      setWa(Boolean(r.whatsapp_ok && r.whatsapp !== "dry-run"));
      setDone(true);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }
  if (!session) return <p className="text-sm text-stone-500">{msg ?? "Cargando…"}</p>;
  const back = `/reservar/${slug}`;
  const open = session.source === "availability";
  const clase = open ? offerings.find((o) => o.id === offeringId)?.name ?? "Libre" : session.offering_name;
  const rows = [
    ["Día", formatDay(session.starts_at)],
    ["Hora", hhmm(session.starts_at)],
    ["Sede", session.location_name],
    ["Cancha", session.court_name || "Se asigna al reservar"],
    ["Profe", session.coach_name],
    ["Clase", clase],
  ];
  if (done) {
    rows.push(["A nombre de", name]);
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
          <div className="border-t border-stone-100 px-5 py-4">
            <Button type="button" className="w-full" onClick={() => nav(back)}>
              Otra clase
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Confirmar reserva</h1>
          <div className="rounded-md border border-stone-200 bg-white px-5 py-4 text-sm">
            <p className="font-medium">
              {formatDay(session.starts_at)} · {hhmm(session.starts_at)}
            </p>
            <p className="mt-1 text-stone-600">
              {session.location_name}
              {session.court_name ? ` · ${session.court_name}` : ""} · {session.coach_name}
            </p>
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
            {me ? (
              <p className="text-sm text-stone-600">
                {me.name} · {me.phone}
              </p>
            ) : (
              <>
                <label className="block text-sm">
                  Nombre
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label className="block text-sm">
                  Teléfono
                  <div className="mt-1">
                    <PhoneField value={phone} onChange={setPhone} />
                  </div>
                </label>
              </>
            )}
            <Button type="submit" className="w-full" disabled={!me && Boolean(phoneIssue(phone))}>
              Reservar
            </Button>
            {msg ? (
              <p className="text-sm text-red-700">
                {msg}{" "}
                {msg.includes("cuenta") && slug ? (
                  <Link className="underline" to={`/entrar?next=/reservar/${slug}`}>
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
      <NavLink to="/academia/ajustes" className={item}>
        Reservas
      </NavLink>
    </nav>
  );
}

export function Academia() {
  const { getToken } = useAuth();
  const [monday, setMonday] = useState(mondayISO());
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
  useEffect(() => {
    void (async () => {
      const token = (await getToken()) ?? undefined;
      const r = await api.week(monday, token);
      setSessions(r.sessions);
    })();
  }, [monday, getToken]);
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
        <WeekGrid
          monday={monday}
          sessions={shown}
          action={(s) => (
            <Link to={`/academia/sesion/${s.id}`} className="text-sm underline">
              Abrir
            </Link>
          )}
        />
      </div>
    </RequireAcademia>
  );
}

export function AcademiaSesion() {
  const { id } = useParams();
  const { getToken } = useAuth();
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
          {s.offering_name} · {hhmm(s.starts_at)}
        </h1>
        <p className="text-sm text-stone-600">
          {s.coach_name} · {s.location_name} · {s.court_name}
        </p>
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

export function AcademiaAjustes() {
  const { getToken } = useAuth();
  const [hours, setHours] = useState("12");
  const [msg, setMsg] = useState<string | null>(null);
  const [bookerPath, setBookerPath] = useState("");
  useEffect(() => {
    void (async () => {
      try {
        const token = (await getToken()) ?? undefined;
        const s = await api.settings(token);
        setHours(String(s.cutoff_hours));
        setBookerPath(s.booker_path);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Error");
      }
    })();
  }, [getToken]);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const token = (await getToken()) ?? undefined;
      const r = await api.saveSettings(Number(hours), token);
      setHours(String(r.cutoff_hours));
      setMsg(r.message);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }
  return (
    <RequireAcademia>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Reservas</h1>
          <p className="mt-1 text-sm text-stone-600">Plazo de auto-reserva y de cancelación con devolución del pack.</p>
        </div>
        <AcademiaNav />
        <Card className="max-w-sm space-y-3">
          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block text-sm">
              Horas antes de la clase
              <Input
                type="number"
                min={1}
                max={72}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
              />
            </label>
            <p className="text-xs text-stone-500">
              Default 12. El jugador no reserva ni cancela (con devolución) dentro de ese plazo. El escritorio de la
              academia sí puede anotar después.
            </p>
            <Button type="submit">Guardar</Button>
          </form>
          {msg ? <p className="text-sm">{msg}</p> : null}
        </Card>
        {bookerPath ? (
          <Card className="max-w-lg space-y-2">
            <p className="text-sm font-medium">Link para jugadores</p>
            <p className="break-all text-sm text-stone-600">{`${window.location.origin}${bookerPath}`}</p>
            <p className="text-xs text-stone-500">Mandalo por WhatsApp. El slug no se cambia después.</p>
          </Card>
        ) : null}
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

export function AcademiaProfes() {
  const { getToken } = useAuth();
  const [coachId, setCoachId] = useState("");
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [courts, setCourts] = useState<{ id: string; location_id: string; name: string }[]>([]);
  const [offerings, setOfferings] = useState<{ id: string; name: string }[]>([]);
  const [templates, setTemplates] = useState<
    Array<{
      id: string;
      coach_id: string;
      weekday: string;
      start_time: string;
      end_time: string;
      location_name: string;
      court_name: string;
      offering_name: string;
      location_id: string;
    }>
  >([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [locationId, setLocationId] = useState("");
  const [courtId, setCourtId] = useState("");
  const [offeringId, setOfferingId] = useState("");
  const [weekday, setWeekday] = useState("monday");
  const [startTime, setStartTime] = useState("15:00");

  async function load() {
    const token = (await getToken()) ?? undefined;
    const [cat, tpl] = await Promise.all([api.catalog(token), api.templates(token)]);
    setCoaches(cat.coaches);
    setLocations(cat.locations);
    setCourts(cat.courts);
    setOfferings(cat.offerings);
    setTemplates(tpl.templates);
    if (!coachId && cat.coaches[0]) setCoachId(cat.coaches[0].id);
    if (!locationId && cat.locations[0]) setLocationId(cat.locations[0].id);
    if (!offeringId && cat.offerings[0]) setOfferingId(cat.offerings[0].id);
  }

  useEffect(() => {
    load().catch((e: Error) => setMsg(e.message));
  }, []);

  const courtsHere = courts.filter((c) => c.location_id === locationId);
  const mine = templates.filter((t) => t.coach_id === coachId);

  async function addSlot(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const token = (await getToken()) ?? undefined;
    const court = courtId || courtsHere[0]?.id;
    if (!court) {
      setMsg("Falta cancha en esa sede.");
      return;
    }
    try {
      await api.addTemplate(
        { offeringId, locationId, courtId: court, coachId, weekday, startTime },
        token,
      );
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
          <p className="mt-1 text-sm text-stone-600">Disponibilidad semanal (planilla madre) por entrenador.</p>
        </div>
        <AcademiaNav />
        <div className="flex flex-wrap gap-3">
          {coaches.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCoachId(c.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${coachId === c.id ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}
            >
              <img src={coachPhoto(c.id)} alt="" className="h-7 w-7 rounded-full bg-stone-200 object-cover" />
              {c.name}
            </button>
          ))}
        </div>
        {msg ? <p className="text-sm">{msg}</p> : null}
        <Card>
          <p className="mb-3 font-medium">Horarios fijos</p>
          <ul className="divide-y text-sm">
            {mine.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2">
                <span>
                  {WEEKDAYS.find((w) => w[0] === t.weekday)?.[1] ?? t.weekday} {t.start_time}–{t.end_time}
                  <span className="text-stone-400">
                    {" "}
                    · {t.location_name} · {t.court_name} · {t.offering_name}
                  </span>
                </span>
                <button type="button" className="text-xs underline" onClick={() => removeSlot(t.id)}>
                  Quitar
                </button>
              </li>
            ))}
            {mine.length === 0 ? <li className="py-2 text-stone-500">Sin horarios.</li> : null}
          </ul>
        </Card>
        <Card className="max-w-lg">
          <p className="mb-3 font-medium">Agregar a la planilla</p>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={addSlot}>
            <label className="text-sm">
              Día
              <select className="mt-1 h-10 w-full rounded-lg border px-2 text-sm" value={weekday} onChange={(e) => setWeekday(e.target.value)}>
                {WEEKDAYS.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Hora
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </label>
            <label className="text-sm">
              Sede
              <select className="mt-1 h-10 w-full rounded-lg border px-2 text-sm" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Cancha
              <select className="mt-1 h-10 w-full rounded-lg border px-2 text-sm" value={courtId} onChange={(e) => setCourtId(e.target.value)}>
                {courtsHere.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              Clase
              <select className="mt-1 h-10 w-full rounded-lg border px-2 text-sm" value={offeringId} onChange={(e) => setOfferingId(e.target.value)}>
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Agregar</Button>
            </div>
          </form>
        </Card>
      </div>
    </RequireAcademia>
  );
}
