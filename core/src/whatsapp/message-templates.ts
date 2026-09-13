import type { WhatsappWabaConfig } from "./config";
import { graphRequest, type FetchLike } from "./graph";

export type MessageTemplateCategory = "UTILITY" | "MARKETING" | "AUTHENTICATION";

export type MessageTemplateDraft = {
  name: string;
  language: string;
  category: MessageTemplateCategory;
  components: unknown[];
  parameter_format?: "POSITIONAL" | "NAMED";
};

export type MessageTemplate = {
  id?: string;
  name: string;
  status?: string;
  category?: string;
  language?: string;
  rejected_reason?: string;
  components?: unknown[];
};

export type MessageTemplateWriteResult = {
  ok: boolean;
  status: number;
  id?: string;
  templateStatus?: string;
  category?: string;
  error?: string;
  body: unknown;
};

type ListBody = { data?: MessageTemplate[]; error?: { message?: string } };

export async function listMessageTemplates(
  cfg: WhatsappWabaConfig,
  fetchFn: FetchLike = fetch,
): Promise<{ ok: boolean; templates: MessageTemplate[]; error?: string }> {
  const result = await graphRequest(
    cfg.token,
    `${cfg.wabaId}/message_templates?limit=100&fields=name,status,category,language,rejected_reason,quality_score,id,components`,
    {},
    fetchFn,
  );
  const body = result.body as ListBody;
  return {
    ok: result.ok,
    templates: body.data ?? [],
    error: result.error,
  };
}

export async function createMessageTemplate(
  cfg: WhatsappWabaConfig,
  draft: MessageTemplateDraft,
  fetchFn: FetchLike = fetch,
): Promise<MessageTemplateWriteResult> {
  const result = await graphRequest(
    cfg.token,
    `${cfg.wabaId}/message_templates`,
    { method: "POST", body: JSON.stringify(draft) },
    fetchFn,
  );
  const body = result.body as { id?: string; status?: string; category?: string };
  return {
    ok: result.ok && Boolean(body.id),
    status: result.status,
    id: body.id,
    templateStatus: body.status,
    category: body.category,
    error: result.error,
    body: result.body,
  };
}

/** Deletes every language of that name. Meta reserves the name for 30 days. */
export async function deleteMessageTemplate(
  cfg: WhatsappWabaConfig,
  name: string,
  fetchFn: FetchLike = fetch,
): Promise<MessageTemplateWriteResult> {
  const result = await graphRequest(
    cfg.token,
    `${cfg.wabaId}/message_templates?name=${encodeURIComponent(name)}`,
    { method: "DELETE" },
    fetchFn,
  );
  const body = result.body as { success?: boolean };
  return {
    ok: result.ok && body.success !== false,
    status: result.status,
    error: result.error,
    body: result.body,
  };
}
