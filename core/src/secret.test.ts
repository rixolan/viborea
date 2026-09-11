import { describe, expect, it } from "bun:test";
import { assertSecrets, SecretError, signingSecret, verifyingSecrets } from "./secret";

const prod = { NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv;

describe("secretos de firma", () => {
  it("en producción exige PLAYER_COOKIE_SECRET", () => {
    expect(() => signingSecret(prod)).toThrow(SecretError);
    expect(() => assertSecrets({ ...prod, PLAYER_COOKIE_SECRET: "s3cret" })).toThrow(/CLERK_SECRET_KEY/);
    expect(() =>
      assertSecrets({ ...prod, PLAYER_COOKIE_SECRET: "s3cret", CLERK_SECRET_KEY: "sk_live_x" }),
    ).not.toThrow();
  });

  it("fuera de producción cae al secreto de dev", () => {
    expect(signingSecret({} as NodeJS.ProcessEnv)).toBe("dev-player-cookie");
  });

  it("firma con el primario y verifica contra los retirados", () => {
    const env = {
      ...prod,
      PLAYER_COOKIE_SECRET: "nuevo",
      PLAYER_COOKIE_SECRET_OLD: "viejo",
      CLERK_SECRET_KEY: "sk_live_x",
    } as unknown as NodeJS.ProcessEnv;
    expect(signingSecret(env)).toBe("nuevo");
    expect(verifyingSecrets(env)).toEqual(["nuevo", "viejo", "sk_live_x"]);
    expect(verifyingSecrets(env)).not.toContain("dev-player-cookie");
  });
});
