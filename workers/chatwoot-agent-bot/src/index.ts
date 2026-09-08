import { MENU_ITEMS, decide, replyForIntent, type MenuValue } from "./bot";

export type Env = {
  CHATWOOT_BASE_URL: string;
  CHATWOOT_ACCESS_TOKEN: string;
  CHATWOOT_ACCOUNT_ID: string;
  CHATWOOT_INBOX_ID: string;
  CHATWOOT_HUMAN_ASSIGNEE_ID: string;
  CHATWOOT_HANDOFF_NAME: string;
};

async function cw(env: Env, path: string, body: unknown): Promise<Response> {
  const base = env.CHATWOOT_BASE_URL.replace(/\/$/, "");
  return fetch(`${base}/api/v1/accounts/${env.CHATWOOT_ACCOUNT_ID}${path}`, {
    method: "POST",
    headers: {
      api_access_token: env.CHATWOOT_ACCESS_TOKEN,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function sendSelect(env: Env, conversationId: number, content: string) {
  return cw(env, `/conversations/${conversationId}/messages`, {
    content,
    content_type: "input_select",
    content_attributes: { items: MENU_ITEMS },
    private: false,
  });
}

async function sendText(env: Env, conversationId: number, content: string) {
  return cw(env, `/conversations/${conversationId}/messages`, {
    content,
    message_type: "outgoing",
    private: false,
  });
}

async function handleIntent(env: Env, conversationId: number, intent: MenuValue) {
  const human = env.CHATWOOT_HANDOFF_NAME || "alguien del equipo";
  const reply = replyForIntent(intent, human);
  if (reply.kind === "handoff") {
    await cw(env, `/conversations/${conversationId}/assignments`, {
      assignee_id: Number(env.CHATWOOT_HUMAN_ASSIGNEE_ID || "1"),
      assignee_type: "User",
    });
    return sendText(env, conversationId, reply.content);
  }
  if (reply.kind === "select") {
    return sendSelect(env, conversationId, reply.content);
  }
  return sendText(env, conversationId, reply.content);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "GET") {
      return new Response("viborea chatwoot bot ok", { status: 200 });
    }
    if (request.method !== "POST") {
      return new Response("method not allowed", { status: 405 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return new Response("bad json", { status: 400 });
    }

    const decision = decide(raw, env.CHATWOOT_INBOX_ID);
    if (decision.action === "ignore") {
      return new Response(decision.reason, { status: 200 });
    }

    const res =
      decision.action === "intent"
        ? await handleIntent(env, decision.conversationId, decision.intent)
        : await sendSelect(env, decision.conversationId, decision.prompt);

    if (!res.ok) {
      const err = await res.text();
      return new Response(err.slice(0, 300), { status: 502 });
    }
    return new Response("ok", { status: 200 });
  },
};
