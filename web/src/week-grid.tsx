import type { ReactNode } from "react";
import type { Session } from "./api";
import { Badge } from "./ui";
import { addDaysToKey, dayLabel } from "./time";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function WeekGrid({
  monday,
  sessions,
  action,
}: {
  monday: string;
  sessions: Session[];
  action: (s: Session) => ReactNode;
}) {
  // Rows and columns come from the sede's own wall clock, sent by the API.
  const hours = [...new Set(sessions.map((s) => s.local_time))].sort();
  const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => addDaysToKey(monday, offset));
  if (hours.length === 0) {
    return <p className="text-sm text-stone-500">No hay clases esta semana.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
            <th className="sticky left-0 z-10 w-14 bg-stone-50 px-2 py-2 font-medium">Hora</th>
            {days.map((dayKey, i) => (
              <th key={dayKey} className="px-2 py-2 font-medium">
                {DAYS[i]} {dayLabel(dayKey).split(" ")[1]}
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
              {days.map((dayKey) => {
                const items = sessions.filter((s) => s.local_date === dayKey && s.local_time === hour);
                return (
                  <td key={dayKey} className="align-top p-1">
                    {items.map((s) => {
                      const full = s.booked >= s.capacity;
                      const off = s.cancelled === 1;
                      return (
                        <div
                          key={s.id}
                          className={`mb-1 rounded-lg border p-2 text-xs ${
                            off
                              ? "border-dashed border-stone-300 bg-stone-50 text-stone-400"
                              : full
                                ? "border-stone-200 bg-stone-50 text-stone-400"
                                : "border-stone-200 bg-white"
                          }`}
                        >
                          <p className={`font-medium ${off ? "text-stone-400 line-through" : "text-stone-900"}`}>
                            {s.offering_name}
                          </p>
                          <p className="text-stone-500">{s.court_name}</p>
                          <p className="text-stone-500">{s.coach_name}</p>
                          <div className="mt-1 flex items-center justify-between gap-1">
                            <Badge tone={off ? "stone" : s.pending ? "amber" : s.confirmed ? "teal" : "stone"}>
                              {off ? "cancelada" : `${s.booked}/${s.capacity}`}
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
