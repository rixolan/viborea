const DENY: Record<string, true> = {
  academia: true,
  admin: true,
  ajustes: true,
  api: true,
  assets: true,
  cliente: true,
  entrar: true,
  jugador: true,
  nueva: true,
  piloto: true,
  profe: true,
  registro: true,
  reservar: true,
  s: true,
  sesion: true,
  static: true,
  www: true,
};
export class SlugError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlugError";
  }
}

export function parseSlug(raw: string): string {
  const slug = raw.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(slug)) {
    throw new SlugError("Slug: 3–32 caracteres, letras minúsculas, números y guiones.");
  }
  if (DENY[slug]) throw new SlugError("Ese slug no está disponible.");
  return slug;
}
