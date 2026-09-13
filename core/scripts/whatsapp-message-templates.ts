/**
 * List / create / delete WhatsApp Cloud API message templates on the sandbox WABA.
 *
 *   infisical run --env=dev -- bun core/scripts/whatsapp-message-templates.ts list
 *   infisical run --env=dev -- bun core/scripts/whatsapp-message-templates.ts show NAME
 *   infisical run --env=dev -- bun core/scripts/whatsapp-message-templates.ts create \
 *     --name recordatorio_clase --language es --category UTILITY \
 *     --body "Hola {{1}}, te recordamos tu clase el {{2}} a las {{3}}." \
 *     --example "Alejandro|lunes 15/09|18:00" --footer "Academia DG"
 *   infisical run --env=dev -- bun core/scripts/whatsapp-message-templates.ts delete NAME
 *
 * Creates do not send a message. See docs/whatsapp.md.
 */
import {
  createMessageTemplate,
  deleteMessageTemplate,
  listMessageTemplates,
  wabaConfigFromEnv,
  type MessageTemplateCategory,
  type MessageTemplateDraft,
} from "../src/whatsapp";

const cfg = wabaConfigFromEnv();
if (!cfg) {
  throw new Error("WHATSAPP_TEST_TOKEN y WHATSAPP_TEST_WABA_ID (Infisical env dev)");
}

const args = process.argv.slice(2);
const cmd = args[0];

function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return undefined;
  return args[i + 1];
}

function need(name: string): string {
  const v = flag(name);
  if (!v) throw new Error(`falta --${name}`);
  return v;
}

function positionalExample(raw: string): string[] {
  return raw.split("|").map((s) => s.trim());
}

if (cmd === "list" || cmd === "show") {
  const want = cmd === "show" ? args[1] : undefined;
  if (cmd === "show" && !want) throw new Error("uso: show NAME");
  const { ok, templates, error } = await listMessageTemplates(cfg);
  if (!ok) throw new Error(error ?? "list failed");
  const rows = want ? templates.filter((t) => t.name === want) : templates;
  if (want && rows.length === 0) {
    console.log("not found", want);
    process.exit(1);
  }
  for (const t of rows) {
    console.log([t.status, t.category, t.language, t.name, t.id ?? "", t.rejected_reason ?? ""].join("\t"));
  }
} else if (cmd === "create") {
  const name = need("name");
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error("name: solo a-z, 0-9 y _");
  const language = need("language");
  const category = need("category").toUpperCase() as MessageTemplateCategory;
  if (!["UTILITY", "MARKETING", "AUTHENTICATION"].includes(category)) {
    throw new Error("category: UTILITY | MARKETING | AUTHENTICATION");
  }
  const body = need("body");
  const example = flag("example");
  const footer = flag("footer");
  const hasVars = /\{\{\d+\}\}/.test(body);
  if (hasVars && !example) throw new Error("el body tiene {{n}}; pasá --example a|b|c");
  const components: unknown[] = [
    {
      type: "BODY",
      text: body,
      ...(example ? { example: { body_text: [positionalExample(example)] } } : {}),
    },
  ];
  if (footer) components.push({ type: "FOOTER", text: footer });
  const draft: MessageTemplateDraft = { name, language, category, components };
  const result = await createMessageTemplate(cfg, draft);
  if (!result.ok) {
    console.error(JSON.stringify(result.body, null, 2));
    throw new Error(result.error ?? `create failed HTTP ${result.status}`);
  }
  console.log([result.templateStatus, result.category, result.id, name].join("\t"));
} else if (cmd === "delete") {
  const name = args[1];
  if (!name) throw new Error("uso: delete NAME");
  const result = await deleteMessageTemplate(cfg, name);
  if (!result.ok) {
    console.error(JSON.stringify(result.body, null, 2));
    throw new Error(result.error ?? `delete failed HTTP ${result.status}`);
  }
  console.log("deleted", name);
} else {
  console.error(`uso: list | show NAME | create --name … | delete NAME
Infisical: infisical run --env=dev -- bun core/scripts/whatsapp-message-templates.ts …`);
  process.exit(1);
}
