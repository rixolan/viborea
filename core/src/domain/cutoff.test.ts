import { describe, expect, it } from "bun:test";
import {
  CutoffError,
  DEFAULT_CUTOFF_HOURS,
  cutoffMessage,
  parseCutoffHours,
  selfServeOpen,
} from "./cutoff";

const start = new Date("2026-09-09T18:00:00.000Z");

describe("cutoff 12 h", () => {
  it("default es 12", () => {
    expect(DEFAULT_CUTOFF_HOURS).toBe(12);
  });

  it("abierto exactamente 12 h antes; cerrado un segundo después", () => {
    expect(selfServeOpen(start, 12, new Date("2026-09-09T06:00:00.000Z"))).toBe(true);
    expect(selfServeOpen(start, 12, new Date("2026-09-09T06:00:01.000Z"))).toBe(false);
  });

  it("abierto el día anterior; cerrado 3 h antes", () => {
    expect(selfServeOpen(start, 12, new Date("2026-09-08T18:00:00.000Z"))).toBe(true);
    expect(selfServeOpen(start, 12, new Date("2026-09-09T15:00:00.000Z"))).toBe(false);
  });

  it("la academia puede alargar o acortar el plazo", () => {
    const now = new Date("2026-09-09T10:00:00.000Z");
    expect(selfServeOpen(start, 6, now)).toBe(true);
    expect(selfServeOpen(start, 24, now)).toBe(false);
  });

  it("parsea enteros 1–72", () => {
    expect(parseCutoffHours("12")).toBe(12);
    expect(parseCutoffHours(1)).toBe(1);
    expect(() => parseCutoffHours("0")).toThrow(CutoffError);
    expect(() => parseCutoffHours(73)).toThrow(CutoffError);
    expect(() => parseCutoffHours("x")).toThrow(CutoffError);
  });

  it("mensaje de rechazo nombra las horas", () => {
    expect(cutoffMessage(12)).toBe("Fuera de plazo: hasta 12 h antes de la clase");
  });
});
