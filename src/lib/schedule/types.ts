import type { BookingStatus, DayOfWeek } from "@/types/database";

export type SessionSource = "template" | "exception" | "one_off";

export interface SessionInterval {
  id: string;
  courtId: string;
  coachStaffId: string;
  startsAt: Date;
  endsAt: Date;
  cancelled?: boolean;
}

export type OverlapKind = "court" | "coach";

export interface OverlapConflict {
  kind: OverlapKind;
  sessionId: string;
  otherSessionId: string;
}

export class OverlapError extends Error {
  readonly conflicts: OverlapConflict[];

  constructor(conflicts: OverlapConflict[]) {
    const kinds = [...new Set(conflicts.map((c) => c.kind))].join(" y ");
    super(`Solape de ${kinds}`);
    this.name = "OverlapError";
    this.conflicts = conflicts;
  }
}

export interface WeeklyTemplateSlot {
  id: string;
  studioId: string;
  offeringId: string;
  locationId: string;
  courtId: string;
  coachStaffId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  capacity: number;
  effectiveFrom?: string;
  effectiveUntil?: string | null;
}

export interface MaterializedSession {
  id: string;
  templateId: string;
  offeringId: string;
  locationId: string;
  courtId: string;
  coachStaffId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  source: SessionSource;
  cancelled: boolean;
}

export type SessionException =
  | { type: "cancel"; occurrenceId: string }
  | {
      type: "edit";
      occurrenceId: string;
      patch: Partial<
        Pick<MaterializedSession, "courtId" | "coachStaffId" | "startsAt" | "endsAt" | "capacity">
      >;
    }
  | {
      type: "apply_forward";
      templateId: string;
      fromDate: string;
      patch: Partial<Pick<WeeklyTemplateSlot, "courtId" | "coachStaffId" | "startTime" | "endTime" | "capacity">>;
    };

export const OCCUPYING_BOOKING_STATUSES: ReadonlySet<BookingStatus> = new Set([
  "pending_payment",
  "confirmed",
  "checked_in",
]);
