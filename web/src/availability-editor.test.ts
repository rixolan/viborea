import { describe, expect, it } from "bun:test";
import { blocksFrom, dayIssue, emptyWeek, rangeToAdd, weekFrom, weekIssues, type Range } from "./availability-editor";
import type { Availability } from "./api";

const L1 = "loc-1";
const L2 = "loc-2";

function block(over: Partial<Availability>): Availability {
  return {
    id: "av-1",
    coach_id: "coach-1",
    coach_name: "Profe",
    location_id: L1,
    location_name: "Sede",
    weekday: "monday",
    start_time: "09:00",
    end_time: "12:00",
    ...over,
  };
}

describe("franjas guardadas → filas del editor", () => {
  it("agrupa por día y ordena por hora", () => {
    const week = weekFrom(
      [
        block({ id: "a", weekday: "monday", start_time: "14:00", end_time: "17:00", location_id: L2 }),
        block({ id: "b", weekday: "monday", start_time: "06:00", end_time: "11:00" }),
        block({ id: "c", weekday: "friday", start_time: "08:00", end_time: "09:30" }),
        block({ id: "d", coach_id: "otro", weekday: "sunday" }),
      ],
      "coach-1",
    );
    expect(week.monday).toEqual([
      { locationId: L1, startTime: "06:00", endTime: "11:00" },
      { locationId: L2, startTime: "14:00", endTime: "17:00" },
    ]);
    expect(week.friday).toEqual([{ locationId: L1, startTime: "08:00", endTime: "09:30" }]);
    // no se cuela la franja de otro profe
    expect(week.sunday).toEqual([]);
  });

  it("aplana a lo que espera el PUT, en orden de la semana", () => {
    const week = emptyWeek();
    week.friday = [{ locationId: L1, startTime: "08:00", endTime: "09:00" }];
    week.monday = [{ locationId: L2, startTime: "10:00", endTime: "11:00" }];
    expect(blocksFrom(week)).toEqual([
      { weekday: "monday", locationId: L2, startTime: "10:00", endTime: "11:00" },
      { weekday: "friday", locationId: L1, startTime: "08:00", endTime: "09:00" },
    ]);
  });
});

describe("qué agrega el +", () => {
  it("una franja por defecto cuando el día está vacío", () => {
    expect(rangeToAdd([], L1)).toEqual({ locationId: L1, startTime: "09:00", endTime: "12:00" });
  });

  it("después de la última, con una hora de aire y su misma sede", () => {
    const existing: Range[] = [{ locationId: L2, startTime: "06:00", endTime: "11:00" }];
    expect(rangeToAdd(existing, L1)).toEqual({ locationId: L2, startTime: "12:00", endTime: "13:00" });
  });

  it("no se pasa de medianoche", () => {
    const existing: Range[] = [{ locationId: L1, startTime: "21:00", endTime: "23:30" }];
    expect(rangeToAdd(existing, L1)).toEqual({ locationId: L1, startTime: "22:00", endTime: "23:00" });
  });
});

describe("avisos antes de mandar", () => {
  it("acepta un día normal, con media hora y todo", () => {
    expect(
      dayIssue([
        { locationId: L1, startTime: "06:30", endTime: "11:00" },
        { locationId: L2, startTime: "13:00", endTime: "17:00" },
      ]),
    ).toBeNull();
    expect(dayIssue([])).toBeNull();
  });

  it("rechaza fin antes del inicio, franjas cortas y sedes sin elegir", () => {
    expect(dayIssue([{ locationId: L1, startTime: "12:00", endTime: "10:00" }])).toMatch(/después del inicio/);
    expect(dayIssue([{ locationId: L1, startTime: "10:00", endTime: "10:30" }])).toMatch(/una hora/);
    expect(dayIssue([{ locationId: "", startTime: "10:00", endTime: "11:00" }])).toMatch(/sede/);
  });

  it("rechaza dos franjas que se pisan, en cualquier orden", () => {
    const overlap: Range[] = [
      { locationId: L2, startTime: "10:00", endTime: "13:00" },
      { locationId: L1, startTime: "09:00", endTime: "11:00" },
    ];
    expect(dayIssue(overlap)).toMatch(/se pisa/);
    expect(dayIssue([...overlap].reverse())).toMatch(/se pisa/);
    // pegadas no se pisan
    expect(
      dayIssue([
        { locationId: L1, startTime: "09:00", endTime: "11:00" },
        { locationId: L2, startTime: "11:00", endTime: "13:00" },
      ]),
    ).toBeNull();
  });

  it("señala sólo el día con problema", () => {
    const week = emptyWeek();
    week.monday = [{ locationId: L1, startTime: "09:00", endTime: "11:00" }];
    week.tuesday = [{ locationId: L1, startTime: "09:00", endTime: "09:15" }];
    expect(Object.keys(weekIssues(week))).toEqual(["tuesday"]);
  });
});
