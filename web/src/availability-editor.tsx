import { useEffect, useMemo, useState } from "react";
import { api, type Availability, type Location } from "./api";
import { Button } from "./ui";

export const DAYS: Array<[string, string]> = [
  ["monday", "Lunes"],
  ["tuesday", "Martes"],
  ["wednesday", "Miércoles"],
  ["thursday", "Jueves"],
  ["friday", "Viernes"],
  ["saturday", "Sábado"],
  ["sunday", "Domingo"],
];

/** One presence range: unlike Cal.com, a sede is part of the answer. */
export type Range = { locationId: string; startTime: string; endTime: string };
export type Week = Record<string, Range[]>;

const DEFAULT_RANGE = { startTime: "09:00", endTime: "12:00" };

/** Every half hour of the day. A native time input renders 12-hour in an
 * en-US browser and truncates to "01:00 P", which is no way to read a
 * Paraguayan roster; a select shows exactly what we choose. */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const total = i * 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});
const END_OPTIONS = [...TIME_OPTIONS.slice(1), "24:00"];

function minutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(time: string, delta: number): string {
  const total = Math.min(24 * 60, minutes(time) + delta);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function emptyWeek(): Week {
  return Object.fromEntries(DAYS.map(([id]) => [id, [] as Range[]]));
}

/** Stored blocks → the rows the editor shows, earliest first. */
export function weekFrom(blocks: Availability[], coachId: string): Week {
  const week = emptyWeek();
  for (const block of blocks) {
    if (block.coach_id !== coachId) continue;
    week[block.weekday] = [
      ...(week[block.weekday] ?? []),
      { locationId: block.location_id, startTime: block.start_time, endTime: block.end_time },
    ];
  }
  for (const day of Object.keys(week)) {
    week[day].sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
  }
  return week;
}

export function blocksFrom(week: Week): Array<Range & { weekday: string }> {
  return DAYS.flatMap(([weekday]) => (week[weekday] ?? []).map((range) => ({ weekday, ...range })));
}

/** What `+` adds: after the last range, or a sensible first one. */
export function rangeToAdd(existing: Range[], locationId: string): Range {
  const last = existing[existing.length - 1];
  if (!last) return { locationId, ...DEFAULT_RANGE };
  const startTime = addMinutes(last.endTime, 60);
  if (minutes(startTime) + 60 > 24 * 60) {
    return { locationId: last.locationId, startTime: "22:00", endTime: "23:00" };
  }
  return { locationId: last.locationId, startTime, endTime: addMinutes(startTime, 60) };
}

/** Everything the API would reject, said in Spanish before the request. */
export function dayIssue(ranges: Range[]): string | null {
  for (const range of ranges) {
    if (minutes(range.endTime) <= minutes(range.startTime)) {
      return `${range.startTime}–${range.endTime}: la hora de fin va después del inicio`;
    }
    if (minutes(range.endTime) - minutes(range.startTime) < 60) {
      return `${range.startTime}–${range.endTime}: la franja no llega a una hora`;
    }
    if (!range.locationId) return "Falta elegir la sede";
  }
  const sorted = [...ranges].sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
  for (let i = 1; i < sorted.length; i++) {
    if (minutes(sorted[i].startTime) < minutes(sorted[i - 1].endTime)) {
      return `${sorted[i - 1].startTime}–${sorted[i - 1].endTime} se pisa con ${sorted[i].startTime}–${sorted[i].endTime}`;
    }
  }
  return null;
}

export function weekIssues(week: Week): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [weekday] of DAYS) {
    const issue = dayIssue(week[weekday] ?? []);
    if (issue) out[weekday] = issue;
  }
  return out;
}

function sameWeek(a: Week, b: Week): boolean {
  return DAYS.every(([day]) => {
    const x = a[day] ?? [];
    const y = b[day] ?? [];
    return (
      x.length === y.length &&
      x.every((r, i) => r.startTime === y[i].startTime && r.endTime === y[i].endTime && r.locationId === y[i].locationId)
    );
  });
}

export function AvailabilityEditor({
  coachId,
  coachName,
  locations,
  availability,
  getToken,
  onSaved,
}: {
  coachId: string;
  coachName: string;
  locations: Location[];
  availability: Availability[];
  getToken: () => Promise<string | undefined>;
  onSaved: (list: Availability[], message: string) => void;
}) {
  const stored = useMemo(() => weekFrom(availability, coachId), [availability, coachId]);
  const [week, setWeek] = useState<Week>(stored);
  const [remembered, setRemembered] = useState<Week>(emptyWeek());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWeek(stored);
    setRemembered(emptyWeek());
    setError(null);
  }, [stored]);

  const issues = weekIssues(week);
  const dirty = !sameWeek(week, stored);
  const firstLocation = locations[0]?.id ?? "";

  function update(weekday: string, ranges: Range[]) {
    setWeek((prev) => ({ ...prev, [weekday]: ranges }));
  }

  function toggleDay(weekday: string, on: boolean) {
    if (!on) {
      setRemembered((prev) => ({ ...prev, [weekday]: week[weekday] ?? [] }));
      update(weekday, []);
      return;
    }
    const back = remembered[weekday]?.length ? remembered[weekday] : [{ locationId: firstLocation, ...DEFAULT_RANGE }];
    update(weekday, back);
  }

  function copyTo(source: string, targets: string[]) {
    setWeek((prev) => {
      const next = { ...prev };
      for (const target of targets) next[target] = (prev[source] ?? []).map((r) => ({ ...r }));
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await api.saveCoachAvailability(coachId, blocksFrom(week), await getToken());
      onSaved(r.availability, r.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (!locations.length) {
    return <p className="text-sm text-stone-500">Cargá una sede antes de marcar disponibilidad.</p>;
  }

  const blocked = Object.keys(issues).length > 0;
  const hours = blocksFrom(week).reduce((n, r) => n + (minutes(r.endTime) - minutes(r.startTime)) / 60, 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-500">
        Las horas en que {coachName} está en la academia cada semana. Cada franja abre huecos de una hora que el jugador
        convierte en clase al reservar.
      </p>

      <div className="divide-y divide-stone-100 rounded-md border border-stone-200 bg-white">
        {DAYS.map(([weekday, label]) => {
          const ranges = week[weekday] ?? [];
          const on = ranges.length > 0;
          return (
            <div key={weekday} className="px-3 py-3 sm:px-4">
              {/* Phone: day and its buttons on one line, ranges underneath.
                  From `sm`: day, ranges and buttons in a single row. */}
              <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                <label className="flex items-center gap-3 text-sm sm:w-40 sm:shrink-0 sm:pt-1.5">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={on}
                    onChange={(e) => toggleDay(weekday, e.target.checked)}
                    aria-label={label}
                    className="h-4 w-4 accent-stone-900"
                  />
                  <span className={on ? "font-medium" : "text-stone-500"}>{label}</span>
                </label>

                <div className="order-last w-full min-w-0 space-y-2 sm:order-none sm:w-auto sm:flex-1">
                  {!on ? <p className="pt-1.5 text-sm text-stone-400">No viene</p> : null}
                  {ranges.map((range, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <TimeSelect
                        label={`${label} desde`}
                        value={range.startTime}
                        options={TIME_OPTIONS}
                        onChange={(startTime) =>
                          update(
                            weekday,
                            ranges.map((r, j) =>
                              j === i
                                ? {
                                    ...r,
                                    startTime,
                                    // Keep the range valid while it is being edited.
                                    endTime: minutes(r.endTime) > minutes(startTime) ? r.endTime : addMinutes(startTime, 60),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                      <span className="text-stone-400">–</span>
                      <TimeSelect
                        label={`${label} hasta`}
                        value={range.endTime}
                        options={END_OPTIONS.filter((t) => minutes(t) > minutes(range.startTime))}
                        onChange={(endTime) =>
                          update(
                            weekday,
                            ranges.map((r, j) => (j === i ? { ...r, endTime } : r)),
                          )
                        }
                      />
                      <select
                        value={range.locationId}
                        aria-label={`${label} sede`}
                        onChange={(e) =>
                          update(
                            weekday,
                            ranges.map((r, j) => (j === i ? { ...r, locationId: e.target.value } : r)),
                          )
                        }
                        className="order-last h-9 w-full min-w-0 rounded-md border border-stone-300 bg-white px-2 text-sm sm:order-none sm:w-auto sm:max-w-56 sm:flex-1"
                      >
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label={`Quitar ${label} ${range.startTime}`}
                        title="Quitar franja"
                        onClick={() => update(weekday, ranges.filter((_, j) => j !== i))}
                        className="ml-auto grid h-9 w-9 place-items-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 sm:order-last sm:ml-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {issues[weekday] ? <p className="text-xs text-red-700">{issues[weekday]}</p> : null}
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
                  <button
                    type="button"
                    aria-label={`Agregar franja el ${label}`}
                    title="Agregar franja"
                    onClick={() => update(weekday, [...ranges, rangeToAdd(ranges, firstLocation)])}
                    className="grid h-9 w-9 place-items-center rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50"
                  >
                    +
                  </button>
                  <CopyMenu weekday={weekday} label={label} disabled={!on} onCopy={(targets) => copyTo(weekday, targets)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void save()} disabled={!dirty || saving || blocked}>
          {saving ? "Guardando…" : "Guardar disponibilidad"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setWeek(stored)} disabled={!dirty || saving}>
          Descartar
        </Button>
        <span className="text-sm text-stone-500">{hours} h por semana</span>
        {dirty && !blocked ? <span className="text-sm text-amber-700">Sin guardar</span> : null}
        {blocked ? <span className="text-sm text-red-700">Revisá las franjas marcadas</span> : null}
        {error ? <span className="text-sm text-red-700">{error}</span> : null}
      </div>
    </div>
  );
}

function TimeSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-[5.5rem] rounded-md border border-stone-300 bg-white px-2 text-sm"
    >
      {/* A stored time off the half-hour grid stays selectable. */}
      {(options.includes(value) ? options : [value, ...options]).map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

/** Cal.com's copy button: pick which days get this day's ranges. */
function CopyMenu({
  weekday,
  label,
  disabled,
  onCopy,
}: {
  weekday: string;
  label: string;
  disabled: boolean;
  onCopy: (targets: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const others = DAYS.filter(([id]) => id !== weekday);

  useEffect(() => {
    if (!open) setPicked([]);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Copiar ${label} a otros días`}
        title="Copiar a otros días"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="grid h-9 w-9 place-items-center rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
      >
        ⧉
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border border-stone-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs text-stone-500">Copiar {label} a</p>
          <div className="space-y-1.5">
            {others.map(([id, name]) => (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={picked.includes(id)}
                  onChange={(e) => setPicked((prev) => (e.target.checked ? [...prev, id] : prev.filter((p) => p !== id)))}
                  className="h-4 w-4 accent-stone-900"
                />
                {name}
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              disabled={picked.length === 0}
              onClick={() => {
                onCopy(picked);
                setOpen(false);
              }}
            >
              Aplicar
            </button>
            <button
              type="button"
              className="text-xs text-stone-500 underline"
              onClick={() => setPicked(others.filter(([id]) => id !== "saturday" && id !== "sunday").map(([id]) => id))}
            >
              lunes–viernes
            </button>
            <button type="button" className="ml-auto text-xs text-stone-500 underline" onClick={() => setOpen(false)}>
              cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
