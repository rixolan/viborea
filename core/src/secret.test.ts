import { describe, expect, it } from "bun:test";
import { assertSecrets, SecretError, legacySecrets, signPayload, verifyPayload } from "./secret";

const prod = { NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv;

describe("secretos heredados", () => {
  it("producción exige la clave de Clerk, y nada más", () => {
    expect(() => assertSecrets(prod)).toThrow(SecretError);
    expect(() => assertSecrets({ ...prod, CLERK_SECRET_KEY: "sk_live_x" })).not.toThrow();
    // Ya no hay secreto de firma que exigir: los enlaces nuevos son tokens.
    expect(() => assertSecrets({ ...prod, CLERK_SECRET_KEY: "sk_live_x" })).not.toThrow();
  });

  it("verifica contra el actual y los retirados, sin el constante del repo", () => {
    const env = {
      ...prod,
      PLAYER_COOKIE_SECRET: "nuevo",
      PLAYER_COOKIE_SECRET_OLD: "viejo",
      CLERK_SECRET_KEY: "sk_live_x",
    } as unknown as NodeJS.ProcessEnv;
    expect(legacySecrets(env)).toEqual(["nuevo", "viejo", "sk_live_x"]);
    expect(legacySecrets(env)).not.toContain("dev-player-cookie");
    const mac = signPayload("academy-a:booking-1", env);
    expect(verifyPayload("academy-a:booking-1", mac, env)).toBe(true);
    expect(verifyPayload("academy-a:booking-2", mac, env)).toBe(false);
    // firmado con el retirado: sigue abriendo
    const old = signPayload("academy-a:booking-1", { ...prod, PLAYER_COOKIE_SECRET: "viejo" } as NodeJS.ProcessEnv);
    expect(verifyPayload("academy-a:booking-1", old, env)).toBe(true);
  });

  it("sin ningún secreto no verifica nada, y no explota", () => {
    const none = prod;
    expect(legacySecrets(none)).toEqual([]);
    expect(verifyPayload("x", "y", none)).toBe(false);
    expect(() => signPayload("x", none)).toThrow(SecretError);
  });

  it("fuera de producción cae al secreto de dev", () => {
    expect(legacySecrets({} as NodeJS.ProcessEnv)).toEqual(["dev-player-cookie"]);
  });
});
