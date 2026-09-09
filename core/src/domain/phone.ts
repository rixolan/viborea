export class PhoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhoneError";
  }
}

/** National length after country code, once the trunk 0 is gone. */
const NATIONAL: Record<string, { min: number; max: number }> = {
  "1": { min: 10, max: 10 },
  "34": { min: 9, max: 9 },
  "39": { min: 9, max: 11 },
  "44": { min: 10, max: 10 },
  "51": { min: 9, max: 9 },
  "52": { min: 10, max: 10 },
  "54": { min: 10, max: 11 },
  "55": { min: 10, max: 11 },
  "56": { min: 9, max: 9 },
  "57": { min: 10, max: 10 },
  "58": { min: 10, max: 10 },
  "591": { min: 8, max: 8 },
  "593": { min: 9, max: 9 },
  "595": { min: 8, max: 9 },
  "598": { min: 8, max: 8 },
};

const CCS = Object.keys(NATIONAL).sort((a, b) => b.length - a.length);

function countryOf(digits: string): { cc: string; national: string } | null {
  for (const cc of CCS) {
    if (digits.startsWith(cc)) return { cc, national: digits.slice(cc.length) };
  }
  return null;
}

export function phoneIssue(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "+") return "Ingresá tu WhatsApp.";
  if (!trimmed.startsWith("+")) return "Elegí el país. El número va con prefijo.";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) return "Faltan dígitos.";
  if (digits.length > 15) return "Sobran dígitos.";
  const parsed = countryOf(digits);
  if (!parsed) {
    if (digits.length < 10) return "Faltan dígitos.";
    return null;
  }
  if (parsed.national.startsWith("0")) {
    return "Quitá el 0 del principio. En Paraguay: 981 123 456, no 0981…";
  }
  const bound = NATIONAL[parsed.cc];
  if (parsed.national.length < bound.min) return "Faltan dígitos.";
  if (parsed.national.length > bound.max) return "Sobran dígitos.";
  return null;
}

export function parsePhone(raw: string): string {
  const issue = phoneIssue(raw);
  if (issue) throw new PhoneError(issue);
  return `+${raw.trim().replace(/\D/g, "")}`;
}
