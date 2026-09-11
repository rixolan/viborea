/**
 * In-process sliding-window limiter. One Bun process serves production
 * (AGENTS.md), so a Map is enough; it is a speed bump against one phone
 * hoarding the grid, not a distributed quota.
 */
export type RateVerdict = { ok: boolean; retryAfterSeconds: number };

export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    readonly limit: number,
    readonly windowMs: number,
    readonly maxKeys = 10_000,
  ) {}

  check(key: string, now = Date.now()): RateVerdict {
    this.prune(now);
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (recent.length >= this.limit) {
      const oldest = recent[0];
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000)) };
    }
    recent.push(now);
    this.hits.set(key, recent);
    return { ok: true, retryAfterSeconds: 0 };
  }

  /** Give a hit back when the request turned out not to count. */
  release(key: string): void {
    const recent = this.hits.get(key);
    if (recent?.length) recent.pop();
  }

  private prune(now: number): void {
    const cutoff = now - this.windowMs;
    for (const [key, times] of this.hits) {
      const kept = times.filter((t) => t > cutoff);
      if (kept.length) this.hits.set(key, kept);
      else this.hits.delete(key);
    }
    if (this.hits.size > this.maxKeys) this.hits.clear();
  }
}

/** Behind Traefik the socket address is the proxy, so read the header. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
