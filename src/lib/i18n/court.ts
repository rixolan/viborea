/**
 * Schema identifier is always `court`.
 * Visible noun: pista (es-ES / default) or cancha (es-AR, es-PY).
 */

export type CourtNoun = "pista" | "cancha";

export function courtNoun(locale: string | null | undefined): CourtNoun {
  const tag = (locale ?? "es").toLowerCase().replace("_", "-");
  if (tag.startsWith("es-ar") || tag.startsWith("es-py")) return "cancha";
  return "pista";
}

