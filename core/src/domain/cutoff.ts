export const DEFAULT_CUTOFF_HOURS = 12;
export const MIN_CUTOFF_HOURS = 1;
export const MAX_CUTOFF_HOURS = 72;

export class CutoffError extends Error {}

export function parseCutoffHours(raw: string | number | null | undefined): number {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isInteger(n) || n < MIN_CUTOFF_HOURS || n > MAX_CUTOFF_HOURS) {
    throw new CutoffError(`El plazo debe ser entre ${MIN_CUTOFF_HOURS} y ${MAX_CUTOFF_HOURS} horas`);
  }
  return n;
}

/** True when self-serve book/cancel (with pack restore) is still allowed. */
export function selfServeOpen(startsAt: Date, cutoffHours: number, now = new Date()): boolean {
  return startsAt.getTime() - now.getTime() >= cutoffHours * 3_600_000;
}

export function cutoffMessage(cutoffHours: number): string {
  return `Fuera de plazo: hasta ${cutoffHours} h antes de la clase`;
}
