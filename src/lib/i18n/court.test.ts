import { describe, expect, it } from "vitest";
import { courtNoun } from "./court";

describe("courtNoun", () => {
  it("uses pista for Spain and bare Spanish", () => {
    expect(courtNoun("es-ES")).toBe("pista");
    expect(courtNoun("es")).toBe("pista");
    expect(courtNoun(undefined)).toBe("pista");
  });

  it("uses cancha for Argentina and Paraguay", () => {
    expect(courtNoun("es-AR")).toBe("cancha");
    expect(courtNoun("es-PY")).toBe("cancha");
    expect(courtNoun("es-PY")).toBe("cancha");
  });
});
