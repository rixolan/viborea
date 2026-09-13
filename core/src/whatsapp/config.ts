/**
 * Sandbox Cloud API credentials. Infisical env `dev` (see `.infisical.json`):
 * `WHATSAPP_TEST_TOKEN`, `WHATSAPP_TEST_PHONE_NUMBER_ID`, `WHATSAPP_TEST_WABA_ID`.
 * Missing send keys → dry-run. Never the academy production WABA (KAPSO).
 */
export type WhatsappSendConfig = {
  token: string;
  phoneNumberId: string;
};

export type WhatsappWabaConfig = {
  token: string;
  wabaId: string;
};

export function sendConfigFromEnv(env: NodeJS.ProcessEnv = process.env): WhatsappSendConfig | null {
  const token = env.WHATSAPP_TEST_TOKEN;
  const phoneNumberId = env.WHATSAPP_TEST_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
}

/** @deprecated use sendConfigFromEnv */
export const configFromEnv = sendConfigFromEnv;

export function wabaConfigFromEnv(env: NodeJS.ProcessEnv = process.env): WhatsappWabaConfig | null {
  const token = env.WHATSAPP_TEST_TOKEN;
  const wabaId = env.WHATSAPP_TEST_WABA_ID;
  if (!token || !wabaId) return null;
  return { token, wabaId };
}
