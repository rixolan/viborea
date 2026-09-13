import type { WhatsappSendConfig } from "./config";
import { graphRequest, type FetchLike } from "./graph";
import { digits } from "./phone";

export type { FetchLike };

export type WhatsappSendResult = {
  ok: boolean;
  channel: "text" | "template" | "dry-run";
  id?: string;
  error?: string;
};

export type MessageTemplateSend = {
  name: string;
  language: string;
  components?: unknown[];
};

function messageId(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const messages = (body as { messages?: { id: string }[] }).messages;
  return messages?.[0]?.id;
}

async function postMessage(
  cfg: WhatsappSendConfig,
  payload: unknown,
  fetchFn: FetchLike,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const result = await graphRequest(
    cfg.token,
    `${cfg.phoneNumberId}/messages`,
    { method: "POST", body: JSON.stringify(payload) },
    fetchFn,
  );
  const id = messageId(result.body);
  return { ok: result.ok && Boolean(id), id, error: result.error };
}

export async function sendText(
  cfg: WhatsappSendConfig,
  to: string,
  text: string,
  fetchFn: FetchLike = fetch,
): Promise<WhatsappSendResult> {
  const result = await postMessage(
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

export async function sendMessageTemplate(
  cfg: WhatsappSendConfig,
  to: string,
  template: MessageTemplateSend,
  fetchFn: FetchLike = fetch,
): Promise<WhatsappSendResult> {
  const result = await postMessage(
    cfg,
    {
      messaging_product: "whatsapp",
      to: digits(to),
      type: "template",
      template: {
        name: template.name,
        language: { code: template.language },
        ...(template.components ? { components: template.components } : {}),
      },
    },
    fetchFn,
  );
  return { ok: result.ok, channel: "template", id: result.id, error: result.error };
}

/** Meta's sample message template; not academy copy. */
export function sendHelloWorld(
  cfg: WhatsappSendConfig,
  to: string,
  fetchFn: FetchLike = fetch,
): Promise<WhatsappSendResult> {
  return sendMessageTemplate(cfg, to, { name: "hello_world", language: "en_US" }, fetchFn);
}

/** Freeform pack text; if Meta blocks (no 24h window), fall back to approved hello_world. */
export async function notifyReservation(
  cfg: WhatsappSendConfig | null,
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
