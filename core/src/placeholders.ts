export const PLACEHOLDER_SEDES = [
  {
    id: "costanera",
    name: "Costanera",
    hint: "6 canchas · al aire libre",
    photo:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&h=800&q=80",
  },
  {
    id: "parque",
    name: "Parque",
    hint: "2 canchas · entre árboles",
    photo:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&h=800&q=80",
  },
  {
    id: "ribera",
    name: "Ribera",
    hint: "2 canchas · indoor",
    photo:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&h=800&q=80",
  },
] as const;

export const PLACEHOLDER_PROFES = [
  { id: "lucia", name: "Lucía Benítez", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "marcos", name: "Marcos Villalba", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "sofia", name: "Sofía Rivas", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "ana", name: "Ana Moreira", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "carlos", name: "Carlos Duarte", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "elena", name: "Elena Cáceres", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "thiago", name: "Thiago Rojas", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "camila", name: "Camila Vera", photo: "https://images.unsplash.com/photo-1529626451987-655d4da6b2d8?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "joaquin", name: "Joaquín Ortiz", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "valentina", name: "Valentina López", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&h=400&q=80" },
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
