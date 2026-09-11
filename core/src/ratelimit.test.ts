import { describe, expect, it } from "bun:test";
import { RateLimiter, clientIp } from "./ratelimit";

describe("RateLimiter", () => {
  it("corta al pasar el límite y se recupera con el tiempo", () => {
    const limiter = new RateLimiter(2, 1000);
    const t = 1_000_000;
    expect(limiter.check("ip", t).ok).toBe(true);
    expect(limiter.check("ip", t + 10).ok).toBe(true);
    const blocked = limiter.check("ip", t + 20);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
    expect(limiter.check("otra-ip", t + 20).ok).toBe(true);
    expect(limiter.check("ip", t + 1100).ok).toBe(true);
  });

  it("release devuelve el intento", () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.check("ip", 1).ok).toBe(true);
    limiter.release("ip");
    expect(limiter.check("ip", 2).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("toma el primero de x-forwarded-for", () => {
    const req = new Request("http://x/", { headers: { "x-forwarded-for": "200.1.2.3, 10.0.0.1" } });
    expect(clientIp(req)).toBe("200.1.2.3");
    expect(clientIp(new Request("http://x/"))).toBe("unknown");
  });
});
