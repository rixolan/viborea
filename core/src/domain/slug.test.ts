import { describe, expect, it } from "bun:test";
import { parseSlug, SlugError } from "./slug";

describe("parseSlug", () => {
  it("acepta slugs públicos", () => {
    expect(parseSlug("academiadg")).toBe("academiadg");
    expect(parseSlug("WPAcademia")).toBe("wpacademia");
  });

  it("rechaza reservados y basura", () => {
    expect(() => parseSlug("reservar")).toThrow(SlugError);
    expect(() => parseSlug("academia")).toThrow(SlugError);
    expect(() => parseSlug("api")).toThrow(SlugError);
    expect(() => parseSlug("ab")).toThrow(SlugError);
    expect(() => parseSlug("-nope")).toThrow(SlugError);
  });
});
