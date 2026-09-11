import { describe, expect, it } from "bun:test";
import { blocksOverlap, hoursInRange, openSlotId, parseOpenSlotId, slotStarts } from "./availability";
import type { AvailabilityBlock } from "./availability";

describe("hoursInRange", () => {
  it("6:00 a 11:00 son cinco clases, la última empieza 10:00", () => {
    expect(hoursInRange("06:00", "11:00")).toEqual(["06:00", "07:00", "08:00", "09:00", "10:00"]);
  });

  it("un punto 13:00–14:00 es un hueco", () => {
    expect(hoursInRange("13:00", "14:00")).toEqual(["13:00"]);
  });
});

describe("openSlotId", () => {
  it("redondea el parse", () => {
    const starts = new Date("2026-09-14T06:00:00.000Z");
    const id = openSlotId("loc-costanera", "coach-fernando-laval", starts);
    expect(parseOpenSlotId(id)).toEqual({
      locationId: "loc-costanera",
      coachId: "coach-fernando-laval",
      startsAt: starts,
    });
  });
});

describe("slotStarts", () => {
  it("el hueco de 06:00 en Asunción es 09:00Z", () => {
    expect(slotStarts("2026-09-14", "06:00", "America/Asuncion").toISOString()).toBe(
      "2026-09-14T09:00:00.000Z",
    );
  });
});

describe("blocksOverlap", () => {
  const block = (over: Partial<AvailabilityBlock> = {}): AvailabilityBlock => ({
    coachId: "coach-1",
    locationId: "loc-1",
    weekday: "monday",
    startTime: "06:00",
    endTime: "11:00",
    ...over,
  });

  it("el mismo profe no puede estar en dos sedes a la vez", () => {
    expect(blocksOverlap(block(), block({ locationId: "loc-2", startTime: "10:00", endTime: "12:00" }))).toBe(true);
  });

  it("bloques pegados y otros días no se solapan", () => {
    expect(blocksOverlap(block(), block({ startTime: "11:00", endTime: "13:00" }))).toBe(false);
    expect(blocksOverlap(block(), block({ weekday: "tuesday" }))).toBe(false);
  });
});
