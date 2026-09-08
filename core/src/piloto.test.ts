import { describe, expect, it } from "bun:test";
import { activePack, openDb } from "./db";
import { pilotoReserva } from "./piloto";
import { seedIfEmpty } from "./seed";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("piloto reserva + pack", () => {
  it("compra pack de 10, confirma y deja 9", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const phone = `+59597${Date.now().toString().slice(-8)}`;
    const result = await pilotoReserva(db, {
      name: "Ana Piloto",
      phone,
      category: "2",
      side: "reves",
    });
    expect(result.status).toBe("confirmed");
    expect(result.remaining).toBe(9);
    expect(result.alert.message).toContain("Te quedan 9");
    const pack = await activePack(db, result.studentId, "group");
    expect(pack?.remaining).toBe(9);
    expect(pack?.size).toBe(10);
    const [student] = await db`SELECT category, side FROM students WHERE id = ${result.studentId}`;
    expect(student?.category).toBe("2");
    expect(student?.side).toBe("reves");
    await db.end();
  });
});
