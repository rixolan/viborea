/**
 * Create a Chatwoot AgentBot that points at this Worker and attach it to an inbox.
 *
 *   CHATWOOT_BASE_URL=... \
 *   CHATWOOT_ACCESS_TOKEN=... \
 *   CHATWOOT_ACCOUNT_ID=1 \
 *   CHATWOOT_INBOX_ID=2 \
 *   OUTGOING_URL=https://bandeja-chatwoot-bot.<subdomain>.workers.dev \
 *   bun run scripts/register.ts
 */
const base = required("CHATWOOT_BASE_URL").replace(/\/$/, "");
const token = required("CHATWOOT_ACCESS_TOKEN");
const accountId = process.env.CHATWOOT_ACCOUNT_ID ?? "1";
const inboxId = required("CHATWOOT_INBOX_ID");
const outgoingUrl = required("OUTGOING_URL");
const name = process.env.AGENT_BOT_NAME ?? "Bandeja";

const headers = {
  api_access_token: token,
  "content-type": "application/json",
};

const created = await api("POST", `/api/v1/accounts/${accountId}/agent_bots`, {
  name,
  description: "Menu WhatsApp: confirmar / reprogramar / pagar / humano",
  outgoing_url: outgoingUrl,
  bot_type: 0,
});

const botId = (created as { id?: number }).id;
if (!botId) {
  console.error("create_failed", created);
  process.exit(1);
}

await api(
  "POST",
  `/api/v1/accounts/${accountId}/inboxes/${inboxId}/set_agent_bot`,
  { agent_bot: botId },
);

const attached = await api(
  "GET",
  `/api/v1/accounts/${accountId}/inboxes/${inboxId}/agent_bot`,
);
const attachedId =
  (attached as { agent_bot?: { id?: number } }).agent_bot?.id ??
  (attached as { id?: number }).id;

console.log(
  JSON.stringify(
    {
      bot_id: botId,
      inbox_id: Number(inboxId),
      outgoing_url: outgoingUrl,
      attached: attachedId === botId,
    },
    null,
    2,
  ),
);

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`missing env ${name}`);
    process.exit(1);
  }
  return value;
}

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(method, path, res.status, text.slice(0, 400));
    process.exit(1);
  }
  return text ? JSON.parse(text) : {};
}
