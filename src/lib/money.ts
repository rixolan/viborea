/**
 * Money is integer minor units + ISO 4217 currency.
 * Tandava columns named `*_cents` store those minor units.
 * PYG exponent is 0: 150000 means 150000 PYG, not 1500.00.
 */

const EXPONENT: Record<string, number> = {
  USD: 2,
  EUR: 2,
  ARS: 2,
  BRL: 2,
  MXN: 2,
  GBP: 2,
  PYG: 0,
};

export function currencyExponent(currency: string): number {
  return EXPONENT[currency.toUpperCase()] ?? 2;
}

export function minorToMajor(amount: number, currency: string): number {
  const exp = currencyExponent(currency);
  return exp === 0 ? amount : amount / 10 ** exp;
}

export function formatMoney(
  amount: number,
  currency: string,
  locale: string = "es",
): string {
  const exp = currencyExponent(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: exp,
    maximumFractionDigits: exp,
  }).format(minorToMajor(amount, currency));
}
