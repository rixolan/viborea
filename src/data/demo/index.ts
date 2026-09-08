/**
 * DEMO MODE - Central Export
 *
 * To remove demo mode: delete src/data/demo/ and set VITE_DEMO_MODE=false
 */

export * from "./padel-academy";
export * from "./bookings-transactions";

export const DEMO_STUDIO_SLUG = "academia-alameda";
export const DEMO_STUDIO_NAME = "Academia Alameda";
export const DEMO_LOCATION = "Asunción";

export const DEMO_HANDLES = ["academia-alameda", "alameda", "demo"] as const;

export function isDemoHandle(handle: string | undefined): boolean {
  if (!handle) return false;
  return DEMO_HANDLES.includes(handle.toLowerCase() as (typeof DEMO_HANDLES)[number]);
}

export function isDemoStudio(studioId: string | undefined): boolean {
  if (!studioId) return false;
  return studioId === "demo-studio-alameda-001" || studioId.startsWith("demo-");
}
