import { describe, expect, it } from "bun:test";
import { clearPlayerCookieHeader, cookieName, legacyStudentId, setPlayerCookieHeader } from "./player-cookie";
import { signPayload } from "./secret";

/** How the cookie was built before `students.cookie_token` existed. */
function legacyCookie(academyId: string, studentId: string): string {
  return `${academyId}.${studentId}.${signPayload(`${academyId}:${studentId}`)}`;
}

describe("player cookie", () => {
  it("guarda el token de la ficha, con banderas de seguridad", () => {
    const header = setPlayerCookieHeader("academiadg", "tok-123");
    expect(header.startsWith("vb_p_academiadg=tok-123;")).toBe(true);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Max-Age=15552000");
    expect(clearPlayerCookieHeader("academiadg")).toContain("Max-Age=0");
  });

  it("una academia no comparte nombre de cookie con otra", () => {
    expect(cookieName("academiadg")).toBe("vb_p_academiadg");
    expect(cookieName("wpacademia")).not.toBe(cookieName("academiadg"));
  });

  it("sigue leyendo la cookie firmada anterior, y sólo en su academia", () => {
    const raw = legacyCookie("academy-alameda", "student-1");
    expect(legacyStudentId("academy-alameda", raw)).toBe("student-1");
    expect(legacyStudentId("academy-wp", raw)).toBeNull();
    expect(legacyStudentId("academy-alameda", `${raw}x`)).toBeNull();
    expect(legacyStudentId("academy-alameda", "tok-123")).toBeNull();
  });
});
