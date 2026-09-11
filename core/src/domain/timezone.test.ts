import { describe, expect, it } from "bun:test";
import {
  addDaysToKey,
  dateKeyIn,
  instantFrom,
  isValidTimeZone,
  mondayKeyIn,
  mondayKeyOf,
  offsetMs,
  parseTimeOfDay,
  timeIn,
  weekdayOfKey,
  weekWindow,
} from "./timezone";

const PY = "America/Asuncion";
const ES = "Europe/Madrid";

describe("hora local de la academia", () => {
  it("06:00 en Asunción es 09:00Z, no 06:00Z", () => {
    const at = instantFrom("2026-09-14", "06:00", PY);
    expect(at.toISOString()).toBe("2026-09-14T09:00:00.000Z");
    expect(timeIn(PY, at)).toBe("06:00");
    expect(dateKeyIn(PY, at)).toBe("2026-09-14");
    expect(offsetMs(PY, at)).toBe(-3 * 3_600_000);
  });

  it("cruza el horario de verano de Madrid", () => {
    expect(instantFrom("2026-01-15", "09:00", ES).toISOString()).toBe("2026-01-15T08:00:00.000Z");
    expect(instantFrom("2026-07-15", "09:00", ES).toISOString()).toBe("2026-07-15T07:00:00.000Z");
  });

  it("una clase de domingo 22:00 local sigue en su semana", () => {
    const at = instantFrom("2026-09-20", "22:00", PY);
    expect(at.toISOString()).toBe("2026-09-21T01:00:00.000Z");
    expect(mondayKeyIn(PY, at)).toBe("2026-09-14");
    const week = weekWindow("2026-09-14", PY);
    expect(week.from.toISOString()).toBe("2026-09-14T03:00:00.000Z");
    expect(week.to.toISOString()).toBe("2026-09-21T03:00:00.000Z");
    expect(at >= week.from && at < week.to).toBe(true);
  });

  it("calendario por clave de fecha", () => {
    expect(weekdayOfKey("2026-09-14")).toBe("monday");
    expect(weekdayOfKey("2026-09-20")).toBe("sunday");
    expect(mondayKeyOf("2026-09-20")).toBe("2026-09-14");
    expect(mondayKeyOf("2026-09-14")).toBe("2026-09-14");
    expect(addDaysToKey("2026-09-28", 7)).toBe("2026-10-05");
  });

  it("valida zonas y horas", () => {
    expect(isValidTimeZone(PY)).toBe(true);
    expect(isValidTimeZone("Marte/Olympus")).toBe(false);
    expect(parseTimeOfDay("7:5".replace("5", "05"))).toBe("07:05");
    expect(parseTimeOfDay("24:00", { allowEndOfDay: true })).toBe("24:00");
    expect(() => parseTimeOfDay("24:00")).toThrow();
    expect(() => parseTimeOfDay("25:00", { allowEndOfDay: true })).toThrow();
    expect(() => parseTimeOfDay("nope")).toThrow();
  });
});
