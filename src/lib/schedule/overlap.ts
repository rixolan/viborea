import { OverlapError, type OverlapConflict, type SessionInterval } from "./types";

/** Half-open [start, end): 16:00–17:00 does not overlap 17:00–18:00. */
export function intervalsOverlap(a: SessionInterval, b: SessionInterval): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

export function findOverlaps(
  candidate: SessionInterval,
  existing: readonly SessionInterval[],
): OverlapConflict[] {
  const conflicts: OverlapConflict[] = [];
  if (candidate.cancelled) return conflicts;

  for (const other of existing) {
    if (other.id === candidate.id || other.cancelled) continue;
    if (!intervalsOverlap(candidate, other)) continue;
    if (candidate.courtId === other.courtId) {
      conflicts.push({ kind: "court", sessionId: candidate.id, otherSessionId: other.id });
    }
    if (candidate.coachStaffId === other.coachStaffId) {
      conflicts.push({ kind: "coach", sessionId: candidate.id, otherSessionId: other.id });
    }
  }
  return conflicts;
}

export function assertNoOverlap(
  candidate: SessionInterval,
  existing: readonly SessionInterval[],
): void {
  const conflicts = findOverlaps(candidate, existing);
  if (conflicts.length > 0) throw new OverlapError(conflicts);
}
