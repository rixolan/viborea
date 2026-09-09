import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { CreateOrganization, SignUp, useAuth, useSignIn } from "@clerk/clerk-react";
import { api, type Session, type SessionDetail } from "./api";
import { RequireAcademia, RequireAuth } from "./auth";
import { Badge, Button, Card, Input } from "./ui";
import { Booker, coachPhoto } from "./booker";
import { WeekGrid, hhmm } from "./week-grid";

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
          <Link to="/reservar" className="inline-flex h-11 items-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white">
            Reservar una clase
          </Link>
          <Link to="/entrar" className="inline-flex h-11 items-center rounded-lg border border-stone-300 px-5 text-sm font-medium">
            Entrar
          </Link>
          <Link to="/registro" className="inline-flex h-11 items-center rounded-lg px-5 text-sm font-medium text-stone-600 underline">
            Registrar academia
          </Link>
        </div>
      </section>
      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-16 sm:grid-cols-2">
          {[
            ["Jugador", "Reservas y saldo del pack.", "/jugador"],
            ["Academia", "Grilla, profes, roster y pago.", "/academia"],
          ].map(([title, body, to]) => (
            <Card key={title}>
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-sm text-stone-600">{body}</p>
              <Link to={to} className="mt-4 inline-block text-sm font-medium text-stone-900 underline">
                Abrir
              </Link>
            </Card>
          ))}
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
  return <EntrarForm />;
}

function EntrarForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!signIn || !setActive) return;
    setMsg(null);
    try {
      const created = await signIn.create({ identifier: email });
      if (created.status === "complete" && created.createdSessionId) {
        await setActive({ session: created.createdSessionId });
        nav("/academia");
        return;
      }
      const passwordFactor = created.supportedFirstFactors?.find((f) => f.strategy === "password");
      if (!passwordFactor) {
        setMsg("Clerk no tiene contraseña como primer factor. Activala en el dashboard.");
        return;
      }
      const res = await signIn.attemptFirstFactor({ strategy: "password", password });
      if (res.status === "complete" && res.createdSessionId) {
        await setActive({ session: res.createdSessionId });
        nav("/academia");
        return;
      }
      setMsg(
        res.status === "needs_second_factor"
          ? "Clerk pide un segundo factor. Dashboard → User & authentication → Multi-factor: off."
          : `No se pudo entrar (${res.status}).`,
      );
    } catch (err) {
      const clerkErr = err as { errors?: Array<{ message?: string }> };
      setMsg(clerkErr.errors?.[0]?.message ?? (err instanceof Error ? err.message : "Error"));
    }
  }
  if (!isLoaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  return (
    <form className="mx-auto max-w-md space-y-3 py-8" onSubmit={onSubmit}>
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <label className="block text-sm">
        Email
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
      </label>
      <label className="block text-sm">
        Contraseña
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </label>
      <Button type="submit">Entrar</Button>
      {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
      <p className="text-sm text-stone-600">
        ¿Academia nueva?{" "}
        <Link to="/registro" className="underline">
          Registrarse
        </Link>
      </p>
    </form>
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
        <p className="mb-6 text-sm text-stone-600">Nombre del club o escuela. Quedás como admin.</p>
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


export function Reservar() {
  return <Booker />;
}

export function ReservarSesion() {
  const { id } = useParams();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!id) return;
    api.session(id).then((r) => setSession(r.session)).catch((e) => setMsg(e.message));
  }, [id]);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setMsg(null);
    try {
      const r = await api.book({ sessionId: id, name, phone });
      setMsg(r.message ?? `Reserva ${r.status}`);
      setDone(true);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }
  if (!session) return <p className="text-sm text-stone-500">{msg ?? "Cargando…"}</p>;
  return (
    <div className="mx-auto max-w-md space-y-4">
      <button type="button" className="text-sm text-stone-500" onClick={() => nav("/reservar")}>
        ← Horarios
      </button>
      <h1 className="text-2xl font-semibold">{done ? "Listo" : "Confirmar reserva"}</h1>
      <p className="text-sm text-stone-600">
        {session.offering_name} · {hhmm(session.starts_at)} · {session.location_name} · {session.coach_name}
      </p>
      {done ? (
        <p className="text-sm">{msg}</p>
      ) : (
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Nombre
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Teléfono
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+595981..." />
          </label>
          <Button type="submit">Reservar</Button>
          {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
        </form>
      )}
    </div>
  );
}

export function Jugador() {
  return (
    <RequireAuth>
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Jugador</h1>
            <p className="text-sm text-stone-600">Tus clases y el pack.</p>
          </div>
          <Link to="/reservar" className="text-sm font-medium underline">
            Reservar clase
          </Link>
        </div>
        <Card>
          <p className="text-sm text-stone-600">Cuando reserves, la clase aparece acá.</p>
        </Card>
      </div>
    </RequireAuth>
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
  const [monday, setMonday] = useState(mondayISO());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coachId, setCoachId] = useState("");
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    api.catalog().then((c) => setCoaches(c.coaches));
  }, []);
  useEffect(() => {
    api.week(monday).then((r) => setSessions(r.sessions));
  }, [monday]);
  const shown = sessions.filter((s) => !coachId || s.coach_id === coachId);
  return (
    <RequireAcademia>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Academia</h1>
          <p className="mt-1 text-sm text-stone-600">Grilla de la semana. Filtrá por profe si hace falta.</p>
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
    setData(await api.session(id));
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
  useEffect(() => {
    api
      .settings()
      .then((s) => setHours(String(s.cutoff_hours)))
      .catch((e: Error) => setMsg(e.message));
  }, []);
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
    const [cat, tpl] = await Promise.all([api.catalog(), api.templates(token)]);
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
              <img src={coachPhoto(c.id)} alt="" className="h-7 w-7 rounded-full bg-stone-200" />
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
