import { describe, expect, it } from "vitest";
import { currencyExponent, formatMoney, minorToMajor } from "./money";

describe("money", () => {
  it("treats PYG as whole units", () => {
    expect(currencyExponent("PYG")).toBe(0);
    expect(minorToMajor(150_000, "PYG")).toBe(150_000);
    expect(formatMoney(150_000, "PYG", "es")).toMatch(/150.?000/);
  });

  it("keeps EUR/USD as two-decimal minor units", () => {
    expect(minorToMajor(1999, "EUR")).toBe(19.99);
    expect(formatMoney(1999, "EUR", "es-ES")).toMatch(/19,99/);
  });
});
