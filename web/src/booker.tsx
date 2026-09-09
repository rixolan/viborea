import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Coach, type Location, type Session } from "./api";
import { cn } from "./ui";

const DOW = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function coachPhoto(id: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(id)}&backgroundColor=d6d3d1`;
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

function formatTime(iso: string, h12: boolean) {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  if (!h12) return `${String(h).padStart(2, "0")}:${min}`;
  const am = h < 12;
  return `${h % 12 || 12}:${min}${am ? "am" : "pm"}`;
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

export function Booker() {
  const nav = useNavigate();
  const [step, setStep] = useState<"sede" | "profe" | "horarios">("sede");
  const [locationId, setLocationId] = useState("");
  const [coachId, setCoachId] = useState<string>("");
  const [monday, setMonday] = useState(mondayISO());
  const [h12, setH12] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .catalog()
      .then((c) => {
        setLocations(c.locations);
        setCoaches(c.coaches);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (step === "sede") return;
    api
      .week(monday)
      .then((r) => setSessions(r.sessions.filter((s) => !s.cancelled)))
      .catch((e: Error) => setError(e.message));
  }, [monday, step]);

  const atSede = useMemo(
    () => sessions.filter((s) => s.location_id === locationId && openSession(s)),
    [sessions, locationId],
  );

  const coachesHere = useMemo(() => {
    const ids = new Set(atSede.map((s) => s.coach_id));
    return coaches.filter((c) => ids.has(c.id));
  }, [atSede, coaches]);

  const slots = useMemo(() => {
    const list = coachId ? atSede.filter((s) => s.coach_id === coachId) : atSede;
    return list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [atSede, coachId]);

  const loc = locations.find((l) => l.id === locationId);
  const coach = coaches.find((c) => c.id === coachId);

  function pickSede(id: string) {
    setLocationId(id);
    setCoachId("");
    setStep("profe");
  }

  function pickCoach(id: string) {
    setCoachId(id);
    setStep("horarios");
  }

  function shiftWeek(delta: number) {
    const d = addDays(monday, delta * 7);
    setMonday(d.toISOString().slice(0, 10));
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-neutral-950 text-neutral-100 shadow-xl ring-1 ring-white/10">
      {error ? <p className="px-6 pt-4 text-sm text-red-400">{error}</p> : null}

      {step === "sede" ? (
        <div className="p-8">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Paso 1</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Elegí sede</h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {locations.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => pickSede(l.id)}
                className="rounded-2xl border border-white/10 bg-neutral-900 px-5 py-8 text-left hover:border-white/25 hover:bg-neutral-800"
              >
                <p className="text-lg font-medium">{l.name}</p>
                <p className="mt-1 text-sm text-neutral-500">Ver profes y horarios</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "profe" ? (
        <div className="p-8">
          <button type="button" className="text-sm text-neutral-500 hover:text-white" onClick={() => setStep("sede")}>
            ← {loc?.name}
          </button>
          <p className="mt-4 text-xs uppercase tracking-wide text-neutral-500">Paso 2</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">¿Con quién jugás?</h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => pickCoach("")}
              className="rounded-2xl border border-white/10 bg-neutral-900 p-5 text-center hover:border-white/25 hover:bg-neutral-800"
            >
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-neutral-800 text-2xl text-neutral-400">
                *
              </div>
              <p className="mt-3 font-medium">Cualquier profe</p>
              <p className="mt-1 text-xs text-neutral-500">Todos los horarios de {loc?.name}</p>
            </button>
            {coachesHere.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pickCoach(c.id)}
                className="rounded-2xl border border-white/10 bg-neutral-900 p-5 text-center hover:border-white/25 hover:bg-neutral-800"
              >
                <img
                  src={coachPhoto(c.id)}
                  alt=""
                  className="mx-auto h-20 w-20 rounded-full bg-neutral-800 object-cover"
                />
                <p className="mt-3 font-medium">{c.name}</p>
              </button>
            ))}
          </div>
          {coachesHere.length === 0 ? (
            <p className="mt-6 text-sm text-neutral-500">Esta semana no hay clases en esta sede.</p>
          ) : null}
        </div>
      ) : null}

      {step === "horarios" ? (
        <div className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <button type="button" className="text-sm text-neutral-500 hover:text-white" onClick={() => setStep("profe")}>
                ← {coach ? coach.name : "Cualquier profe"}
              </button>
              <div className="mt-2 flex items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight">{weekLabel(monday)}</h1>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5" onClick={() => shiftWeek(-1)}>
                  ‹
                </button>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5" onClick={() => shiftWeek(1)}>
                  ›
                </button>
              </div>
            </div>
            <div className="flex rounded-full bg-neutral-900 p-0.5 text-[11px]">
              <button type="button" className={cn("rounded-full px-2.5 py-1", h12 ? "bg-neutral-700" : "text-neutral-500")} onClick={() => setH12(true)}>
                12h
              </button>
              <button type="button" className={cn("rounded-full px-2.5 py-1", !h12 ? "bg-neutral-700" : "text-neutral-500")} onClick={() => setH12(false)}>
                24h
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
              const dayIso = addDays(monday, offset).toISOString().slice(0, 10);
              const daySlots = slots.filter((s) => s.starts_at.slice(0, 10) === dayIso);
              return (
                <div key={offset}>
                  <p className="mb-3 text-center text-[11px] font-medium tracking-wide text-neutral-500">
                    {dayHeading(monday, offset)}
                  </p>
                  <div className="flex flex-col gap-2">
                    {daySlots.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => nav(`/reservar/${s.id}`)}
                        className="rounded-xl border border-white/15 bg-neutral-950 px-2 py-3 text-center text-sm hover:border-white/30 hover:bg-neutral-900"
                      >
                        {formatTime(s.starts_at, h12)}
                        {!coachId ? (
                          <span className="mt-0.5 block text-[10px] text-neutral-500">{s.coach_name}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
