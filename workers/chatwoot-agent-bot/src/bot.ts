export const MENU_ITEMS = [
  { title: "Confirmar clase", value: "confirmar" },
  { title: "Reprogramar", value: "reprogramar" },
  { title: "Pagar", value: "pagar" },
  { title: "Hablar con alguien", value: "humano" },
] as const;

export type MenuValue = (typeof MENU_ITEMS)[number]["value"];

const MENU_VALUES = new Set<string>(MENU_ITEMS.map((i) => i.value));
const MENU_TITLES = new Map(
  MENU_ITEMS.map((i) => [norm(i.title), i.value] as const),
);

export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function isGreeting(s: string): boolean {
  return /^(hola|hi|hello|buenas|buen dia|menu|opciones|\/menu|\/start|start)$/.test(
    s,
  );
}

export type Incoming = {
  event?: string;
  message_type?: string | number;
  private?: boolean;
  content?: string | null;
  content_type?: string;
  conversation?: { id?: number; inbox_id?: number };
  sender?: { type?: string };
};

function unwrapPayload(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") return {};
  const o = body as Record<string, unknown>;
  if (o.message && typeof o.message === "object") {
    return { ...(o.message as Record<string, unknown>), event: o.event };
  }
  return o;
}

function submittedText(attrs: unknown): string | null {
  if (!attrs || typeof attrs !== "object") return null;
  const a = attrs as Record<string, unknown>;
  const values = a.submitted_values;
  if (Array.isArray(values) && values[0]) {
    const first = values[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const row = first as Record<string, unknown>;
      if (typeof row.value === "string") return row.value;
      if (typeof row.title === "string") return row.title;
    }
  }
  if (typeof a.value === "string") return a.value;
  return null;
}

export function asIncoming(body: unknown): Incoming {
  const o = unwrapPayload(body);
  const conversation = (o.conversation ?? {}) as Incoming["conversation"];
  const sender = (o.sender ?? {}) as Incoming["sender"];
  const fromAttrs = submittedText(o.content_attributes);
  const content =
    typeof o.content === "string" && o.content.trim() ? o.content : fromAttrs;
  return {
    event: typeof o.event === "string" ? o.event : undefined,
    message_type: o.message_type as Incoming["message_type"],
    private: Boolean(o.private),
    content,
    content_type: typeof o.content_type === "string" ? o.content_type : undefined,
    conversation,
    sender,
  };
}

export function isIncomingMessage(msg: Incoming): boolean {
  const event = msg.event ?? "";
  if (event && !/message[._]created/i.test(event)) return false;
  if (msg.private) return false;
  const t = msg.message_type;
  const incoming = t === "incoming" || t === 0 || t === "0";
  if (!incoming) return false;
  if (msg.sender?.type && msg.sender.type !== "contact") return false;
  return true;
}

export type Decision =
  | { action: "ignore"; reason: string }
  | { action: "intent"; conversationId: number; intent: MenuValue }
  | { action: "menu"; conversationId: number; prompt: string };

export function decide(body: unknown, inboxId: string): Decision {
  const msg = asIncoming(body);
  if (!isIncomingMessage(msg)) return { action: "ignore", reason: "ignored" };

  const conversationId = msg.conversation?.id;
  const msgInbox = String(msg.conversation?.inbox_id ?? "");
  if (!conversationId) return { action: "ignore", reason: "no conversation" };
  if (msgInbox && inboxId && msgInbox !== inboxId) {
    return { action: "ignore", reason: "other inbox" };
  }

  const text = norm(msg.content ?? "");
  if (!text) return { action: "ignore", reason: "empty" };

  const intent = MENU_VALUES.has(text)
    ? (text as MenuValue)
    : MENU_TITLES.get(text);
  if (intent) return { action: "intent", conversationId, intent };

  return {
    action: "menu",
    conversationId,
    prompt: isGreeting(text)
      ? "Hola, ¿qué necesitás?"
      : "No te seguí. Elegí una opción:",
  };
}
