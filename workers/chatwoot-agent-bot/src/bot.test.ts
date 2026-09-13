import { describe, expect, test } from "bun:test";
import {
  BOOKING_URL,
  FALLBACK_PROMPT,
  GREETING_PROMPT,
  HORARIOS_PROMPT,
  MANAGE_PROMPT,
  NUEVO_NEXT_ITEMS,
  NUEVO_PROMPT,
  RESERVAR_PROMPT,
  asIncoming,
  decide,
  isAffirmative,
  isGreeting,
  matchIntent,
  norm,
  replyForIntent,
} from "./bot";

describe("norm", () => {
  test("strips accents and case", () => {
    expect(norm("  Confirmar clase  ")).toBe("confirmar clase");
  });
});

describe("isGreeting", () => {
  test("accepts common openers", () => {
    expect(isGreeting("hola")).toBe(true);
    expect(isGreeting("menu")).toBe(true);
    expect(isGreeting("/start")).toBe(true);
  });

  test("rejects other text", () => {
    expect(isGreeting("quiero pagar")).toBe(false);
  });
});

describe("asIncoming", () => {
  test("reads WhatsApp list replies from submitted_values", () => {
    const msg = asIncoming({
      event: "message_created",
      message_type: "incoming",
      content: "",
      content_attributes: {
        submitted_values: [{ title: "Pagar", value: "pagar" }],
      },
      conversation: { id: 2, inbox_id: 2 },
      sender: { type: "contact" },
    });
    expect(msg.content).toBe("pagar");
  });

  test("unwraps { message } envelopes", () => {
    const msg = asIncoming({
      event: "message_created",
      message: {
        message_type: 0,
        content: "hola",
        conversation: { id: 9, inbox_id: 2 },
        sender: { type: "contact" },
      },
    });
    expect(msg.content).toBe("hola");
    expect(msg.conversation?.id).toBe(9);
  });
});

describe("decide", () => {
  const inbox = "2";

  test("opens the menu on greeting", () => {
    expect(
      decide(
        {
          event: "message_created",
          message_type: "incoming",
          content: "Hola",
          conversation: { id: 2, inbox_id: 2 },
          sender: { type: "contact" },
        },
        inbox,
      ),
    ).toEqual({
      action: "menu",
      conversationId: 2,
      prompt: GREETING_PROMPT,
    });
  });

  test("maps first-timer and availability titles", () => {
    const base = {
      event: "message_created",
      message_type: "incoming",
      conversation: { id: 2, inbox_id: 2 },
      sender: { type: "contact" },
    };
    expect(decide({ ...base, content: "Soy nuevo" }, inbox)).toEqual({
      action: "intent",
      conversationId: 2,
      intent: "nuevo",
    });
    expect(decide({ ...base, content: "disponibilidad" }, inbox)).toEqual({
      action: "intent",
      conversationId: 2,
      intent: "horarios",
    });
  });

  test("maps list title to intent", () => {
    expect(
      decide(
        {
          event: "message_created",
          message_type: "incoming",
          content: "Confirmar clase",
          conversation: { id: 2, inbox_id: 2 },
          sender: { type: "contact" },
        },
        inbox,
      ),
    ).toEqual({ action: "intent", conversationId: 2, intent: "confirmar" });
  });

  test("ignores outgoing messages", () => {
    expect(
      decide(
        {
          event: "message_created",
          message_type: "outgoing",
          content: "hola",
          conversation: { id: 2, inbox_id: 2 },
        },
        inbox,
      ),
    ).toEqual({ action: "ignore", reason: "ignored" });
  });

  test("does not reopen the menu after handoff to a human", () => {
    const handed = {
      event: "message_created",
      message_type: "incoming",
      content: "Hola",
      conversation: {
        id: 6,
        inbox_id: 2,
        assignee_id: 1,
        meta: { assignee: { id: 1, type: "user" } },
      },
      sender: { type: "contact" },
    };
    expect(decide(handed, inbox)).toEqual({ action: "ignore", reason: "handed off" });
    expect(decide({ ...handed, content: "Soy nuevo" }, inbox)).toEqual({
      action: "ignore",
      reason: "handed off",
    });
  });
});

describe("matchIntent", () => {
  test("reads aliases in a sentence", () => {
    expect(matchIntent(norm("quiero ver los horarios"))).toBe("horarios");
    expect(matchIntent(norm("precios"))).toBe("nuevo");
    expect(matchIntent(norm("primera clase"))).toBe("reservar");
    expect(matchIntent(norm("Reservar primera clase"))).toBe("reservar");
  });
});

describe("isAffirmative", () => {
  test("accepts short yes", () => {
    expect(isAffirmative("si")).toBe(true);
    expect(isAffirmative("dale")).toBe(true);
    expect(isAffirmative("no")).toBe(false);
  });
});

describe("replyForIntent", () => {
  test("first-timer pitch lists dual price and 24h cancel, then a booking CTA", () => {
    const nuevo = replyForIntent("nuevo", "Diego");
    expect(nuevo.kind).toBe("select");
    expect(nuevo.items).toEqual(NUEVO_NEXT_ITEMS);
    expect(nuevo.awaiting).toBe("reservar");
    expect(nuevo.content).toContain("Diego González");
    expect(nuevo.content).toContain("Dual");
    expect(nuevo.content).toContain("120.000");
    expect(nuevo.content).toContain("Individual");
    expect(nuevo.content).toContain("Grupal");
    expect(nuevo.content).toContain("24 h");
    expect(nuevo.content).toContain("wistia.com");
    expect(replyForIntent("reservar", "Diego").content).toContain(BOOKING_URL);
    expect(replyForIntent("horarios", "Diego").kind).toBe("text");
    expect(replyForIntent("horarios", "Diego").content).toContain(BOOKING_URL);
    expect(replyForIntent("horarios", "Diego").content).not.toContain("Mañana 11:00");
    expect(replyForIntent("confirmar", "Diego").content).toContain(BOOKING_URL);
    expect(replyForIntent("reprogramar", "Diego").content).toContain(BOOKING_URL);
  });

  test("player copy never names Viborea; book URL is SimplyBook", () => {
    const copy = [
      GREETING_PROMPT,
      FALLBACK_PROMPT,
      NUEVO_PROMPT,
      RESERVAR_PROMPT,
      HORARIOS_PROMPT,
      MANAGE_PROMPT,
      BOOKING_URL,
      replyForIntent("pagar", "Diego").content,
      replyForIntent("humano", "Diego").content,
    ].join("\n");
    expect(copy.toLowerCase()).not.toContain("viborea");
    expect(BOOKING_URL).toBe("https://academiadg.secure.simplybook.me");
  });

  test("sí after the first-timer pitch means book", () => {
    expect(
      decide(
        {
          event: "message_created",
          message_type: "incoming",
          content: "Sí",
          conversation: { id: 6, inbox_id: 2, custom_attributes: { bot_awaiting: "reservar" } },
          sender: { type: "contact" },
        },
        "2",
      ),
    ).toEqual({ action: "intent", conversationId: 6, intent: "reservar" });
  });

  test("human is a User handoff", () => {
    expect(replyForIntent("humano", "Diego")).toEqual({
      kind: "handoff",
      content: "Te paso con Diego. En un rato te escribe.",
      awaiting: null,
    });
  });
});
