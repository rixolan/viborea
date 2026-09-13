import { describe, expect, it } from "bun:test";
import { createMessageTemplate, deleteMessageTemplate, listMessageTemplates } from "./message-templates";

const cfg = { token: "tok", wabaId: "4036" };

describe("whatsapp message templates", () => {
  it("lista contra la WABA, no el phone number", async () => {
    const calls: string[] = [];
    const fetchFn = (async (url: string) => {
      calls.push(url);
      return new Response(JSON.stringify({
        data: [{ name: "hello_world", status: "APPROVED", category: "UTILITY", language: "en_US" }],
      }), { status: 200 });
    });
    const result = await listMessageTemplates(cfg, fetchFn);
    expect(result.ok).toBe(true);
    expect(result.templates[0]?.name).toBe("hello_world");
    expect(calls[0]).toContain("/v21.0/4036/message_templates");
    expect(calls[0]).not.toContain("/105/");
  });

  it("crea con name/language/category/components", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const fetchFn = (async (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body)) });
      return new Response(JSON.stringify({ id: "1068", status: "PENDING", category: "UTILITY" }), {
        status: 200,
      });
    });
    const result = await createMessageTemplate(cfg, {
      name: "viborea_prueba_api_20260913",
      language: "es",
      category: "UTILITY",
      components: [{ type: "BODY", text: "Hola {{1}}." }],
    }, fetchFn);
    expect(result.ok).toBe(true);
    expect(result.id).toBe("1068");
    expect(result.templateStatus).toBe("PENDING");
    expect(calls[0]?.url).toContain("/4036/message_templates");
    expect(calls[0]?.body).toMatchObject({ name: "viborea_prueba_api_20260913", category: "UTILITY", language: "es" });
  });

  it("borra por name en la WABA", async () => {
    const calls: { url: string; method: string }[] = [];
    const fetchFn = (async (url: string, init?: RequestInit) => {
      calls.push({ url, method: String(init?.method ?? "GET") });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });
    const result = await deleteMessageTemplate(cfg, "viborea_prueba_api_20260913", fetchFn);
    expect(result.ok).toBe(true);
    expect(calls[0]?.method).toBe("DELETE");
    expect(calls[0]?.url).toContain("name=viborea_prueba_api_20260913");
  });
});
