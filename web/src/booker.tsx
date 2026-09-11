import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { api, type Coach, type HistoryBooking, type Location, type Session, type Student } from "./api";
import { cn } from "./ui";

const DOW = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const COACH_PHOTOS = new Set([
  "coach-fernando-laval",
  "coach-jose-mongelos",
  "coach-mathias-fernandez",
  "coach-matias-popovich",
  "coach-pablo-recalde",
  "coach-rodolfo-silva",
  "coach-rodrigo-avila",
  "coach-sergio-gonzalez",
  "coach-tati-enciso",
  "coach-viani-alfonzo",
]);

const LANGUAGE_LABELS: Record<string, string> = {
  es: "Español",
  gn: "Guaraní",
  pt: "Portugués",
  en: "Inglés",
};

export function coachPhoto(id: string) {
  if (COACH_PHOTOS.has(id)) return `/coaches/${id}.webp`;
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(id)}&backgroundColor=e7e5e4`;
}

export function languageLabels(codes: string[] | undefined) {
  return (codes ?? []).map((code) => LANGUAGE_LABELS[code] ?? code);
}

function mondayISO(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - day + 1);
  return x.toISOString().slice(0, 10);
}

function addDays(monday: string, n: number) {
  const d = new Date(`${monday}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function openSession(s: Session, now = new Date()) {
  return !s.cancelled && s.booked < s.capacity && new Date(s.starts_at) > now;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${String(h).padStart(2, "0")}:${min}`;
}

function weekLabel(monday: string) {
  const a = addDays(monday, 0);
  const b = addDays(monday, 6);
  return `${a.getUTCDate()}–${b.getUTCDate()} ${MONTH_SHORT[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
}

function dayHeading(monday: string, offset: number) {
  const d = addDays(monday, offset);
  return `${DOW[offset].slice(0, 3)} ${d.getUTCDate()}`;
}

function BookerGrid({ slug }: { slug: string }) {
  const nav = useNavigate();
  const [locationId, setLocationId] = useState("");
  const [coachId, setCoachId] = useState<string | null>(null);
  const [monday, setMonday] = useState(mondayISO());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [academyName, setAcademyName] = useState("");

  useEffect(() => {
    api
      .bookerCatalog(slug)
      .then((c) => {
        setLocations(c.locations);
        setCoaches(c.coaches);
        setAcademyName(c.name);
      })
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    if (!locationId) return;
    api
      .bookerWeek(slug, monday)
      .then((r) => setSessions(r.sessions.filter((s) => !s.cancelled)))
      .catch((e: Error) => setError(e.message));
  }, [monday, locationId, slug]);

  const atSede = useMemo(
    () => sessions.filter((s) => s.location_id === locationId && openSession(s)),
    [sessions, locationId],
  );

  const coachesHere = useMemo(() => {
    return coaches.filter((c) => (c.location_ids ?? []).includes(locationId));
  }, [locationId, coaches]);

  useEffect(() => {
    if (coachId && coachId !== "" && !coachesHere.some((c) => c.id === coachId)) {
      setCoachId(null);
    }
  }, [coachesHere, coachId]);

  const slots = useMemo(() => {
    if (coachId === null) return [];
    const list = coachId === "" ? atSede : atSede.filter((s) => s.coach_id === coachId);
    return list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [atSede, coachId]);

  function pickSede(id: string) {
    setLocationId(id);
    setCoachId(null);
  }

  function shiftWeek(delta: number) {
    const d = addDays(monday, delta * 7);
    setMonday(d.toISOString().slice(0, 10));
  }

  const chip = (on: boolean) =>
    cn(
      "rounded-md border px-4 py-3 text-left transition",
      on ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white hover:border-stone-400",
    );

  return (
    <div className="space-y-10">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section>
        <h1 className="text-2xl font-semibold tracking-tight">{academyName || "Reservar"}</h1>
        <p className="mt-1 text-sm text-stone-600">Sede, después profe, después un horario.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {locations.map((l) => {
            const on = locationId === l.id;
            return (
              <div
                key={l.id}
                className={cn(
                  "overflow-hidden rounded-md border bg-white text-left transition",
                  on ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-400",
                )}
              >
                <button type="button" onClick={() => pickSede(l.id)} className="block w-full text-left">
                  {l.image_url ? (
                    <img src={l.image_url} alt="" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="h-28 w-full bg-stone-100" />
                  )}
                  <span className="block px-3 pt-2.5 pb-1">
                    <span className="block text-sm font-medium text-stone-900">{l.name}</span>
                    {l.address ? <span className="mt-0.5 block text-[11px] leading-snug text-stone-500">{l.address}</span> : null}
                  </span>
                </button>
                {l.maps_url ? (
                  <a
                    href={l.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-3 pb-2.5 text-[11px] text-stone-400 hover:text-stone-700"
                  >
                    Ver en Maps
                  </a>
                ) : (
                  <div className="h-2" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {locationId ? (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Profe</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setCoachId("")} className={cn(chip(coachId === ""), "flex h-full items-start gap-3")}>
              <span className="grid h-24 w-20 shrink-0 place-items-center rounded-md bg-stone-100 text-lg text-stone-500">*</span>
              <span>
                <span className="block font-medium">Cualquier profe</span>
                <span className={cn("mt-0.5 block text-[11px]", coachId === "" ? "text-stone-300" : "text-stone-500")}>
                  Horarios de todos
                </span>
              </span>
            </button>
            {coachesHere.map((c) => {
              const langs = languageLabels(c.languages);
              const on = coachId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCoachId(c.id)}
                  className={cn(chip(on), "flex h-full items-start gap-3")}
                >
                  <img
                    src={coachPhoto(c.id)}
                    alt=""
                    className="h-24 w-20 shrink-0 rounded-md bg-stone-100 object-cover object-top"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{c.name}</span>
                    {langs.length ? (
                      <span className={cn("mt-0.5 block text-[11px]", on ? "text-stone-300" : "text-stone-500")}>
                        {langs.join(" · ")}
                      </span>
                    ) : null}
                    {c.bio ? (
                      <span className={cn("mt-1.5 block text-[11px] leading-snug line-clamp-4", on ? "text-stone-300" : "text-stone-500")}>
                        {c.bio}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
          {coachesHere.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">No hay profes asignados a esta sede.</p>
          ) : null}
        </section>
      ) : null}

      {coachId !== null ? (
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{weekLabel(monday)}</h2>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-stone-200 bg-white" onClick={() => shiftWeek(-1)}>
              ‹
            </button>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-stone-200 bg-white" onClick={() => shiftWeek(1)}>
              ›
            </button>
          </div>
          {slots.length === 0 ? (
            <p className="mb-4 text-sm text-stone-500">
              Esta semana no quedan horarios
              {coachId && coachId !== "" ? ` con ${coachesHere.find((c) => c.id === coachId)?.name ?? "este profe"}` : " en esta sede"}.
              Probá la semana siguiente.
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
              const dayIso = addDays(monday, offset).toISOString().slice(0, 10);
              const daySlots = slots.filter((s) => s.starts_at.slice(0, 10) === dayIso);
              return (
                <div key={offset}>
                  <p className="mb-3 text-center text-[11px] font-medium tracking-wide text-stone-500">
                    {dayHeading(monday, offset)}
                  </p>
                  <div className="flex flex-col gap-2">
                    {daySlots.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => nav(`/reservar/${slug}/${encodeURIComponent(s.id)}`)}
                        className="rounded-md border border-stone-200 bg-white px-2 py-3 text-center text-sm hover:border-stone-900"
                      >
                        {formatTime(s.starts_at)}
                        {coachId === "" ? (
                          <span className="mt-0.5 block text-[10px] text-stone-500">{s.coach_name}</span>
                        ) : null}
                        {s.source !== "availability" && s.capacity > 1 ? (
                          <span className="mt-0.5 block text-[10px] text-stone-500">
                            {s.offering_name} {s.booked}/{s.capacity}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

const STATUS: Record<string, string> = {
  pending_payment: "Pendiente",
  confirmed: "Confirmada",
  checked_in: "Asistió",
  cancelled: "Cancelada",
  waitlisted: "Lista de espera",
  no_show: "No vino",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  const days = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]} · ${h}:${m}`;
}

function PlayerPanel({
  slug,
  getToken,
  signedIn,
}: {
  slug: string;
  getToken: (opts?: { skipCache?: boolean }) => Promise<string | null>;
  signedIn: boolean;
}) {
  const [student, setStudent] = useState<Student | null>(null);
  const [bookings, setBookings] = useState<HistoryBooking[]>([]);
  const [academyName, setAcademyName] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void (async () => {
      setLoaded(false);
      const token = (await getToken({ skipCache: true })) ?? undefined;
      const [me, cat] = await Promise.all([
        api.bookerMe(slug, token).catch(() => ({ student: null, bookings: [] as HistoryBooking[] })),
        api.bookerCatalog(slug).catch(() => null),
      ]);
      setStudent(me.student);
      setBookings(me.bookings);
      if (cat?.name) setAcademyName(cat.name);
      setLoaded(true);
    })();
  }, [slug, getToken, signedIn]);
  if (!loaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  const now = Date.now();
  const upcoming = bookings.filter((b) => new Date(b.starts_at).getTime() >= now && b.status !== "cancelled");
  const past = bookings.filter((b) => new Date(b.starts_at).getTime() < now || b.status === "cancelled");
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-stone-500">{academyName || slug}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Tus clases</h1>
        {student ? (
          <p className="mt-1 text-sm text-stone-600">
            {student.name}
            {student.phone ? ` · ${student.phone}` : ""}
          </p>
        ) : null}
      </div>

      {student && !signedIn ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm">
          <p className="text-stone-600">Estas reservas están en este dispositivo. Entrá para verlas en cualquier teléfono.</p>
          <Link
            to={`/entrar/jugador/${slug}`}
            className="inline-flex h-9 shrink-0 items-center rounded-lg bg-stone-900 px-3 font-medium text-white"
          >
            Entrar
          </Link>
        </div>
      ) : null}

      {!student && signedIn ? (
        <div className="rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
          Esta cuenta no tiene ficha en {academyName || "esta academia"}. Reservá una clase (nombre y teléfono) y queda
          ligada a vos.
        </div>
      ) : null}

      {!student && !signedIn ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm">
          <p className="text-stone-600">Podés reservar sin cuenta. Entrá si ya reservaste en otro dispositivo.</p>
          <Link
            to={`/entrar/jugador/${slug}`}
            className="inline-flex h-9 shrink-0 items-center rounded-lg bg-stone-900 px-3 font-medium text-white"
          >
            Entrar
          </Link>
        </div>
      ) : null}

      {student && bookings.length === 0 ? (
        <p className="text-sm text-stone-500">
          Todavía no hay clases.{" "}
          <Link to={`/reservar/${slug}`} className="underline">
            Reservar
          </Link>
        </p>
      ) : null}

      {upcoming.length ? (
        <section className="rounded-md border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Próximas</p>
          <ul className="mt-2 divide-y">
            {upcoming.map((b) => (
              <HistoryRow key={b.id} b={b} />
            ))}
          </ul>
        </section>
      ) : null}

      {past.length ? (
        <section className="rounded-md border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Anteriores</p>
          <ul className="mt-2 divide-y">
            {past.map((b) => (
              <HistoryRow key={b.id} b={b} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function HistoryRow({ b }: { b: HistoryBooking }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
      <div>
        <p className="font-medium">{formatWhen(b.starts_at)}</p>
        <p className="text-stone-600">
          {b.coach_name} · {b.location_name} · {b.court_name}
        </p>
        <p className="text-stone-400">{b.offering_name}</p>
      </div>
      <span className="text-xs text-stone-500">{STATUS[b.status] ?? b.status}</span>
    </li>
  );
}

function PlayerPanelAuthed({ slug }: { slug: string }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  return <PlayerPanel slug={slug} getToken={getToken} signedIn={Boolean(isSignedIn)} />;
}

export function Booker({ slug, view = "reservar" }: { slug: string; view?: "reservar" | "clases" }) {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const tab = (to: string, label: string, on: boolean) => (
    <Link
      to={to}
      className={`rounded-lg px-3 py-1.5 text-sm ${on ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}
    >
      {label}
    </Link>
  );
  return (
    <div className="space-y-6">
      <nav className="flex gap-1">
        {tab(`/reservar/${slug}`, "Reservar", view === "reservar")}
        {tab(`/reservar/${slug}/clases`, "Tus clases", view === "clases")}
      </nav>
      {view === "clases" ? (
        key ? <PlayerPanelAuthed slug={slug} /> : <PlayerPanel slug={slug} getToken={async () => null} signedIn={false} />
      ) : (
        <BookerGrid slug={slug} />
      )}
    </div>
  );
}
