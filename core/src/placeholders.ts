export const PLACEHOLDER_SEDES = [
  {
    id: "lomas",
    name: "Lomas",
    hint: "6 canchas",
    photo:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&h=800&q=80",
  },
  {
    id: "elite",
    name: "Elite Padel",
    hint: "2 canchas",
    photo:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&h=800&q=80",
  },
  {
    id: "habana",
    name: "Habana",
    hint: "2 canchas",
    photo:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&h=800&q=80",
  },
] as const;

export const PLACEHOLDER_PROFES = [
  { id: "rodrigo", name: "Rodrigo Avila", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "tati", name: "Tati", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "diego", name: "Diego", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "pablo", name: "Pablo", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80" },
] as const;

export const PLACEHOLDER_HOURS = ["08:00", "09:00", "15:00", "16:00", "17:00", "18:00"] as const;

export function findSede(id: string) {
  return PLACEHOLDER_SEDES.find((s) => s.id === id) ?? null;
}

export function findProfe(id: string) {
  return PLACEHOLDER_PROFES.find((p) => p.id === id) ?? null;
}

/** Deterministic fake occupancy so the week looks real without a DB. */
export function slotBusy(sedeId: string, profeId: string, day: number, hour: string): boolean {
  let h = 0;
  const key = `${sedeId}|${profeId}|${day}|${hour}`;
  for (let i = 0; i < key.length; i++) h = (h * 33 + key.charCodeAt(i)) >>> 0;
  return h % 5 === 0;
}
