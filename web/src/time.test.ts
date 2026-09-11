import { describe, expect, it } from "bun:test";
import { addDaysToKey, dateAt, dayAt, timeAt, weekLabel, whenAt } from "./time";

const PY = "America/Asuncion";

describe("hora de la sede, no del visitante", () => {
  it("una clase 09:00Z se lee 06:00 en Asunción", () => {
    const iso = "2026-09-14T09:00:00.000Z";
    expect(timeAt(iso, PY)).toBe("06:00");
    expect(dateAt(iso, PY)).toBe("2026-09-14");
    expect(dayAt(iso, PY)).toBe("lunes 14 sep");
    expect(whenAt(iso, PY)).toBe("lun 14 sep · 06:00");
  });

  it("la misma clase vista desde Madrid sigue siendo 06:00 en Asunción", () => {
    const iso = "2026-09-14T09:00:00.000Z";
    expect(timeAt(iso, PY)).toBe("06:00");
    expect(timeAt(iso, "Europe/Madrid")).toBe("11:00");
  });

  it("un domingo 22:00 local no se corre de día", () => {
    const iso = "2026-09-21T01:00:00.000Z";
    expect(dateAt(iso, PY)).toBe("2026-09-20");
    expect(timeAt(iso, PY)).toBe("22:00");
  });

  it("etiquetas de semana", () => {
    expect(weekLabel("2026-09-14")).toBe("14–20 sep 2026");
    expect(addDaysToKey("2026-09-28", 7)).toBe("2026-10-05");
  });
});
