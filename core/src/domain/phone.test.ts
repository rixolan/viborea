import { describe, expect, it } from "bun:test";
import { parsePhone, phoneIssue, PhoneError } from "./phone";

describe("phone", () => {
  it("acepta móvil PY sin 0", () => {
    expect(parsePhone("+595 981 123 456")).toBe("+595981123456");
    expect(phoneIssue("+595981123456")).toBeNull();
  });

  it("rechaza el 0 de más en PY", () => {
    expect(phoneIssue("+5950981123456")).toContain("0 del principio");
    expect(() => parsePhone("0981123456")).toThrow(PhoneError);
  });

  it("rechaza corto o vacío", () => {
    expect(phoneIssue("")).toBeTruthy();
    expect(phoneIssue("+595981")).toContain("Faltan");
    expect(phoneIssue("+5959811234567")).toContain("Sobran");
  });

  it("acepta AR y US", () => {
    expect(phoneIssue("+5491123456789")).toBeNull();
    expect(phoneIssue("+12025550123")).toBeNull();
    expect(phoneIssue("+54011123456789")).toContain("0 del principio");
  });
});
