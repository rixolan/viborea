import { describe, expect, it } from "bun:test";
import { activePack, openDb } from "./db";
import { pilotoReserva } from "./piloto";
import { seedIfEmpty } from "./seed";

describe("piloto reserva + pack", () => {
  it("compra pack de 10, confirma y deja 9", () => {
    const db = openDb(":memory:");
    seedIfEmpty(db);
    const result = pilotoReserva(db, { name: "Ana Piloto", phone: "+595981111111" });
    expect(result.status).toBe("confirmed");
    expect(result.remaining).toBe(9);
    expect(result.alert.message).toContain("Te quedan 9");
    const pack = activePack(db, result.studentId, "group");
    expect(pack?.remaining).toBe(9);
    expect(pack?.size).toBe(10);
  });

  it("la segunda reserva del mismo alumno gasta otra unidad", () => {
    const db = openDb(":memory:");
    seedIfEmpty(db);
    pilotoReserva(db, { name: "Ana Piloto", phone: "+595981111111" });
    const second = pilotoReserva(db, { name: "Ana Piloto", phone: "+595981111111" });
    expect(second.remaining).toBe(8);
  });
});
