/**
 * DEMO MODE — Academia Alameda (fictional padel academy).
 *
 * VITE_DEMO_MODE=true loads this path. No backend, no production WhatsApp.
 */

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { UserRole, Profile, Studio } from '@/types/database';
import {
  DEMO_STUDIO,
  DEMO_OWNER,
  DEMO_FRONT_DESK,
  DEMO_TEACHERS,
  DEMO_MEMBERS,
  DEMO_STATS,
} from '@/data/demo/padel-academy';

export const DEMO_MODE_ENABLED = import.meta.env.VITE_DEMO_MODE === 'true';

export { DEMO_STUDIO };

// ============================================================================
// Demo personas
// ============================================================================
export interface DemoPersona {
  role: UserRole;
  label: string;
  name: string;
  email: string;
  description: string;
  canAccess: string[];
  profileId: string;
}

const sampleTeacher = DEMO_TEACHERS[0];
const sampleStudent = DEMO_MEMBERS[0];

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: 'owner',
    label: 'Dirección',
    name: DEMO_OWNER.profile.display_name!,
    email: DEMO_OWNER.profile.email,
    profileId: DEMO_OWNER.profile.id,
    description: 'Grilla, alumnos, offerings, cobros y excepciones de la semana.',
    canAccess: ['Dashboard', 'Grilla', 'Alumnos', 'Entrenadores', 'Offerings'],
  },
  {
    role: 'front_desk',
    label: 'Recepción',
    name: DEMO_FRONT_DESK.profile.display_name!,
    email: DEMO_FRONT_DESK.profile.email,
    profileId: DEMO_FRONT_DESK.profile.id,
    description: 'Check-in, waitlist y agenda del día.',
    canAccess: ['Dashboard', 'Grilla', 'Alumnos', 'Check-in'],
  },
  {
    role: 'teacher',
    label: 'Entrenador',
    name: sampleTeacher.profile.display_name!,
    email: sampleTeacher.profile.email,
    profileId: sampleTeacher.profile.id,
    description: `Agenda propia y roster. ${sampleTeacher.specialties.join(', ')}.`,
    canAccess: ['Teach Dashboard', 'Mi horario'],
  },
  {
    role: 'student',
    label: 'Alumno',
    name: sampleStudent.profile.display_name!,
    email: sampleStudent.profile.email,
    profileId: sampleStudent.profile.id,
    description: 'Reservar, reprogramar y ver packs.',
    canAccess: ['Horario', 'Mi horario', 'Cuenta'],
  },
];

// ============================================================================
// Demo profile generators
// ============================================================================
function getProfileForPersona(persona: DemoPersona): Profile {
  // Find the actual profile from demo data
  if (persona.role === 'owner') {
    return DEMO_OWNER.profile;
  }
  if (persona.role === 'front_desk') {
    return DEMO_FRONT_DESK.profile;
  }
  if (persona.role === 'teacher') {
    return sampleTeacher.profile;
  }
  if (persona.role === 'student') {
    return sampleStudent.profile;
  }

  // Fallback
  const [first, last] = persona.name.split(' ');
  return {
    id: persona.profileId,
    first_name: first,
    last_name: last ?? '',
    display_name: persona.name,
    email: persona.email,
    phone: '+1 (512) 555-0100',
    avatar_url: null,
    date_of_birth: '1990-01-01',
    pronouns: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio: persona.description,
    specialties: [],
    certifications: [],
    instagram_handle: null,
    website: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };
}

// ============================================================================
// Context
// ============================================================================
interface DemoContextType {
  isDemoMode: boolean;
  demoStudio: Studio;
  demoStats: typeof DEMO_STATS;
  activePersona: DemoPersona;
  activeProfile: Profile;
  personas: DemoPersona[];
  switchPersona: (role: UserRole) => void;
  tourStep: number | null;
  setTourStep: (step: number | null) => void;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [activeRole, setActiveRole] = useState<UserRole>('owner');
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(DEMO_MODE_ENABLED);

  const activePersona = useMemo(
    () => DEMO_PERSONAS.find(p => p.role === activeRole) ?? DEMO_PERSONAS[0],
    [activeRole]
  );
  const activeProfile = useMemo(
    () => getProfileForPersona(activePersona),
    [activePersona]
  );

  const switchPersona = useCallback((role: UserRole) => {
    setActiveRole(role);
  }, []);

  // If demo mode is disabled, just render children without context
  if (!DEMO_MODE_ENABLED) {
    return <>{children}</>;
  }

  return (
    <DemoContext.Provider
      value={{
        isDemoMode: true,
        demoStudio: DEMO_STUDIO,
        demoStats: DEMO_STATS,
        activePersona,
        activeProfile,
        personas: DEMO_PERSONAS,
        switchPersona,
        tourStep,
        setTourStep,
        panelOpen,
        setPanelOpen,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  // If not in demo mode, return a safe default
  if (context === undefined) {
    const defaultPersona = DEMO_PERSONAS[0];
    return {
      isDemoMode: false,
      demoStudio: DEMO_STUDIO,
      demoStats: DEMO_STATS,
      activePersona: defaultPersona,
      activeProfile: getProfileForPersona(defaultPersona),
      personas: DEMO_PERSONAS,
      switchPersona: () => {},
      tourStep: null,
      setTourStep: () => {},
      panelOpen: false,
      setPanelOpen: () => {},
    };
  }
  return context;
}

// ============================================================================
// Demo Data Access Helpers
// ============================================================================

/**
 * Get all demo teachers for display in teacher lists
 */
export function getDemoTeachers() {
  return DEMO_TEACHERS;
}

/**
 * Get demo members for display in student/member lists
 */
export function getDemoMembers(limit?: number) {
  return limit ? DEMO_MEMBERS.slice(0, limit) : DEMO_MEMBERS;
}

/**
 * Get a specific demo teacher by ID
 */
export function getDemoTeacherById(id: string) {
  return DEMO_TEACHERS.find(t => t.profile.id === id);
}

/**
 * Get a specific demo member by ID
 */
export function getDemoMemberById(id: string) {
  return DEMO_MEMBERS.find(m => m.profile.id === id);
}
