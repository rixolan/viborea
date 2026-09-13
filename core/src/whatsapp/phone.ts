export function digits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  // PY local 09xx… pasted after 595 → 5950…; E.164 drops that 0.
  if (d.startsWith("5950") && d.length === 13) return `595${d.slice(4)}`;
  return d;
}
