import { describe, expect, it } from "bun:test";
import { DG_COACHES } from "./seed";

describe("roster DG", () => {
  it("no incluye a Diego y todos hablan español", () => {
    expect(DG_COACHES.some((c) => /diego/i.test(c.name))).toBe(false);
    expect(DG_COACHES.every((c) => c.languages[0] === "es")).toBe(true);
  });

  it("carga idiomas y bios del PDF de profes", () => {
    const byId = Object.fromEntries(DG_COACHES.map((c) => [c.id, c]));
    expect(byId["coach-tati-enciso"].languages).toEqual(["es", "gn"]);
    expect(byId["coach-tati-enciso"].bio).toMatch(/guaraní/i);
    expect(byId["coach-sergio-gonzalez"].languages).toEqual(["es", "en", "pt"]);
    expect(byId["coach-sergio-gonzalez"].bio).toMatch(/inglés/i);
    expect(byId["coach-matias-popovich"].languages).toEqual(["es", "pt"]);
    expect(byId["coach-fernando-laval"].bio).toBeTruthy();
    expect(byId["coach-rodolfo-silva"].bio).toBeNull();
    expect(byId["coach-rodrigo-avila"].bio).toBeNull();
  });
});
