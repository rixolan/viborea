import { describe, expect, it } from "bun:test";
import {
  TPAGO_SANDBOX,
  TpagoClient,
  applyCallback,
  basicAuth,
  callbackAck,
  configFromEnv,
  handleTpagoHook,
  mapResponseCode,
} from "./tpago";

describe("TPago protocol", () => {
  it("Basic auth is public:private (colon, not semicolon)", () => {
    expect(basicAuth("aladdin", "opensesame")).toBe("Basic YWxhZGRpbjpvcGVuc2VzYW1l");
  });

  it("response_code 00 is paid; anything else failed; missing pending", () => {
    expect(mapResponseCode("00")).toBe("paid");
    expect(mapResponseCode("05")).toBe("failed");
    expect(mapResponseCode(undefined)).toBe("pending");
  });

  it("callback maps alias and requires ack success", () => {
    const applied = applyCallback({
      payment: { link_alias: "PACWB94571", response_code: "00", ticket_number: 1 },
    });
    expect(applied).toEqual({ alias: "PACWB94571", status: "paid", ticket: 1 });
    expect(callbackAck()).toEqual({ status: "success" });
  });

  it("rejects PYG-less amounts and other currencies", async () => {
    const client = new TpagoClient(null);
    await expect(
      client.createLink({ amount: 150000, currency: "USD", bookingId: "b1", description: "x" }),
    ).rejects.toThrow("PYG");
    await expect(
      client.createLink({ amount: 10.5, currency: "PYG", bookingId: "b1", description: "x" }),
    ).rejects.toThrow("entero");
  });

  it("dry-run (no env keys) returns a sandbox-shaped link without network", async () => {
    expect(configFromEnv({})).toBeNull();
    const client = new TpagoClient(null);
    expect(client.dryRun).toBe(true);
    const link = await client.createLink({
      amount: 150_000,
      currency: "PYG",
      bookingId: "book-abc123",
      description: "Individual Lucía",
    });
    expect(link.status).toBe("pending");
    expect(link.url.startsWith(TPAGO_SANDBOX)).toBe(true);
    expect(link.url).toContain("reference_id=book-abc123");
  });

  it("live client posts Basic auth to generate-payment-link", async () => {
    const calls: { url: string; auth: string; body: unknown }[] = [];
    const fakeFetch: typeof fetch = async (url, init) => {
      const headers = new Headers(init?.headers);
      calls.push({
        url: String(url),
        auth: headers.get("Authorization") ?? "",
        body: JSON.parse(String(init?.body)),
      });
      return new Response(
        JSON.stringify({
          status: "success",
          payment_link: {
            id: 623796,
            link_alias: "PEQJN72536",
            link_url: `${TPAGO_SANDBOX}/links?alias=PEQJN72536`,
          },
        }),
        { status: 200 },
      );
    };
    const client = new TpagoClient(
      {
        baseUrl: TPAGO_SANDBOX,
        commerceCode: "232",
        branchCode: "77",
        publicKey: "aladdin",
        privateKey: "opensesame",
      },
      fakeFetch,
    );
    const link = await client.createLink({
      amount: 10_000,
      currency: "PYG",
      bookingId: "ABC100",
      description: "probe",
    });
    expect(link.alias).toBe("PEQJN72536");
    expect(calls[0].url).toContain("/commerces/232/branches/77/links/generate-payment-link");
    expect(calls[0].auth).toBe("Basic YWxhZGRpbjpvcGVuc2VzYW1l");
    expect(calls[0].body).toEqual({
      amount: 10000,
      description: "probe",
      reference_id: "ABC100",
      require_user_data: false,
    });
  });

  it("hook always acks success so TPago does not reverse", async () => {
    const res = await handleTpagoHook(
      new Request("http://viborea.local/hooks/tpago", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payment: { link_alias: "PACWB94571", response_code: "00" },
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "success" });
    const bad = await handleTpagoHook(
      new Request("http://viborea.local/hooks/tpago", { method: "POST", body: "nope" }),
    );
    expect(await bad.json()).toEqual({ status: "success" });
  });
});
