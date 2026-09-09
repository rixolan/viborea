import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Coach, type Location, type Session } from "./api";
import { cn } from "./ui";

const DOW = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function coachPhoto(id: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(id)}&backgroundColor=e7e5e4`;
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
  const [locationId, setLocationId] = useState("");
  const [coachId, setCoachId] = useState<string | null>(null);
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
    if (!locationId) return;
    api
      .week(monday)
      .then((r) => setSessions(r.sessions.filter((s) => !s.cancelled)))
      .catch((e: Error) => setError(e.message));
  }, [monday, locationId]);

  const atSede = useMemo(
    () => sessions.filter((s) => s.location_id === locationId && openSession(s)),
    [sessions, locationId],
  );

  const coachesHere = useMemo(() => {
    const ids = new Set(atSede.map((s) => s.coach_id));
    return coaches.filter((c) => ids.has(c.id));
  }, [atSede, coaches]);

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
      "rounded-2xl border px-5 py-4 text-left transition",
      on ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white hover:border-stone-400",
    );

  return (
    <div className="space-y-10">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Reservar</h1>
        <p className="mt-1 text-sm text-stone-600">Sede, después profe, después un horario.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {locations.map((l) => (
            <button key={l.id} type="button" onClick={() => pickSede(l.id)} className={chip(locationId === l.id)}>
              <p className="font-medium">{l.name}</p>
            </button>
          ))}
        </div>
      </section>

      {locationId ? (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Profe</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setCoachId("")} className={cn(chip(coachId === ""), "flex items-center gap-3")}>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-stone-100 text-lg text-stone-500">*</span>
              <span>
                <span className="block font-medium">Cualquier profe</span>
                <span className={cn("block text-xs", coachId === "" ? "text-stone-300" : "text-stone-500")}>
                  Horarios de todos
                </span>
              </span>
            </button>
            {coachesHere.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCoachId(c.id)}
                className={cn(chip(coachId === c.id), "flex items-center gap-3")}
              >
                <img src={coachPhoto(c.id)} alt="" className="h-12 w-12 rounded-full bg-stone-100 object-cover" />
                <span className="font-medium">{c.name}</span>
              </button>
            ))}
          </div>
          {coachesHere.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Esta semana no hay clases en esta sede.</p>
          ) : null}
        </section>
      ) : null}

      {coachId !== null ? (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight">{weekLabel(monday)}</h2>
              <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white" onClick={() => shiftWeek(-1)}>
                ‹
              </button>
              <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white" onClick={() => shiftWeek(1)}>
                ›
              </button>
            </div>
            <div className="flex rounded-full border border-stone-200 bg-white p-0.5 text-[11px]">
              <button type="button" className={cn("rounded-full px-2.5 py-1", h12 ? "bg-stone-900 text-white" : "text-stone-500")} onClick={() => setH12(true)}>
                12h
              </button>
              <button type="button" className={cn("rounded-full px-2.5 py-1", !h12 ? "bg-stone-900 text-white" : "text-stone-500")} onClick={() => setH12(false)}>
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
                  <p className="mb-3 text-center text-[11px] font-medium tracking-wide text-stone-500">
                    {dayHeading(monday, offset)}
                  </p>
                  <div className="flex flex-col gap-2">
                    {daySlots.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => nav(`/reservar/${s.id}`)}
                        className="rounded-xl border border-stone-200 bg-white px-2 py-3 text-center text-sm hover:border-stone-900"
                      >
                        {formatTime(s.starts_at, h12)}
                        {coachId === "" ? (
                          <span className="mt-0.5 block text-[10px] text-stone-500">{s.coach_name}</span>
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
