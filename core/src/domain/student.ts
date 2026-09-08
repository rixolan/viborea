export const STUDENT_CATEGORIES = ["beginner", "1", "2", "3", "4", "5", "6", "7", "8", "pro"] as const;
export type StudentCategory = (typeof STUDENT_CATEGORIES)[number];

export const PLAYING_SIDES = ["drive", "reves"] as const;
export type PlayingSide = (typeof PLAYING_SIDES)[number];

export const CATEGORY_LABELS: Record<StudentCategory, string> = {
  beginner: "Principiante",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  pro: "Profesional",
};

export const SIDE_LABELS: Record<PlayingSide, string> = {
  drive: "Drive",
  reves: "Revés",
};

export function parseCategory(raw: string | null | undefined): StudentCategory {
  return STUDENT_CATEGORIES.includes(raw as StudentCategory) ? (raw as StudentCategory) : "beginner";
}

export function parseSide(raw: string | null | undefined): PlayingSide | null {
  return PLAYING_SIDES.includes(raw as PlayingSide) ? (raw as PlayingSide) : null;
}
