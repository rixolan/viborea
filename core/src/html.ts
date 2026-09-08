import type { Academy, BookingView, Coach, Court, Location, Offering, SessionView, Student } from "./db";
import { addDays } from "./db";
import { dateKey, hhmm } from "./domain/template";
import { PLACEHOLDER_HOURS, slotBusy, PLACEHOLDER_PROFES, PLACEHOLDER_SEDES } from "./placeholders";
const DAYS: { offset: number; label: string }[] = [
  { offset: 0, label: "Lun" },
  { offset: 1, label: "Mar" },
  { offset: 2, label: "Mié" },
  { offset: 3, label: "Jue" },
  { offset: 4, label: "Vie" },
  { offset: 5, label: "Sáb" },
  { offset: 6, label: "Dom" },
];

export function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function courtNoun(locale: string): string {
  const tag = locale.toLowerCase();
  if (tag.startsWith("es-ar") || tag.startsWith("es-py")) return "cancha";
  return "pista";
}

function badge(s: SessionView): { label: string; cls: string } {
  if (s.cancelled) return { label: "Cancelada", cls: "bg-red-100 text-red-800" };
  if (s.booked === 0) return { label: "Sin reservas", cls: "bg-stone-100 text-stone-600" };
  if (s.pending > 0 && s.confirmed === 0) return { label: "Pendiente", cls: "bg-amber-100 text-amber-800" };
  if (s.pending === 0 && s.confirmed > 0) return { label: "Pagado", cls: "bg-teal-100 text-teal-800" };
  return { label: "Pago mixto", cls: "bg-sky-100 text-sky-800" };
}

export function layout(
  academy: Academy,
  title: string,
  body: string,
  flash?: { ok?: string; error?: string },
  kind: "admin" | "public" = "admin",
  publicStep?: 1 | 2 | 3,
): string {
  const brand = kind === "public" ? esc(academy.name) : "Bandeja";
  const brandHref = kind === "public" ? "/reservar" : "/";
  const extra =
    kind === "admin"
      ? `<a class="text-sm font-medium text-teal-800 hover:underline" href="/reservar">Enlace para alumnos</a>`
      : stepBar(publicStep ?? 1);
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · ${esc(academy.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { theme: { extend: { fontFamily: { sans: ['DM Sans', 'ui-sans-serif', 'system-ui'], display: ['Fraunces', 'Georgia', 'serif'] } } } }</script>
</head>
<body class="min-h-screen bg-[#f4f1ea] text-stone-900 antialiased">
  <header class="border-b border-stone-200/80 bg-[#f4f1ea]/80 backdrop-blur">
    <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
      <a href="${brandHref}" class="font-display text-xl tracking-tight">${brand}</a>
      ${extra}
    </div>
  </header>
  <main class="mx-auto max-w-5xl px-4 py-8 space-y-8">
    ${flash?.error ? `<p class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">${esc(flash.error)}</p>` : ""}
    ${flash?.ok ? `<p class="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">${esc(flash.ok)}</p>` : ""}
    ${body}
  </main>
</body>
</html>`;
}

function stepBar(current: 1 | 2 | 3): string {
  const items = [
    { n: 1 as const, label: "Sede" },
    { n: 2 as const, label: "Instructor" },
    { n: 3 as const, label: "Horario" },
  ];
  return `<ol class="flex items-center gap-1 text-xs sm:text-sm">${items
    .map((it, i) => {
      const on = it.n === current;
      const done = it.n < current;
      const cls = on ? "bg-teal-800 text-white" : done ? "bg-teal-100 text-teal-900" : "bg-white text-stone-400";
      const sep = i < items.length - 1 ? `<span class="mx-1 hidden text-stone-300 sm:inline">—</span>` : "";
      return `<li class="flex items-center gap-1"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${cls}"><span>${it.n}</span><span class="hidden sm:inline">${it.label}</span></span>${sep}</li>`;
    })
    .join("")}</ol>`;
}

export function gridPage(opts: {
  academy: Academy;
  monday: Date;
  dayOffset: number;
  sessions: SessionView[];
  locations: Location[];
  courts: Court[];
  coaches: Coach[];
  offerings: Offering[];
  flash?: { ok?: string; error?: string };
}): string {
  const noun = courtNoun(opts.academy.locale);
  const weekParam = dateKey(opts.monday);
  const prev = dateKey(addDays(opts.monday, -7));
  const next = dateKey(addDays(opts.monday, 7));
  const calendar = weekCalendar({
    monday: opts.monday,
    sessions: opts.sessions,
    weekParam,
    kind: "admin",
  });

  const courtOpts = opts.courts
    .map((c) => {
      const loc = opts.locations.find((l) => l.id === c.location_id);
      return `<option value="${esc(c.id)}">${esc(loc?.name ?? "")} · ${esc(c.name)}</option>`;
    })
    .join("");

  const body = `
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Calendario</h1>
        <p class="text-sm text-stone-500">Semana del ${weekParam}. Sede, ${noun}, entrenador y cupos.</p>
      </div>
      <div class="flex gap-2 text-sm">
        <a class="rounded-lg border px-3 py-1.5 hover:bg-white" href="/?week=${prev}">←</a>
        <a class="rounded-lg border px-3 py-1.5 hover:bg-white" href="/?week=${next}">→</a>
      </div>
    </div>
    ${calendar}
    <section class="rounded-xl border border-stone-200 bg-white p-4">
      <h2 class="mb-3 font-semibold">Añadir clase</h2>
      <form method="post" action="/sesiones" class="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="week" value="${weekParam}">
        <label class="text-sm">Día
          <select name="day" class="mt-1 w-full rounded-lg border px-3 py-2">
            ${DAYS.map((d) => `<option value="${d.offset}" ${d.offset === opts.dayOffset ? "selected" : ""}>${d.label}</option>`).join("")}
          </select>
        </label>
        <label class="text-sm">Offering
          <select name="offering_id" class="mt-1 w-full rounded-lg border px-3 py-2">
            ${opts.offerings.map((o) => `<option value="${esc(o.id)}">${esc(o.name)} · cupo ${o.capacity}</option>`).join("")}
          </select>
        </label>
        <label class="text-sm">Hora
          <select name="time" class="mt-1 w-full rounded-lg border px-3 py-2">
            ${["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00", "18:00", "19:00"].map((t) => `<option>${t}</option>`).join("")}
          </select>
        </label>
        <label class="text-sm">Entrenador
          <select name="coach_id" class="mt-1 w-full rounded-lg border px-3 py-2">
            ${opts.coaches.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("")}
          </select>
        </label>
        <label class="text-sm">${noun[0].toUpperCase() + noun.slice(1)}
          <select name="court_id" class="mt-1 w-full rounded-lg border px-3 py-2">
            ${courtOpts}
          </select>
        </label>
        <div class="sm:col-span-2">
          <button class="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">Crear</button>
        </div>
      </form>
    </section>`;

  return layout(opts.academy, "Grilla", body, opts.flash);
}

export function sessionPage(opts: {
  academy: Academy;
  session: SessionView;
  bookings: BookingView[];
  students: Student[];
  week: string;
  day: number;
  flash?: { ok?: string; error?: string };
}): string {
  const s = opts.session;
  const b = badge(s);
  const time = hhmm(new Date(s.starts_at));
  const noun = courtNoun(opts.academy.locale);
  const roster = opts.bookings.length
    ? `<ul class="divide-y">${opts.bookings
        .map((bk) => {
          const pay =
            bk.status === "confirmed"
              ? `<form method="post" action="/reservas/${esc(bk.id)}/estado" class="inline"><input type="hidden" name="week" value="${esc(opts.week)}"><input type="hidden" name="day" value="${opts.day}"><input type="hidden" name="status" value="pending_payment"><button class="text-xs text-stone-500 underline">marcar pendiente</button></form>`
              : bk.status === "pending_payment"
                ? `<form method="post" action="/reservas/${esc(bk.id)}/estado" class="inline"><input type="hidden" name="week" value="${esc(opts.week)}"><input type="hidden" name="day" value="${opts.day}"><input type="hidden" name="status" value="confirmed"><button class="text-xs text-teal-700 underline">marcar pagado</button></form>`
                : "";
          return `<li class="flex items-center justify-between py-2 text-sm">
            <span>${esc(bk.student_name)}</span>
            <span class="flex items-center gap-3"><span class="text-stone-500">${esc(bk.status)}</span>${pay}</span>
          </li>`;
        })
        .join("")}</ul>`
    : `<p class="text-sm text-stone-500">Nadie reservó todavía.</p>`;

  const body = `
    <p class="text-sm"><a class="text-teal-700 hover:underline" href="/?week=${esc(opts.week)}&day=${opts.day}">← Grilla</a></p>
    <div class="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-xl font-semibold">${esc(s.offering_name)} · ${time}</h1>
        <span class="rounded-full px-2 py-0.5 text-[11px] font-medium ${b.cls}">${b.label}</span>
      </div>
      <p class="text-sm text-stone-600">${esc(s.coach_name)} · ${esc(s.location_name)} · ${esc(s.court_name)} (${noun}) · ${s.booked}/${s.capacity}</p>
      ${
        s.cancelled
          ? ""
          : `<form method="post" action="/sesiones/${esc(s.id)}/cancelar" onsubmit="return confirm('¿Cancelar esta clase? La planilla madre no cambia.')">
              <input type="hidden" name="week" value="${esc(opts.week)}">
              <input type="hidden" name="day" value="${opts.day}">
              <button class="text-sm text-red-700 underline">Cancelar esta occurrence</button>
            </form>`
      }
    </div>
    <section class="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
      <h2 class="font-semibold">Roster</h2>
      ${roster}
      ${
        s.cancelled
          ? ""
          : `<form method="post" action="/sesiones/${esc(s.id)}/reservar" class="flex flex-wrap gap-2">
              <input type="hidden" name="week" value="${esc(opts.week)}">
              <input type="hidden" name="day" value="${opts.day}">
              <select name="student_id" class="rounded-lg border px-3 py-2 text-sm">
                ${opts.students.map((st) => `<option value="${esc(st.id)}">${esc(st.name)}</option>`).join("")}
              </select>
              <button class="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">Reservar</button>
            </form>`
      }
    </section>`;

  return layout(opts.academy, s.offering_name, body, opts.flash);
}

function spots(s: SessionView): { left: number; label: string; cls: string; full: boolean } {
  const left = Math.max(0, s.capacity - s.booked);
  if (s.cancelled) return { left: 0, label: "Cancelada", cls: "bg-red-100 text-red-800", full: true };
  if (new Date(s.starts_at) < new Date()) return { left: 0, label: "Pasada", cls: "bg-stone-100 text-stone-500", full: true };
  if (left === 0) return { left: 0, label: "Completa", cls: "bg-stone-200 text-stone-600", full: true };
  if (left === 1) return { left: 1, label: "1 plaza", cls: "bg-teal-100 text-teal-800", full: false };
  return { left, label: `${left} plazas`, cls: "bg-teal-100 text-teal-800", full: false };
}

function dayOffsetOf(monday: Date, startsAt: string): number {
  const d = new Date(startsAt);
  const a = Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
  const b = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((b - a) / 86_400_000);
}

function weekCalendar(opts: {
  monday: Date;
  sessions: SessionView[];
  weekParam: string;
  kind: "admin" | "public";
}): string {
  const hours = [...new Set(opts.sessions.map((s) => hhmm(new Date(s.starts_at))))].sort();
  if (hours.length === 0) {
    return `<p class="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">No hay clases esta semana.</p>`;
  }
  const byCell = new Map<string, SessionView[]>();
  for (const s of opts.sessions) {
    const offset = dayOffsetOf(opts.monday, s.starts_at);
    if (offset < 0 || offset > 6) continue;
    const key = `${offset}|${hhmm(new Date(s.starts_at))}`;
    const list = byCell.get(key) ?? [];
    list.push(s);
    byCell.set(key, list);
  }
  const head = DAYS.map((d) => {
    const dt = addDays(opts.monday, d.offset);
    return `<th class="border-b border-stone-200 px-1 py-2 text-center text-xs font-medium text-stone-600">${d.label}<span class="mt-0.5 block font-normal text-stone-400">${dt.getUTCDate()}</span></th>`;
  }).join("");
  const rows = hours
    .map((hour) => {
      const cells = DAYS.map((d) => {
        const items = byCell.get(`${d.offset}|${hour}`) ?? [];
        const cards = items.map((s) => sessionCard(s, opts.kind, opts.weekParam, d.offset)).join("");
        return `<td class="border-b border-stone-100 p-1 align-top">${cards || `<div class="h-8"></div>`}</td>`;
      }).join("");
      return `<tr><th class="sticky left-0 z-10 bg-stone-50 px-2 py-2 text-right text-xs font-semibold text-stone-500">${hour}</th>${cells}</tr>`;
    })
    .join("");
  return `<div class="overflow-x-auto rounded-xl border border-stone-200 bg-white">
    <table class="w-full min-w-[52rem] border-collapse">
      <thead><tr><th class="sticky left-0 z-10 w-12 bg-white"></th>${head}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function sessionCard(s: SessionView, kind: "admin" | "public", weekParam: string, day: number): string {
  if (kind === "public") {
    const sp = spots(s);
    const inner = `<p class="font-semibold leading-tight">${esc(s.offering_name)}</p>
      <p class="text-[11px] text-stone-500">${esc(s.coach_name)}</p>
      <p class="text-[11px] text-stone-500">${esc(s.location_name)} · ${esc(s.court_name)}</p>
      <p class="mt-1"><span class="rounded-full px-1.5 py-0.5 text-[10px] font-medium ${sp.cls}">${sp.label}</span> <span class="text-[10px] text-stone-400">${s.booked}/${s.capacity}</span></p>`;
    const box = "block rounded-lg border p-2 text-left text-xs";
    if (sp.full) return `<div class="${box} border-stone-200 bg-stone-50 opacity-60">${inner}</div>`;
    return `<a class="${box} border-stone-200 bg-white hover:border-teal-600" href="/reservar/${esc(s.id)}?week=${weekParam}&day=${day}">${inner}</a>`;
  }
  const b = badge(s);
  const dim = s.cancelled ? "opacity-50" : "";
  return `<a class="block rounded-lg border border-stone-200 bg-white p-2 text-left text-xs hover:border-teal-600 ${dim}" href="/sesiones/${esc(s.id)}?week=${weekParam}&day=${day}">
    <p class="font-semibold leading-tight">${esc(s.offering_name)}</p>
    <p class="text-[11px] text-stone-500">${esc(s.coach_name)}</p>
    <p class="text-[11px] text-stone-500">${esc(s.location_name)} · ${esc(s.court_name)}</p>
    <p class="mt-1"><span class="rounded-full px-1.5 py-0.5 text-[10px] font-medium ${b.cls}">${b.label}</span> <span class="text-[10px] text-stone-400">${s.booked}/${s.capacity}</span></p>
  </a>`;
}
export function publicGridPage(opts: {
  academy: Academy;
  monday: Date;
  dayOffset: number;
  sessions: SessionView[];
  locations: Location[];
  coaches: Coach[];
  locationId: string;
  coachId: string;
  flash?: { ok?: string; error?: string };
}): string {
  const noun = courtNoun(opts.academy.locale);
  const weekParam = dateKey(opts.monday);
  const prev = dateKey(addDays(opts.monday, -7));
  const next = dateKey(addDays(opts.monday, 7));
  const q = (week: string) =>
    `/reservar?week=${week}${opts.locationId ? `&sede=${esc(opts.locationId)}` : ""}${opts.coachId ? `&profe=${esc(opts.coachId)}` : ""}`;
  const calendar = weekCalendar({
    monday: opts.monday,
    sessions: opts.sessions,
    weekParam,
    kind: "public",
  });

  const body = `
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Horarios</h1>
        <p class="text-sm text-stone-500">Elige sede, ${noun} e instructor. Semana del ${weekParam}.</p>
      </div>
      <div class="flex gap-2 text-sm">
        <a class="rounded-lg border px-3 py-1.5 hover:bg-white" href="${q(prev)}">←</a>
        <a class="rounded-lg border px-3 py-1.5 hover:bg-white" href="${q(next)}">→</a>
      </div>
    </div>
    <form method="get" action="/reservar" class="flex flex-wrap gap-2">
      <input type="hidden" name="week" value="${weekParam}">
      <select name="sede" class="rounded-lg border px-3 py-2 text-sm" onchange="this.form.submit()">
        <option value="">Todas las sedes</option>
        ${opts.locations.map((l) => `<option value="${esc(l.id)}" ${l.id === opts.locationId ? "selected" : ""}>${esc(l.name)}</option>`).join("")}
      </select>
      <select name="profe" class="rounded-lg border px-3 py-2 text-sm" onchange="this.form.submit()">
        <option value="">Todos los instructores</option>
        ${opts.coaches.map((c) => `<option value="${esc(c.id)}" ${c.id === opts.coachId ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
      </select>
      <noscript><button class="rounded-lg border px-3 py-2 text-sm">Filtrar</button></noscript>
    </form>
    ${calendar}`;

  return layout(opts.academy, "Reservar", body, opts.flash, "public");
}

export function publicBookPage(opts: {
  academy: Academy;
  session: SessionView;
  week: string;
  day: number;
  flash?: { ok?: string; error?: string };
}): string {
  const s = opts.session;
  const sp = spots(s);
  const time = hhmm(new Date(s.starts_at));
  const noun = courtNoun(opts.academy.locale);
  const back = `/reservar?week=${esc(opts.week)}&day=${opts.day}`;
  const form = sp.full
    ? `<p class="text-sm text-stone-600">Esta clase no tiene plazas.</p>`
    : `<form method="post" action="/reservar/${esc(s.id)}" class="grid gap-3 max-w-sm">
        <input type="hidden" name="week" value="${esc(opts.week)}">
        <input type="hidden" name="day" value="${opts.day}">
        <label class="text-sm">Nombre
          <input required name="name" class="mt-1 w-full rounded-lg border px-3 py-2" autocomplete="name">
        </label>
        <label class="text-sm">Teléfono
          <input required name="phone" type="tel" class="mt-1 w-full rounded-lg border px-3 py-2" autocomplete="tel">
        </label>
        <button class="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">Confirmar reserva</button>
      </form>`;

  const body = `
    <p class="text-sm"><a class="text-teal-700 hover:underline" href="${back}">← Horarios</a></p>
    <div class="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-xl font-semibold">${esc(s.offering_name)} · ${time}</h1>
        <span class="rounded-full px-2 py-0.5 text-[11px] font-medium ${sp.cls}">${sp.label}</span>
      </div>
      <p class="text-sm text-stone-600">${esc(s.coach_name)} · ${esc(s.location_name)} · ${esc(s.court_name)} (${noun})</p>
      ${form}
    </div>`;

  return layout(opts.academy, "Reservar", body, opts.flash, "public");
}


type Sede = (typeof PLACEHOLDER_SEDES)[number];
type Profe = (typeof PLACEHOLDER_PROFES)[number];

function crumbs(parts: { href: string; label: string }[]): string {
  return `<nav class="text-sm text-stone-500">${parts
    .map((p, i) =>
      i === parts.length - 1
        ? `<span class="text-stone-800">${esc(p.label)}</span>`
        : `<a class="hover:underline" href="${p.href}">${esc(p.label)}</a> <span class="text-stone-300">/</span> `,
    )
    .join("")}</nav>`;
}

export function pickSedePage(academy: Academy, sedes: readonly Sede[], flash?: { ok?: string; error?: string }): string {
  const cards = sedes
    .map(
      (s) => `<a class="group overflow-hidden rounded-3xl bg-stone-900 shadow-sm ring-1 ring-stone-200/60 transition hover:-translate-y-0.5 hover:shadow-md" href="/reservar/${esc(s.id)}">
        <div class="relative aspect-[4/3]">
          <img src="${esc(s.photo)}" alt="" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" width="800" height="600">
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div class="absolute inset-x-0 bottom-0 p-5 text-white">
            <p class="font-display text-2xl">${esc(s.name)}</p>
            <p class="mt-1 text-sm text-white/80">${esc(s.hint)}</p>
          </div>
        </div>
      </a>`,
    )
    .join("");
  const body = `
    <div class="max-w-xl">
      <h1 class="font-display text-4xl leading-tight">¿En qué sede jugás?</h1>
      <p class="mt-2 text-stone-600">Elegí el club. Después ves instructores y la semana.</p>
    </div>
    <div class="grid gap-5 sm:grid-cols-3">${cards}</div>`;
  return layout(academy, "Elegir sede", body, flash, "public", 1);
}

export function pickProfePage(
  academy: Academy,
  sede: Sede,
  profes: readonly Profe[],
  flash?: { ok?: string; error?: string },
): string {
  const cards = profes
    .map(
      (p) => `<a class="group flex items-center gap-4 rounded-2xl bg-white p-3 pr-4 shadow-sm ring-1 ring-stone-200/80 transition hover:-translate-y-0.5 hover:shadow-md" href="/reservar/${esc(sede.id)}/${esc(p.id)}">
        <img src="${esc(p.photo)}" alt="" class="h-16 w-16 rounded-2xl object-cover" width="128" height="128">
        <span class="min-w-0 flex-1">
          <span class="block font-semibold">${esc(p.name)}</span>
          <span class="text-sm text-stone-500">${esc(sede.name)}</span>
        </span>
        <span class="text-sm text-teal-800 opacity-0 transition group-hover:opacity-100">Ver semana →</span>
      </a>`,
    )
    .join("");
  const body = `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm text-stone-500"><a class="hover:underline" href="/reservar">← Sedes</a></p>
        <h1 class="mt-1 font-display text-4xl leading-tight">Instructores en ${esc(sede.name)}</h1>
      </div>
      <img src="${esc(sede.photo)}" alt="" class="h-16 w-24 rounded-2xl object-cover ring-1 ring-stone-200">
    </div>
    <div class="grid gap-3 sm:grid-cols-2">${cards}</div>`;
  return layout(academy, "Elegir instructor", body, flash, "public", 2);
}

export function placeholderWeekPage(opts: {
  academy: Academy;
  sede: Sede;
  profe: Profe;
  monday: Date;
  flash?: { ok?: string; error?: string };
}): string {
  const weekParam = dateKey(opts.monday);
  const prev = dateKey(addDays(opts.monday, -7));
  const next = dateKey(addDays(opts.monday, 7));
  const base = `/reservar/${opts.sede.id}/${opts.profe.id}`;
  const head = DAYS.map((d) => {
    const dt = addDays(opts.monday, d.offset);
    return `<th class="border-b border-stone-200 px-1 py-3 text-center text-xs font-medium text-stone-500">${d.label}<span class="mt-0.5 block font-display text-base text-stone-800">${dt.getUTCDate()}</span></th>`;
  }).join("");
  const rows = PLACEHOLDER_HOURS.map((hour) => {
    const cells = DAYS.map((d) => {
      const busy = slotBusy(opts.sede.id, opts.profe.id, d.offset, hour);
      if (busy) {
        return `<td class="border-b border-stone-100 p-1 align-top"><div class="rounded-xl bg-stone-100/80 px-2 py-4 text-center text-[11px] text-stone-400">Ocupado</div></td>`;
      }
      const href = `${base}/hora?week=${weekParam}&dia=${d.offset}&hora=${hour}`;
      return `<td class="border-b border-stone-100 p-1 align-top"><a class="block rounded-xl bg-teal-800 px-2 py-4 text-center text-[11px] font-semibold text-white shadow-sm hover:bg-teal-700" href="${href}">Libre</a></td>`;
    }).join("");
    return `<tr><th class="sticky left-0 z-10 bg-[#f4f1ea] px-2 py-2 text-right text-xs font-semibold tabular-nums text-stone-500">${hour}</th>${cells}</tr>`;
  }).join("");
  const body = `
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <img src="${esc(opts.profe.photo)}" alt="" class="h-16 w-16 rounded-2xl object-cover ring-1 ring-stone-200">
        <div>
          <p class="text-sm text-stone-500"><a class="hover:underline" href="/reservar/${opts.sede.id}">← Instructores</a> · ${esc(opts.sede.name)}</p>
          <h1 class="font-display text-3xl leading-tight">${esc(opts.profe.name)}</h1>
        </div>
      </div>
      <div class="flex gap-2 text-sm">
        <a class="rounded-full border border-stone-300 bg-white px-3 py-1.5 hover:bg-stone-50" href="${base}?week=${prev}">←</a>
        <a class="rounded-full border border-stone-300 bg-white px-3 py-1.5 hover:bg-stone-50" href="${base}?week=${next}">→</a>
      </div>
    </div>
    <div class="overflow-x-auto rounded-3xl bg-white p-2 shadow-sm ring-1 ring-stone-200/80">
      <table class="w-full min-w-[52rem] border-collapse">
        <thead><tr><th class="sticky left-0 z-10 w-12 bg-white"></th>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="text-center text-xs text-stone-400">Verde = se puede reservar. Gris = ya tomado.</p>`;
  return layout(opts.academy, "Disponibilidad", body, opts.flash, "public", 3);
}

export function placeholderBookPage(opts: {
  academy: Academy;
  sede: Sede;
  profe: Profe;
  week: string;
  dia: number;
  hora: string;
  flash?: { ok?: string; error?: string };
}): string {
  const dayLabel = DAYS[opts.dia]?.label ?? "";
  const back = `/reservar/${opts.sede.id}/${opts.profe.id}?week=${esc(opts.week)}`;
  const body = `
    <p class="text-sm text-stone-500"><a class="hover:underline" href="${back}">← Semana</a></p>
    <div class="mx-auto grid max-w-lg gap-6">
      <div class="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/80">
        <div class="flex items-center gap-4 p-5">
          <img src="${esc(opts.profe.photo)}" alt="" class="h-16 w-16 rounded-2xl object-cover">
          <div>
            <p class="font-display text-2xl">${esc(opts.profe.name)}</p>
            <p class="text-sm text-stone-500">${esc(opts.sede.name)} · ${dayLabel} ${esc(opts.hora)}</p>
          </div>
        </div>
        <form method="post" action="/reservar/${esc(opts.sede.id)}/${esc(opts.profe.id)}/hora" class="grid gap-3 border-t border-stone-100 p-5">
          <input type="hidden" name="week" value="${esc(opts.week)}">
          <input type="hidden" name="dia" value="${opts.dia}">
          <input type="hidden" name="hora" value="${esc(opts.hora)}">
          <label class="text-sm font-medium">Nombre
            <input required name="name" class="mt-1 w-full rounded-xl border-0 bg-[#f4f1ea] px-3 py-2.5 ring-1 ring-stone-200 focus:ring-2 focus:ring-teal-700" autocomplete="name">
          </label>
          <label class="text-sm font-medium">Teléfono
            <input required name="phone" type="tel" class="mt-1 w-full rounded-xl border-0 bg-[#f4f1ea] px-3 py-2.5 ring-1 ring-stone-200 focus:ring-2 focus:ring-teal-700" autocomplete="tel">
          </label>
          <button class="mt-1 rounded-full bg-teal-800 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700">Confirmar reserva</button>
        </form>
      </div>
    </div>`;
  return layout(opts.academy, "Confirmar", body, opts.flash, "public", 3);
}
