import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { api, type Session, type SessionDetail } from "./api";
import { Badge, Button, Card, Input } from "./ui";

function mondayISO(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - day + 1);
  return x.toISOString().slice(0, 10);
}

function hhmm(iso: string) {
  return new Date(iso).toISOString().slice(11, 16);
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
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-6 text-2xl font-semibold">Entrar</h1>
      <SignIn routing="hash" />
    </div>
  );
}

function ClerkGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  if (!isSignedIn) return <Navigate to="/entrar" replace />;
  return children;
}

function RequireAuth({ children }: { children: ReactNode }) {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) return children;
  return <ClerkGate>{children}</ClerkGate>;
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

function SessionList({
  sessions,
  action,
}: {
  sessions: Session[];
  action: (s: Session) => ReactNode;
}) {
  if (sessions.length === 0) return <p className="text-sm text-stone-500">No hay clases esta semana.</p>;
  return (
    <div className="grid gap-3">
      {sessions.map((s) => (
        <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">
              {hhmm(s.starts_at)} · {s.offering_name}
            </p>
            <p className="text-sm text-stone-600">
              {s.location_name} · {s.court_name} · {s.coach_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={s.pending ? "amber" : s.confirmed ? "teal" : "stone"}>
              {s.booked}/{s.capacity}
            </Badge>
            {action(s)}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function Reservar() {
  const [monday, setMonday] = useState(mondayISO());
  const [locationId, setLocationId] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.catalog().then((c) => setLocations(c.locations)).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    api.week(monday).then((r) => setSessions(r.sessions.filter((s) => !s.cancelled))).catch((e) => setError(e.message));
  }, [monday]);
  const shown = useMemo(
    () => (locationId ? sessions.filter((s) => s.location_id === locationId) : sessions),
    [sessions, locationId],
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reservar</h1>
        <p className="mt-1 text-sm text-stone-600">Elegí sede y un horario con cupo.</p>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <WeekNav monday={monday} onMonday={setMonday} />
        <select
          className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
        >
          <option value="">Todas las sedes</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <SessionList
        sessions={shown}
        action={(s) =>
          s.booked >= s.capacity ? (
            <Badge>Completa</Badge>
          ) : (
            <Link to={`/reservar/${s.id}`} className="text-sm font-medium underline">
              Reservar
            </Link>
          )
        }
      />
    </div>
  );
}

export function ReservarSesion() {
  const { id } = useParams();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!id) return;
    api.session(id).then((r) => setSession(r.session)).catch((e) => setMsg(e.message));
  }, [id]);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      const r = await api.book({ sessionId: id, name, phone });
      setMsg(r.message ?? `Reserva ${r.status}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }
  if (!session) return <p className="text-sm text-stone-500">{msg ?? "Cargando…"}</p>;
  return (
    <div className="mx-auto max-w-md space-y-4">
      <button type="button" className="text-sm text-stone-500" onClick={() => nav(-1)}>
        ← Volver
      </button>
      <h1 className="text-2xl font-semibold">Confirmar reserva</h1>
      <p className="text-sm text-stone-600">
        {session.offering_name} · {hhmm(session.starts_at)} · {session.location_name} · {session.coach_name}
      </p>
      <form className="space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          Nombre
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block text-sm">
          Teléfono
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <Button type="submit">Reservar</Button>
      </form>
      {msg ? <p className="text-sm">{msg}</p> : null}
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
    <RequireAuth>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Academia</h1>
        <p className="text-sm text-stone-600">Grilla de la semana. Filtrá por profe si hace falta.</p>
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
        <SessionList
          sessions={shown}
          action={(s) => (
            <Link to={`/academia/sesion/${s.id}`} className="text-sm underline">
              Abrir
            </Link>
          )}
        />
      </div>
    </RequireAuth>
  );
}

export function AcademiaSesion() {
  const { id } = useParams();
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
    const r = await api.setStatus(bookingId, status);
    setMsg(r.message);
    await load();
  }
  if (!data) return <p className="text-sm text-stone-500">{msg ?? "Cargando…"}</p>;
  const s = data.session;
  return (
    <RequireAuth>
      <div className="space-y-4">
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
    </RequireAuth>
  );
}
