import { useMemo, useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Search, Users, MapPin, Ban, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  DEMO_CLASS_TYPES,
  DEMO_COURTS,
  DEMO_LOCATIONS,
  DEMO_SCHEDULE,
  DEMO_STUDIO,
  DEMO_TEACHERS,
} from "@/data/demo/padel-academy";
import { courtNoun } from "@/lib/i18n/court";
import { assertNoOverlap, OverlapError, type SessionInterval } from "@/lib/schedule";

const WEEK: { key: typeof DEMO_SCHEDULE[number]["day"]; label: string }[] = [
  { key: "monday", label: "Lun" },
  { key: "tuesday", label: "Mar" },
  { key: "wednesday", label: "Mié" },
  { key: "thursday", label: "Jue" },
  { key: "friday", label: "Vie" },
  { key: "saturday", label: "Sáb" },
  { key: "sunday", label: "Dom" },
];

const TIMES = ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

type PaymentBadge = "pagado" | "pendiente" | "mixto" | "vacio";

interface GridClass {
  id: string;
  name: string;
  teacher: string;
  teacherId: string;
  time: string;
  endTime: string;
  courtId: string;
  courtName: string;
  location: string;
  locationId: string;
  capacity: number;
  booked: number;
  waitlisted: number;
  isCancelled: boolean;
  payment: PaymentBadge;
}

function endTime(start: string, durationMin: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + durationMin;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function paymentFor(id: string, booked: number): PaymentBadge {
  if (booked === 0) return "vacio";
  const n = id.charCodeAt(id.length - 1) % 3;
  if (n === 0) return "pagado";
  if (n === 1) return "pendiente";
  return "mixto";
}

function toInterval(row: GridClass, dayOffset: number): SessionInterval {
  const [sh, sm] = row.time.split(":").map(Number);
  const [eh, em] = row.endTime.split(":").map(Number);
  return {
    id: row.id,
    courtId: row.courtId,
    coachStaffId: row.teacherId,
    startsAt: new Date(Date.UTC(2026, 8, 7 + dayOffset, sh, sm)),
    endsAt: new Date(Date.UTC(2026, 8, 7 + dayOffset, eh, em)),
    cancelled: row.isCancelled,
  };
}

function buildWeek(): Record<string, GridClass[]> {
  const week: Record<string, GridClass[]> = {};
  for (const d of WEEK) week[d.key] = [];
  for (const slot of DEMO_SCHEDULE) {
    const offering = DEMO_CLASS_TYPES.find((c) => c.id === slot.class_type_id);
    const teacher = DEMO_TEACHERS.find((t) => t.profile.id === slot.teacher_id);
    const location = DEMO_LOCATIONS.find((l) => l.id === slot.location_id);
    const court = DEMO_COURTS.find((c) => c.id === slot.court_id);
    const duration = offering?.duration_minutes ?? 60;
    const booked = Math.min(offering?.default_capacity ?? 1, slot.id.length % ((offering?.default_capacity ?? 1) + 1));
    week[slot.day].push({
      id: slot.id,
      name: offering?.name ?? "Clase",
      teacher: teacher?.profile.display_name ?? "—",
      teacherId: slot.teacher_id,
      time: slot.time,
      endTime: endTime(slot.time, duration),
      courtId: slot.court_id,
      courtName: court?.name ?? slot.court_id,
      location: location?.name ?? "—",
      locationId: slot.location_id,
      capacity: offering?.default_capacity ?? 1,
      booked,
      waitlisted: booked >= (offering?.default_capacity ?? 1) ? 1 : 0,
      isCancelled: false,
      payment: paymentFor(slot.id, booked),
    });
  }
  for (const d of WEEK) {
    week[d.key].sort((a, b) => a.time.localeCompare(b.time));
  }
  return week;
}

const PAYMENT_LABEL: Record<PaymentBadge, string> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  mixto: "Pago mixto",
  vacio: "Sin reservas",
};

export default function ScheduleManage() {
  const noun = courtNoun(DEMO_STUDIO.locale);
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<(typeof WEEK)[number]["key"]>("monday");
  const [searchQuery, setSearchQuery] = useState("");
  const [schedule, setSchedule] = useState(buildWeek);
  const [addOpen, setAddOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<GridClass | null>(null);
  const [newOffering, setNewOffering] = useState(DEMO_CLASS_TYPES[0]?.id ?? "");
  const [newTime, setNewTime] = useState("15:00");
  const [newTeacher, setNewTeacher] = useState(DEMO_TEACHERS[0]?.profile.id ?? "");
  const [newCourt, setNewCourt] = useState(DEMO_COURTS[0]?.id ?? "");

  const dayOffset = WEEK.findIndex((d) => d.key === selectedDay);
  const classes = schedule[selectedDay] ?? [];
  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const courtOptions = useMemo(
    () =>
      DEMO_COURTS.map((court) => {
        const loc = DEMO_LOCATIONS.find((l) => l.id === court.location_id);
        return { ...court, locationName: loc?.name ?? "" };
      }),
    [],
  );

  const handleAdd = () => {
    const offering = DEMO_CLASS_TYPES.find((c) => c.id === newOffering);
    const teacher = DEMO_TEACHERS.find((t) => t.profile.id === newTeacher);
    const court = DEMO_COURTS.find((c) => c.id === newCourt);
    const location = DEMO_LOCATIONS.find((l) => l.id === court?.location_id);
    if (!offering || !teacher || !court || !location) return;

    const row: GridClass = {
      id: `oneoff-${Date.now()}`,
      name: offering.name,
      teacher: teacher.profile.display_name ?? teacher.profile.email,
      teacherId: teacher.profile.id,
      time: newTime,
      endTime: endTime(newTime, offering.duration_minutes),
      courtId: court.id,
      courtName: court.name,
      location: location.name,
      locationId: location.id,
      capacity: offering.default_capacity,
      booked: 0,
      waitlisted: 0,
      isCancelled: false,
      payment: "vacio",
    };

    try {
      assertNoOverlap(
        toInterval(row, dayOffset),
        classes.map((c) => toInterval(c, dayOffset)),
      );
    } catch (err) {
      const conflict = err instanceof OverlapError ? err.conflicts[0] : null;
      const kind = conflict?.kind === "coach" ? "entrenador" : noun;
      toast({
        title: "No se puede crear la clase",
        description: `Solape de ${kind} a las ${newTime}.`,
        variant: "destructive",
      });
      return;
    }

    setSchedule((prev) => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] ?? []), row].sort((a, b) => a.time.localeCompare(b.time)),
    }));
    toast({
      title: "Clase añadida",
      description: `${offering.name} · ${location.name} · ${court.name} · ${teacher.profile.display_name} · ${newTime}`,
    });
    setAddOpen(false);
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    setSchedule((prev) => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map((c) =>
        c.id === cancelTarget.id ? { ...c, isCancelled: true } : c,
      ),
    }));
    toast({ title: "Clase cancelada", description: "La planilla madre no cambia." });
    setCancelTarget(null);
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Grilla semanal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sede, {noun}, entrenador, cupos y estado de pago. Planilla madre + excepciones de la semana.
            </p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 me-2" />
            Añadir clase
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-1 overflow-x-auto">
            {WEEK.map((day) => (
              <Button
                key={day.key}
                variant={selectedDay === day.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedDay(day.key)}
                className="min-w-[52px]"
              >
                {day.label}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar clase, entrenador o ${noun}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No hay clases este día.</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((cls) => (
              <Card key={cls.id} className={cls.isCancelled ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 min-w-0">
                      <div className="shrink-0 w-16 text-center">
                        <p className="text-sm font-semibold">{cls.time}</p>
                        <p className="text-xs text-muted-foreground">{cls.endTime}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold">{cls.name}</h3>
                          {cls.isCancelled && (
                            <Badge variant="destructive" className="text-xs">Cancelada</Badge>
                          )}
                          <Badge
                            variant={cls.payment === "pagado" ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {PAYMENT_LABEL[cls.payment]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {cls.teacher}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cls.location} · {cls.courtName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-end">
                        <p className="text-sm font-semibold">
                          {cls.booked}/{cls.capacity}
                        </p>
                        {cls.waitlisted > 0 && (
                          <p className="text-xs text-accent-gold">+{cls.waitlisted} lista</p>
                        )}
                      </div>
                      {!cls.isCancelled && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem className="rounded-lg cursor-pointer">
                              <Users className="h-4 w-4 me-2" />
                              Ver roster
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer text-destructive"
                              onClick={() => setCancelTarget(cls)}
                            >
                              <Ban className="h-4 w-4 me-2" />
                              Cancelar (excepción)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancelar esta clase</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se cancela la occurrence de esta semana. La planilla madre no se modifica.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Conservar</Button>
            <Button variant="destructive" onClick={handleCancel}>Cancelar clase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Añadir clase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Offering</label>
              <Select value={newOffering} onValueChange={setNewOffering}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEMO_CLASS_TYPES.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name} · cupo {o.default_capacity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hora</label>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Entrenador</label>
              <Select value={newTeacher} onValueChange={setNewTeacher}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEMO_TEACHERS.map((t) => (
                    <SelectItem key={t.profile.id} value={t.profile.id}>
                      {t.profile.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{noun[0].toUpperCase() + noun.slice(1)}</label>
              <Select value={newCourt} onValueChange={setNewCourt}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {courtOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.locationName} · {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cerrar</Button>
            <Button onClick={handleAdd}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManageLayout>
  );
}
