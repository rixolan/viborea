import type { ReactNode } from "react";
import type { Session } from "./api";
import { Badge } from "./ui";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function hhmm(iso: string) {
  return new Date(iso).toISOString().slice(11, 16);
}

function dayOffset(iso: string) {
  return (new Date(iso).getUTCDay() + 6) % 7;
}

function dayDate(monday: string, offset: number) {
  const d = new Date(`${monday}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.getUTCDate();
}

export function WeekGrid({
  monday,
  sessions,
  action,
}: {
  monday: string;
  sessions: Session[];
  action: (s: Session) => ReactNode;
}) {
  const hours = [...new Set(sessions.map((s) => hhmm(s.starts_at)))].sort();
  if (hours.length === 0) {
    return <p className="text-sm text-stone-500">No hay clases esta semana.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
            <th className="sticky left-0 z-10 w-14 bg-stone-50 px-2 py-2 font-medium">Hora</th>
            {DAYS.map((label, i) => (
              <th key={label} className="px-2 py-2 font-medium">
                {label} {dayDate(monday, i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour} className="border-b border-stone-100">
              <th className="sticky left-0 z-10 bg-white px-2 py-2 text-right text-xs font-semibold text-stone-500">
                {hour}
              </th>
              {DAYS.map((_, offset) => {
                const items = sessions.filter((s) => dayOffset(s.starts_at) === offset && hhmm(s.starts_at) === hour);
                return (
                  <td key={offset} className="align-top p-1">
                    {items.map((s) => {
                      const full = s.booked >= s.capacity;
                      return (
                        <div
                          key={s.id}
                          className={`mb-1 rounded-lg border p-2 text-xs ${full ? "border-stone-200 bg-stone-50 text-stone-400" : "border-stone-200 bg-white"}`}
                        >
                          <p className="font-medium text-stone-900">{s.offering_name}</p>
                          <p className="text-stone-500">{s.court_name}</p>
                          <p className="text-stone-500">{s.coach_name}</p>
                          <div className="mt-1 flex items-center justify-between gap-1">
                            <Badge tone={s.pending ? "amber" : s.confirmed ? "teal" : "stone"}>
                              {s.booked}/{s.capacity}
                            </Badge>
                            {action(s)}
                          </div>
                        </div>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
