import { describe, expect, it } from "bun:test";
import { cookieName, decodePlayerCookie, encodePlayerCookie } from "./player-cookie";

describe("player cookie", () => {
  it("no sirve en otra academia", () => {
    const raw = encodePlayerCookie("academy-alameda", "student-1");
    expect(decodePlayerCookie("academy-alameda", raw)).toBe("student-1");
    expect(decodePlayerCookie("academy-wp", raw)).toBeNull();
    expect(cookieName("academiadg")).toBe("vb_p_academiadg");
    expect(cookieName("wpacademia")).not.toBe(cookieName("academiadg"));
  });

  it("rechaza mac alterada", () => {
    const raw = encodePlayerCookie("academy-alameda", "student-1");
    expect(decodePlayerCookie("academy-alameda", `${raw}x`)).toBeNull();
  });
});
