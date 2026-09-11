export type WhatsappConfig = {
  token: string;
  phoneNumberId: string;
};

export type WhatsappSendResult = {
  ok: boolean;
  channel: "text" | "template" | "dry-run";
  id?: string;
  error?: string;
};

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): WhatsappConfig | null {
  const token = env.WHATSAPP_TEST_TOKEN;
  const phoneNumberId = env.WHATSAPP_TEST_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
}
export function digits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  // PY local 09xx… pasted after 595 → 5950…; E.164 drops that 0.
  if (d.startsWith("5950") && d.length === 13) return `595${d.slice(4)}`;
  return d;
}

/** Just enough of `fetch` to POST JSON. `typeof fetch` also demands preconnect. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

async function graphPost(
  cfg: WhatsappConfig,
  payload: unknown,
  fetchFn: FetchLike,
): Promise<{ ok: boolean; id?: string; error?: string; status: number; body: unknown }> {
  const res = await fetchFn(`https://graph.facebook.com/v21.0/${cfg.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as {
    messages?: { id: string }[];
    error?: { message?: string; code?: number };
  };
  const id = body.messages?.[0]?.id;
  const error = body.error?.message;
  return { ok: res.ok && Boolean(id), id, error, status: res.status, body };
}

export async function sendText(
  cfg: WhatsappConfig,
  to: string,
  text: string,
  fetchFn: FetchLike = fetch,
): Promise<WhatsappSendResult> {
  const result = await graphPost(
    cfg,
    {
      messaging_product: "whatsapp",
      to: digits(to),
      type: "text",
      text: { body: text, preview_url: false },
    },
    fetchFn,
  );
  return { ok: result.ok, channel: "text", id: result.id, error: result.error };
}

export async function sendHelloWorld(
  cfg: WhatsappConfig,
  to: string,
  fetchFn: FetchLike = fetch,
): Promise<WhatsappSendResult> {
  const result = await graphPost(
    cfg,
    {
      messaging_product: "whatsapp",
      to: digits(to),
      type: "template",
      template: { name: "hello_world", language: { code: "en_US" } },
    },
    fetchFn,
  );
  return { ok: result.ok, channel: "template", id: result.id, error: result.error };
}

/** Freeform pack text; if Meta blocks (no 24h window), fall back to approved hello_world. */
export async function notifyReservation(
  cfg: WhatsappConfig | null,
  to: string,
  text: string,
  fetchFn: FetchLike = fetch,
): Promise<WhatsappSendResult> {
  if (!cfg) return { ok: true, channel: "dry-run" };
  const first = await sendText(cfg, to, text, fetchFn);
  if (first.ok) return first;
  const fallback = await sendHelloWorld(cfg, to, fetchFn);
  if (fallback.ok) {
    return {
      ...fallback,
      error: `texto bloqueado (${first.error ?? "sin ventana 24h"}); enviado hello_world`,
    };
  }
  return { ok: false, channel: "text", error: first.error ?? fallback.error ?? "WhatsApp falló" };
}
