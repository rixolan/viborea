import { describe, expect, it } from "bun:test";
import { digits, notifyReservation, sendText } from "./whatsapp";

const cfg = { token: "tok", phoneNumberId: "105" };

describe("whatsapp", () => {
  it("normaliza teléfono a dígitos", () => {
    expect(digits("+595 981 111 111")).toBe("595981111111");
    expect(digits("5950971638427")).toBe("595971638427");
  });

  it("envía texto al Cloud API", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const fetchFn = (async (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body)) });
      return new Response(JSON.stringify({ messages: [{ id: "wamid.1" }] }), { status: 200 });
    });
    const result = await sendText(cfg, "+595981111111", "Te quedan 9", fetchFn);
    expect(result.ok).toBe(true);
    expect(result.id).toBe("wamid.1");
    expect(calls[0]?.url).toContain("/105/messages");
    expect(calls[0]?.body).toMatchObject({
      messaging_product: "whatsapp",
      to: "595981111111",
      type: "text",
    });
  });

  it("sin config no llama a Meta", async () => {
    let called = false;
    const fetchFn = (async () => {
      called = true;
      return new Response("{}");
    });
    const result = await notifyReservation(null, "5959", "hola", fetchFn);
    expect(result.channel).toBe("dry-run");
    expect(called).toBe(false);
  });

  it("si el texto falla, cae a hello_world", async () => {
    let n = 0;
    const fetchFn = (async (_url: string, init?: RequestInit) => {
      n += 1;
      const body = JSON.parse(String(init?.body)) as { type: string };
      if (body.type === "text") {
        return new Response(JSON.stringify({ error: { message: "Re-engagement" } }), { status: 400 });
      }
      return new Response(JSON.stringify({ messages: [{ id: "wamid.hw" }] }), { status: 200 });
    });
    const result = await notifyReservation(cfg, "15551234567", "Te quedan 9", fetchFn);
    expect(n).toBe(2);
    expect(result.ok).toBe(true);
    expect(result.channel).toBe("template");
    expect(result.error).toContain("hello_world");
  });
});
