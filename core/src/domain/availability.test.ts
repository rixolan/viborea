import { describe, expect, it } from "bun:test";
import { hoursInRange, openSlotId, parseOpenSlotId } from "./availability";

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
