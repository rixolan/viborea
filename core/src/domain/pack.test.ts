import { describe, expect, it } from "bun:test";
import {
  PackError,
  consumeOnConfirm,
  expiryFor,
  offeringKindFromCapacity,
  purchasePack,
  restoreOnCancel,
} from "./pack";

const t0 = new Date("2026-09-08T12:00:00.000Z");

function pack10() {
  return purchasePack({
    id: "pack-1",
    studentId: "st-1",
    offeringKind: "group",
    size: 10,
    purchasedAt: t0,
  });
}

describe("compra de paquete", () => {
  it("un 10 nace con 10 clases y vence a 60 días", () => {
    const pack = pack10();
    expect(pack.remaining).toBe(10);
    expect(pack.expiresAt).toEqual(expiryFor(10, t0));
    expect(pack.expiresAt.getTime() - t0.getTime()).toBe(60 * 86_400_000);
  });

  it("individual es cupo 1; grupal es el resto", () => {
    expect(offeringKindFromCapacity(1)).toBe("individual");
    expect(offeringKindFromCapacity(4)).toBe("group");
  });
});

describe("consumo al confirmar", () => {
  it("cada confirmación baja 1 y avisa cuántas quedan", () => {
    let pack = pack10();
    const first = consumeOnConfirm(pack, t0, "group");
    expect(first.pack.remaining).toBe(9);
    expect(first.alert.buyAgain).toBe(false);
    expect(first.alert.message).toContain("Te quedan 9");
    pack = first.pack;
    for (let i = 0; i < 8; i++) pack = consumeOnConfirm(pack, t0, "group").pack;
    const last = consumeOnConfirm(pack, t0, "group");
    expect(last.pack.remaining).toBe(0);
    expect(last.alert.buyAgain).toBe(true);
    expect(last.alert.message).toContain("última clase");
  });

  it("no mezcla grupal con individual", () => {
    expect(() => consumeOnConfirm(pack10(), t0, "individual")).toThrow(PackError);
  });

  it("no consume vencido ni vacío", () => {
    const expired = { ...pack10(), expiresAt: new Date("2026-09-01T00:00:00.000Z") };
    expect(() => consumeOnConfirm(expired, t0, "group")).toThrow("venció");
    const empty = { ...pack10(), remaining: 0 };
    expect(() => consumeOnConfirm(empty, t0, "group")).toThrow("no tiene clases");
  });
});

describe("devolución al cancelar", () => {
  it("antes del cutoff suma 1 y no pasa del size", () => {
    const used = consumeOnConfirm(pack10(), t0, "group").pack;
    expect(restoreOnCancel(used).remaining).toBe(10);
    expect(restoreOnCancel(pack10()).remaining).toBe(10);
  });
});
