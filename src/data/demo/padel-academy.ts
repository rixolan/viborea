/**
 * Demo academy — fictional padel club for Bandeja.
 * Not Academia DG. Not a real tenant.
 */

import type {
  Court,
  DayOfWeek,
  MembershipStatus,
  Profile,
  Studio,
  UserRole,
} from "@/types/database";
import type { WeeklyTemplateSlot } from "@/lib/schedule";

const now = "2026-09-01T00:00:00Z";

export const DEMO_STUDIO: Studio = {
  id: "demo-studio-alameda-001",
  name: "Academia Alameda",
  slug: "academia-alameda",
  description:
    "Academia de pádel con tres sedes. Clases individual, dual y grupal con pista y entrenador. Cobro adelantado.",
  logo_url: null,
  cover_image_url: null,
  website: "https://alameda.example",
  email: "hola@alameda.example",
  phone: "+595 21 555 0100",
  timezone: "America/Asuncion",
  locale: "es-PY",
  currency: "PYG",
  stripe_account_id: null,
  stripe_onboarding_complete: false,
  discoverable: true,
  brand_primary_color: "#0F766E",
  brand_secondary_color: "#F59E0B",
  brand_font: "DM Sans",
  default_cancellation_minutes: 1440,
  late_cancel_fee_cents: 150_000,
  no_show_fee_cents: 150_000,
  waitlist_enabled: true,
  max_waitlist_size: 5,
  created_at: "2024-03-01T00:00:00Z",
  updated_at: now,
};

export interface DemoLocation {
  id: string;
  studio_id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  rooms: DemoRoom[];
  capacity: number;
}

export interface DemoRoom {
  id: string;
  name: string;
  capacity: number;
}

function courtsFor(
  locationId: string,
  count: number,
  prefix: string,
): Court[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return {
      id: `court-${prefix}-${n}`,
      studio_id: DEMO_STUDIO.id,
      location_id: locationId,
      name: `Cancha ${n}`,
      number: n,
      surface: "cristal",
      is_active: true,
      created_at: now,
      updated_at: now,
    };
  });
}

export const DEMO_COURTS: Court[] = [
  ...courtsFor("loc-costanera", 6, "costanera"),
  ...courtsFor("loc-parque", 2, "parque"),
  ...courtsFor("loc-ribera", 2, "ribera"),
];

function roomsOf(locationId: string): DemoRoom[] {
  return DEMO_COURTS.filter((c) => c.location_id === locationId).map((c) => ({
    id: c.id,
    name: c.name,
    capacity: 4,
  }));
}

export const DEMO_LOCATIONS: DemoLocation[] = [
  {
    id: "loc-costanera",
    studio_id: DEMO_STUDIO.id,
    name: "Lomas",
    address_line1: "Lomas",
    address_line2: null,
    city: "Asunción",
    state: "Central",
    postal_code: "1209",
    country: "PY",
    lat: -25.282,
    lng: -57.635,
    phone: "+595 21 555 0101",
    email: "costanera@alameda.example",
    rooms: roomsOf("loc-costanera"),
    capacity: 24,
  },
  {
    id: "loc-parque",
    studio_id: DEMO_STUDIO.id,
    name: "Elite Padel",
    address_line1: "Elite Padel",
    address_line2: null,
    city: "Asunción",
    state: "Central",
    postal_code: "1749",
    country: "PY",
    lat: -25.301,
    lng: -57.568,
    phone: "+595 21 555 0102",
    email: "parque@alameda.example",
    rooms: roomsOf("loc-parque"),
    capacity: 8,
  },
  {
    id: "loc-ribera",
    studio_id: DEMO_STUDIO.id,
    name: "Habana",
    address_line1: "Habana",
    address_line2: null,
    city: "Asunción",
    state: "Central",
    postal_code: "1225",
    country: "PY",
    lat: -25.292,
    lng: -57.589,
    phone: "+595 21 555 0103",
    email: "ribera@alameda.example",
    rooms: roomsOf("loc-ribera"),
    capacity: 8,
  },
];

export interface DemoStaff {
  profile: Profile;
  role: UserRole;
  location_ids: string[];
  specialties: string[];
  pay_rate_cents: number;
  pay_type: "per_class" | "hourly" | "salary";
  bio: string;
}

function staffProfile(
  id: string,
  first: string,
  last: string,
  email: string,
  bio: string,
): Profile {
  return {
    id,
    first_name: first,
    last_name: last,
    display_name: [first, last].filter(Boolean).join(" "),
    email,
    phone: "+595 981 555 010",
    avatar_url: null,
    date_of_birth: null,
    pronouns: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio,
    specialties: [],
    certifications: [],
    instagram_handle: null,
    website: null,
    created_at: now,
    updated_at: now,
  };
}

export const DEMO_OWNER: DemoStaff = {
  profile: staffProfile(
    "staff-owner-ana",
    "Ana",
    "Moreira",
    "ana@alameda.example",
    "Dirección de Academia Alameda.",
  ),
  role: "owner",
  location_ids: DEMO_LOCATIONS.map((l) => l.id),
  specialties: ["Dirección"],
  pay_rate_cents: 0,
  pay_type: "salary",
  bio: "Dirección de Academia Alameda.",
};

export const DEMO_FRONT_DESK: DemoStaff = {
  profile: staffProfile(
    "staff-desk-carlos",
    "Carlos",
    "Duarte",
    "carlos@alameda.example",
    "Recepción y agenda de la semana.",
  ),
  role: "front_desk",
  location_ids: DEMO_LOCATIONS.map((l) => l.id),
  specialties: ["Recepción"],
  pay_rate_cents: 0,
  pay_type: "hourly",
  bio: "Recepción y agenda de la semana.",
};

export const DEMO_TEACHERS: DemoStaff[] = [
  {
    profile: staffProfile(
      "teacher-lucia",
      "Rodrigo",
      "Avila",
      "rodrigo@alameda.example",
      "Entrenador. Individual y dual.",
    ),
    role: "teacher",
    location_ids: ["loc-costanera", "loc-parque"],
    specialties: ["Individual", "Dual"],
    pay_rate_cents: 0,
    pay_type: "hourly",
    bio: "Entrenador. Individual y dual.",
  },
  {
    profile: staffProfile(
      "teacher-marcos",
      "Tati",
      "",
      "tati@alameda.example",
      "Entrenadora. Dual y grupal.",
    ),
    role: "teacher",
    location_ids: ["loc-costanera", "loc-ribera"],
    specialties: ["Dual", "Grupal"],
    pay_rate_cents: 0,
    pay_type: "hourly",
    bio: "Entrenadora. Dual y grupal.",
  },
  {
    profile: staffProfile(
      "teacher-sofia",
      "Diego",
      "",
      "diego@alameda.example",
      "Entrenador. Grupal y técnica.",
    ),
    role: "teacher",
    location_ids: ["loc-costanera", "loc-parque", "loc-ribera"],
    specialties: ["Grupal", "Técnica"],
    pay_rate_cents: 0,
    pay_type: "hourly",
    bio: "Entrenador. Grupal y técnica.",
  },
  {
    profile: staffProfile(
      "teacher-pablo",
      "Pablo",
      "",
      "pablo@alameda.example",
      "Entrenador.",
    ),
    role: "teacher",
    location_ids: ["loc-ribera", "loc-parque"],
    specialties: ["Dual", "Individual"],
    pay_rate_cents: 0,
    pay_type: "hourly",
    bio: "Entrenador.",
  },
];

export interface DemoClassType {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  default_capacity: number;
  color: string;
  category: string;
  drop_in_price_cents: number;
}

export const DEMO_CLASS_TYPES: DemoClassType[] = [
  {
    id: "off-individual",
    studio_id: DEMO_STUDIO.id,
    name: "Individual",
    description: "Una alumna o alumno con entrenador. Capacidad 1.",
    duration_minutes: 60,
    default_capacity: 1,
    color: "#0F766E",
    category: "padel",
    drop_in_price_cents: 150_000,
  },
  {
    id: "off-dual",
    studio_id: DEMO_STUDIO.id,
    name: "Dual",
    description: "Dos alumnos. Capacidad 2.",
    duration_minutes: 60,
    default_capacity: 2,
    color: "#0369A1",
    category: "padel",
    drop_in_price_cents: 125_000,
  },
  {
    id: "off-grupal",
    studio_id: DEMO_STUDIO.id,
    name: "Grupal",
    description: "Grupo reducido. Capacidad 4.",
    duration_minutes: 60,
    default_capacity: 4,
    color: "#B45309",
    category: "padel",
    drop_in_price_cents: 100_000,
  },
];

export interface DemoScheduleSlot {
  id: string;
  day: DayOfWeek;
  time: string;
  class_type_id: string;
  location_id: string;
  teacher_id: string;
  court_id: string;
}

function slot(
  id: string,
  day: DayOfWeek,
  time: string,
  offering: string,
  location: string,
  teacher: string,
  court: string,
): DemoScheduleSlot {
  return {
    id,
    day,
    time,
    class_type_id: offering,
    location_id: location,
    teacher_id: teacher,
    court_id: court,
  };
}

/** Planilla madre. Sin solape de pista ni de profe. Pico 15:00–17:00. */
export const DEMO_SCHEDULE: DemoScheduleSlot[] = [
  slot("tpl-mon-15-c1", "monday", "15:00", "off-individual", "loc-costanera", "teacher-lucia", "court-costanera-1"),
  slot("tpl-mon-15-c2", "monday", "15:00", "off-dual", "loc-costanera", "teacher-marcos", "court-costanera-2"),
  slot("tpl-mon-15-c3", "monday", "15:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-3"),
  slot("tpl-mon-16-c1", "monday", "16:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-1"),
  slot("tpl-mon-16-c2", "monday", "16:00", "off-individual", "loc-costanera", "teacher-marcos", "court-costanera-2"),
  slot("tpl-mon-17-c4", "monday", "17:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-4"),
  slot("tpl-mon-08-c6", "monday", "08:00", "off-individual", "loc-costanera", "teacher-sofia", "court-costanera-6"),
  slot("tpl-mon-09-p1", "monday", "09:00", "off-dual", "loc-parque", "teacher-lucia", "court-parque-1"),
  slot("tpl-mon-10-r1", "monday", "10:00", "off-individual", "loc-ribera", "teacher-marcos", "court-ribera-1"),
  slot("tpl-mon-19-p1", "monday", "19:00", "off-individual", "loc-parque", "teacher-lucia", "court-parque-1"),

  slot("tpl-tue-15-c1", "tuesday", "15:00", "off-individual", "loc-costanera", "teacher-marcos", "court-costanera-1"),
  slot("tpl-tue-15-c2", "tuesday", "15:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-2"),
  slot("tpl-tue-16-c3", "tuesday", "16:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-3"),
  slot("tpl-tue-17-c1", "tuesday", "17:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-1"),
  slot("tpl-tue-08-p1", "tuesday", "08:00", "off-individual", "loc-parque", "teacher-sofia", "court-parque-1"),
  slot("tpl-tue-19-r1", "tuesday", "19:00", "off-individual", "loc-ribera", "teacher-marcos", "court-ribera-1"),

  slot("tpl-wed-15-c1", "wednesday", "15:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-1"),
  slot("tpl-wed-15-c2", "wednesday", "15:00", "off-individual", "loc-costanera", "teacher-lucia", "court-costanera-2"),
  slot("tpl-wed-16-c2", "wednesday", "16:00", "off-dual", "loc-costanera", "teacher-marcos", "court-costanera-2"),
  slot("tpl-wed-17-c5", "wednesday", "17:00", "off-individual", "loc-costanera", "teacher-lucia", "court-costanera-5"),
  slot("tpl-wed-09-r2", "wednesday", "09:00", "off-dual", "loc-ribera", "teacher-sofia", "court-ribera-2"),

  slot("tpl-thu-15-c1", "thursday", "15:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-1"),
  slot("tpl-thu-15-c2", "thursday", "15:00", "off-individual", "loc-costanera", "teacher-marcos", "court-costanera-2"),
  slot("tpl-thu-16-c3", "thursday", "16:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-3"),
  slot("tpl-thu-17-c1", "thursday", "17:00", "off-individual", "loc-costanera", "teacher-lucia", "court-costanera-1"),
  slot("tpl-thu-08-c6", "thursday", "08:00", "off-dual", "loc-costanera", "teacher-marcos", "court-costanera-6"),
  slot("tpl-thu-19-p2", "thursday", "19:00", "off-individual", "loc-parque", "teacher-sofia", "court-parque-2"),

  slot("tpl-fri-15-c1", "friday", "15:00", "off-individual", "loc-costanera", "teacher-sofia", "court-costanera-1"),
  slot("tpl-fri-15-c2", "friday", "15:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-2"),
  slot("tpl-fri-16-c4", "friday", "16:00", "off-grupal", "loc-costanera", "teacher-marcos", "court-costanera-4"),
  slot("tpl-fri-17-c2", "friday", "17:00", "off-individual", "loc-costanera", "teacher-lucia", "court-costanera-2"),
  slot("tpl-fri-09-r1", "friday", "09:00", "off-dual", "loc-ribera", "teacher-sofia", "court-ribera-1"),

  slot("tpl-sat-09-c1", "saturday", "09:00", "off-grupal", "loc-costanera", "teacher-marcos", "court-costanera-1"),
  slot("tpl-sat-10-c2", "saturday", "10:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-2"),
  slot("tpl-sat-11-p1", "saturday", "11:00", "off-individual", "loc-parque", "teacher-sofia", "court-parque-1"),

  slot("tpl-sun-10-c1", "sunday", "10:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-1"),
  slot("tpl-sun-11-c3", "sunday", "11:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-3"),
];

export const DEMO_WORKSHOP_TEMPLATES = [
  {
    name: "Clínica de saque",
    description: "Técnica de saque y resto. Grupo reducido.",
    duration_hours: 2,
    price_cents: 200_000,
    category: "clinic",
    teacher_id: "teacher-lucia",
  },
];

export interface DemoMembershipType {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  price_cents: number;
  billing_cycle: "monthly" | "annual";
  classes_per_period: number | null;
  features: string[];
}

export const DEMO_MEMBERSHIP_TYPES: DemoMembershipType[] = [
  {
    id: "mem-mensual",
    studio_id: DEMO_STUDIO.id,
    name: "Mensual",
    description: "Clases ilimitadas en las tres sedes.",
    price_cents: 1_200_000,
    billing_cycle: "monthly",
    classes_per_period: null,
    features: ["Ilimitado", "Tres sedes"],
  },
];

export interface DemoClassPackType {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  price_cents: number;
  class_count: number;
  validity_days: number;
}

export const DEMO_CLASS_PACK_TYPES: DemoClassPackType[] = [
  {
    id: "pack-8",
    studio_id: DEMO_STUDIO.id,
    name: "Pack 8 clases",
    description: "Ocho clases, 60 días.",
    price_cents: 900_000,
    class_count: 8,
    validity_days: 60,
  },
  {
    id: "pack-4",
    studio_id: DEMO_STUDIO.id,
    name: "Pack 4 clases",
    description: "Cuatro clases, 45 días.",
    price_cents: 500_000,
    class_count: 4,
    validity_days: 45,
  },
];

export interface DemoMember {
  profile: Profile;
  membership_type_id: string | null;
  membership_status: MembershipStatus;
  class_pack_type_id: string | null;
  classes_remaining: number;
  joined_at: string;
  last_visit_at: string | null;
  total_visits: number;
  lifetime_value_cents: number;
  tags: string[];
}

const FIRST_NAMES = [
  "Lucía", "María", "Sofía", "Ana", "Camila", "Valentina", "Martina", "Elena",
  "Mateo", "Santiago", "Benjamín", "Thiago", "Joaquín", "Diego", "Tomás", "Nicolás",
];
const LAST_NAMES = [
  "González", "Benítez", "Giménez", "Ferreira", "Vera", "Cáceres", "Rojas", "Ortiz",
  "Villalba", "Duarte", "Moreira", "Rivas", "Acosta", "López", "Martínez", "Pérez",
];

function generateMembers(count: number): DemoMember[] {
  const members: DemoMember[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const rand = (i * 17) % 100;
    let membershipTypeId: string | null = null;
    let classPackTypeId: string | null = null;
    let classesRemaining = 0;
    if (rand < 35) membershipTypeId = "mem-mensual";
    else if (rand < 70) {
      classPackTypeId = rand < 55 ? "pack-8" : "pack-4";
      classesRemaining = classPackTypeId === "pack-8" ? 5 : 2;
    }
    members.push({
      profile: {
        id: `member-${String(i).padStart(4, "0")}`,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        phone: `+595 981 555 ${String(1000 + i).slice(-4)}`,
        avatar_url: null,
        date_of_birth: "1992-04-12",
        pronouns: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        bio: null,
        specialties: [],
        certifications: [],
        instagram_handle: null,
        website: null,
        created_at: now,
        updated_at: now,
      },
      membership_type_id: membershipTypeId,
      membership_status: "active",
      class_pack_type_id: classPackTypeId,
      classes_remaining: classesRemaining,
      joined_at: now,
      last_visit_at: now,
      total_visits: 12,
      lifetime_value_cents: 900_000,
      tags: i < 3 ? ["nuevo"] : [],
    });
  }
  return members;
}

export const DEMO_MEMBERS = generateMembers(48);

export const DEMO_STATS = {
  totalMembers: DEMO_MEMBERS.length,
  activeMembers: DEMO_MEMBERS.filter((m) => m.membership_status === "active").length,
  atRiskMembers: 0,
  newMembers: DEMO_MEMBERS.filter((m) => m.tags.includes("nuevo")).length,
  vipMembers: 0,
  totalTeachers: DEMO_TEACHERS.length,
  totalLocations: DEMO_LOCATIONS.length,
  classesPerWeek: DEMO_SCHEDULE.length,
  avgClassPrice: 125_000,
};

/** Compatibility names so leftover Oxatl imports compile during the cutover. */
export const OXATL_STUDIO = DEMO_STUDIO;
export const OXATL_LOCATIONS = DEMO_LOCATIONS;
export const OXATL_TEACHERS = DEMO_TEACHERS;
export const OXATL_OWNER = DEMO_OWNER;
export const OXATL_FRONT_DESK = DEMO_FRONT_DESK;
export const OXATL_CLASS_TYPES = DEMO_CLASS_TYPES;
export const OXATL_SCHEDULE = DEMO_SCHEDULE;
export const OXATL_MEMBERS = DEMO_MEMBERS;
export const OXATL_STATS = DEMO_STATS;
export const OXATL_MEMBERSHIP_TYPES = DEMO_MEMBERSHIP_TYPES;
export const OXATL_CLASS_PACK_TYPES = DEMO_CLASS_PACK_TYPES;
export const OXATL_WORKSHOP_TEMPLATES = DEMO_WORKSHOP_TEMPLATES;



export function demoWeeklyTemplates(): WeeklyTemplateSlot[] {
  return DEMO_SCHEDULE.map((s) => {
    const offering = DEMO_CLASS_TYPES.find((c) => c.id === s.class_type_id);
    const duration = offering?.duration_minutes ?? 60;
    const [h, m] = s.time.split(":").map(Number);
    const endTotal = h * 60 + m + duration;
    const endTime = `${String(Math.floor(endTotal / 60)).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`;
    return {
      id: s.id,
      studioId: DEMO_STUDIO.id,
      offeringId: s.class_type_id,
      locationId: s.location_id,
      courtId: s.court_id,
      coachStaffId: s.teacher_id,
      dayOfWeek: s.day,
      startTime: s.time,
      endTime,
      capacity: offering?.default_capacity ?? 1,
    };
  });
}
