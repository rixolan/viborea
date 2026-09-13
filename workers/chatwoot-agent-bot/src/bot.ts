export const MENU_ITEMS = [
  { title: "Soy nuevo", value: "nuevo" },
  { title: "Ver horarios", value: "horarios" },
  { title: "Confirmar clase", value: "confirmar" },
  { title: "Reprogramar", value: "reprogramar" },
  { title: "Pagar", value: "pagar" },
  { title: "Hablar con alguien", value: "humano" },
] as const;

export const GREETING_PROMPT =
  "Hola, Academia DG.\n\nSi es tu primera vez, tocá «Soy nuevo».\nSi ya entrenás, elegí lo que necesitás.";

export const FALLBACK_PROMPT = "No te seguí. Elegí una opción:";

export const BOOKING_URL = "https://academiadg.secure.simplybook.me";
export const VIDEO_URL = "https://academiadg.wistia.com/s/m57ddl4jit16i4j";

export const NUEVO_PROMPT = `*Academia Diego González*
Pádel en Asunción — Lomas, Elite y Segurola.

*Clases (60 min)*
• Individual — Gs. 150.000
• Dual — Gs. 120.000
• Grupal — Gs. 100.000

Se paga adelantado. Si cancelás con *menos de 24 h*, se cobra la clase.

Español, inglés, portugués y guaraní.

Si querés conocer la academia más a fondo, preparamos este video:
${VIDEO_URL}

¿Reservamos tu primera clase?`;

export const NUEVO_NEXT_ITEMS = [
  { title: "Reservar primera clase", value: "reservar" },
  { title: "Ver horarios", value: "horarios" },
  { title: "Hablar con alguien", value: "humano" },
] as const;

export const RESERVAR_PROMPT = `Perfecto. Elegí sede, profe y horario acá:

${BOOKING_URL}

Si preferís que te anotemos nosotros, tocá «Hablar con alguien».`;

export const HORARIOS_PROMPT = `Los horarios de cada profe están acá:

${BOOKING_URL}

Elegí sede, profe y hora. Si preferís que te anotemos nosotros, tocá «Hablar con alguien».`;

export const MANAGE_PROMPT = `Para confirmar, cancelar o mover una reserva, usá el enlace de esa clase (te lo mandamos acá cuando la tengamos). Si querés una clase nueva:

${BOOKING_URL}`;

export type MenuValue = (typeof MENU_ITEMS)[number]["value"];
export type BotIntent = MenuValue | "reservar";
export type SelectItem = { title: string; value: string };

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

const NEXT_TITLES = new Map(
  NUEVO_NEXT_ITEMS.map((i) => [norm(i.title), i.value] as const),
);

const ALIASES: Array<[RegExp, BotIntent]> = [
  [/\b(reserv(ar|emos|a)|primera clase|anotar(me)?|quiero empezar)\b/, "reservar"],
  [/\b(nuevo|nueva|precios?|modalidades?|info|academia)\b/, "nuevo"],
  [/\b(horarios?|disponibilidad|huecos?|cuando)\b/, "horarios"],
];

export function isAffirmative(text: string): boolean {
  return /^(si+|dale|ok|okay|va+|vamos|claro|perfecto|de una|buenisimo|anota(me)?|reservemos|reservar)$/.test(
    text,
  );
}

export function matchIntent(text: string): BotIntent | undefined {
  if (text === "reservar") return "reservar";
  if (MENU_VALUES.has(text)) return text as MenuValue;
  const titled = MENU_TITLES.get(text) ?? NEXT_TITLES.get(text);
  if (titled) return titled as BotIntent;
  for (const [re, value] of ALIASES) {
    if (re.test(text)) return value;
  }
  return undefined;
}

export type IntentReply = {
  kind: "select" | "text" | "handoff";
  content: string;
  items?: readonly SelectItem[];
  awaiting?: "reservar" | null;
};

export function replyForIntent(intent: BotIntent, human: string): IntentReply {
  switch (intent) {
    case "nuevo":
      return { kind: "select", content: NUEVO_PROMPT, items: NUEVO_NEXT_ITEMS, awaiting: "reservar" };
    case "reservar":
      return { kind: "text", content: RESERVAR_PROMPT, awaiting: null };
    case "horarios":
      return { kind: "text", content: HORARIOS_PROMPT, awaiting: null };
    case "confirmar":
    case "reprogramar":
      return { kind: "text", content: MANAGE_PROMPT, awaiting: null };
    case "pagar":
      return {
        kind: "text",
        content:
          "Acá iría el link de pago. En este piloto es solo el texto. Cuando esté el enlace, te llega en este mismo paso.",
        awaiting: null,
      };
    case "humano":
      return {
        kind: "handoff",
        content: `Te paso con ${human}. En un rato te escribe.`,
        awaiting: null,
      };
  }
}

export type Incoming = {
  event?: string;
  message_type?: string | number;
  private?: boolean;
  content?: string | null;
  content_type?: string;
  conversation?: {
    id?: number;
    inbox_id?: number;
    assignee_id?: number | null;
    custom_attributes?: Record<string, unknown>;
    meta?: { assignee?: { id?: number; type?: string } | null };
    assignee?: { id?: number; type?: string } | null;
  };
  sender?: { type?: string };
};

export function hasHumanAssignee(conversation: Incoming["conversation"]): boolean {
  if (!conversation) return false;
  if (typeof conversation.assignee_id === "number" && conversation.assignee_id > 0) return true;
  const fromMeta = conversation.meta?.assignee?.id;
  if (typeof fromMeta === "number" && fromMeta > 0) return true;
  const fromObj = conversation.assignee?.id;
  return typeof fromObj === "number" && fromObj > 0;
}

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
  | { action: "intent"; conversationId: number; intent: BotIntent }
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
  if (hasHumanAssignee(msg.conversation)) {
    return { action: "ignore", reason: "handed off" };
  }

  const text = norm(msg.content ?? "");
  if (!text) return { action: "ignore", reason: "empty" };

  const awaiting = msg.conversation?.custom_attributes?.bot_awaiting;
  if (awaiting === "reservar" && isAffirmative(text)) {
    return { action: "intent", conversationId, intent: "reservar" };
  }

  const intent = matchIntent(text);
  if (intent) return { action: "intent", conversationId, intent };

  return {
    action: "menu",
    conversationId,
    prompt: isGreeting(text) ? GREETING_PROMPT : FALLBACK_PROMPT,
  };
}
