import { describe, expect, test } from "bun:test";
import { asIncoming, decide, isGreeting, norm } from "./bot";

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
      prompt: "Hola, ¿qué necesitás?",
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
});
