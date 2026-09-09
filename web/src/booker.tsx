import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Session } from "./api";
import { cn } from "./ui";

const DOW = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function mondayOf(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - day + 1);
  return x.toISOString().slice(0, 10);
}

function mondaysInMonth(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  const out: string[] = [];
  let m = mondayOf(first);
  while (new Date(`${m}T00:00:00.000Z`) <= last) {
    out.push(m);
    const n = new Date(`${m}T00:00:00.000Z`);
    n.setUTCDate(n.getUTCDate() + 7);
    m = n.toISOString().slice(0, 10);
  }
  return out;
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
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
  const h12n = h % 12 || 12;
  return `${h12n}:${min}${am ? "am" : "pm"}`;
}

function ordinalEs(n: number) {
  return `${n}`;
}

export function Booker() {
  const nav = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth());
  const [selected, setSelected] = useState(ymd(now));
  const [h12, setH12] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([]);
  const [academy, setAcademy] = useState({ name: "Academia", timezone: "UTC" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .catalog()
      .then((c) => {
        setLocations(c.locations);
        setCoaches(c.coaches);
        setLocationId((id) => id || c.locations[0]?.id || "");
      })
      .catch((e: Error) => setError(e.message));
    api
      .settings()
      .then((s) => setAcademy({ name: s.name, timezone: s.timezone }))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const weeks = mondaysInMonth(year, month);
    Promise.all(weeks.map((m) => api.week(m)))
      .then((rows) => setSessions(rows.flatMap((r) => r.sessions.filter((s) => !s.cancelled))))
      .catch((e: Error) => setError(e.message));
  }, [year, month]);

  const filtered = useMemo(
    () =>
      sessions.filter((s) => (!locationId || s.location_id === locationId) && (!coachId || s.coach_id === coachId)),
    [sessions, locationId, coachId],
  );

  const openByDay = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of filtered) {
      if (!openSession(s)) continue;
      const key = s.starts_at.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return map;
  }, [filtered]);

  useEffect(() => {
    if (openByDay.has(selected)) return;
    const first = [...openByDay.keys()].sort()[0];
    if (first) setSelected(first);
  }, [openByDay, selected]);

  const first = new Date(Date.UTC(year, month, 1));
  const startPad = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [...Array(startPad).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const selectedDate = new Date(`${selected}T00:00:00.000Z`);
  const slots = openByDay.get(selected) ?? [];
  const today = ymd(now);

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  }

  const locName = locations.find((l) => l.id === locationId)?.name ?? "Sede";
  const coachName = coaches.find((c) => c.id === coachId)?.name ?? "Cualquier profe";
  const selectCls =
    "h-10 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none";

  return (
    <div className="overflow-hidden rounded-3xl bg-neutral-950 text-neutral-100 shadow-xl ring-1 ring-white/10">
      {error ? <p className="px-6 pt-4 text-sm text-red-400">{error}</p> : null}
      <div className="grid gap-0 lg:grid-cols-[220px_1fr_240px]">
        <aside className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
          <p className="text-xs text-neutral-500">Academia</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{academy.name}</p>
          <p className="mt-6 text-sm font-medium">Clase</p>
          <p className="mt-1 text-sm text-neutral-400">
            {locName}
            <span className="text-neutral-600"> · </span>
            {coachName}
          </p>
          <label className="mt-6 block text-xs text-neutral-500">
            Sede
            <select className={`${selectCls} mt-1`} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-xs text-neutral-500">
            Profe
            <select className={`${selectCls} mt-1`} value={coachId} onChange={(e) => setCoachId(e.target.value)}>
              <option value="">Todos</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-8 text-xs text-neutral-500">{academy.timezone}</p>
        </aside>

        <section className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">
              {MONTHS[month]} <span className="font-normal text-neutral-500">{year}</span>
            </h1>
            <div className="flex gap-1">
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-white/5"
                onClick={() => shiftMonth(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-white/5"
                onClick={() => shiftMonth(1)}
              >
                ›
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-medium tracking-wide text-neutral-500">
            {DOW.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {cells.map((day, i) => {
              if (day == null) return <div key={`e-${i}`} />;
              const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const has = (openByDay.get(iso)?.length ?? 0) > 0;
              const isSel = iso === selected;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!has}
                  onClick={() => has && setSelected(iso)}
                  className={cn(
                    "relative grid aspect-square place-items-center rounded-xl text-sm transition",
                    isSel && "bg-white font-semibold text-neutral-950",
                    !isSel && has && "bg-neutral-800 text-white hover:bg-neutral-700",
                    !has && "cursor-default text-neutral-600",
                  )}
                >
                  {day}
                  {isToday && !isSel ? (
                    <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-neutral-400" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="border-t border-white/10 p-6 lg:border-t-0 lg:border-l">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-medium">
              {DOW[selectedDate.getUTCDay() === 0 ? 6 : selectedDate.getUTCDay() - 1].slice(0, 3)} {ordinalEs(selectedDate.getUTCDate())}
            </p>
            <div className="flex rounded-full bg-neutral-900 p-0.5 text-[11px]">
              <button
                type="button"
                className={cn("rounded-full px-2 py-1", h12 ? "bg-neutral-700" : "text-neutral-500")}
                onClick={() => setH12(true)}
              >
                12h
              </button>
              <button
                type="button"
                className={cn("rounded-full px-2 py-1", !h12 ? "bg-neutral-700" : "text-neutral-500")}
                onClick={() => setH12(false)}
              >
                24h
              </button>
            </div>
          </div>
          <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
            {slots.length === 0 ? (
              <p className="text-sm text-neutral-500">No hay horarios este día.</p>
            ) : (
              slots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => nav(`/reservar/${s.id}`)}
                  className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm hover:border-white/20 hover:bg-neutral-800"
                >
                  <span className="font-medium">{formatTime(s.starts_at, h12)}</span>
                  <span className="mt-0.5 block text-[11px] text-neutral-500">
                    {s.court_name} · {s.coach_name} · {s.booked}/{s.capacity}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
