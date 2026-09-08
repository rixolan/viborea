/**
 * TPago payment-link adapter.
 * Docs: https://tpagodocs.bancard.com.py/  (v3.16.0)
 * No production keys. Missing env → dry-run.
 */

export type PaymentStatus = "pending" | "paid" | "failed";

export type TpagoConfig = {
  baseUrl: string;
  commerceCode: string;
  branchCode: string;
  publicKey: string;
  privateKey: string;
};

export const TPAGO_SANDBOX = "https://comercios.bancard.com.py:8888";
export const TPAGO_PRODUCTION = "https://comercios.bancard.com.py";
export const TPAGO_CURRENCY = 600; // PYG
export const TPAGO_CALLBACK_IPS = [
  "190.128.218.209",
  "190.128.232.10",
  "190.104.129.98",
  "200.85.46.226",
] as const;

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): TpagoConfig | null {
  const publicKey = env.TPAGO_PUBLIC_KEY ?? "";
  const privateKey = env.TPAGO_PRIVATE_KEY ?? "";
  const commerceCode = env.TPAGO_COMMERCE_CODE ?? "";
  const branchCode = env.TPAGO_BRANCH_CODE ?? "";
  if (!publicKey || !privateKey || !commerceCode || !branchCode) return null;
  return {
    baseUrl: env.TPAGO_BASE_URL ?? TPAGO_SANDBOX,
    commerceCode,
    branchCode,
    publicKey,
    privateKey,
  };
}

export function basicAuth(publicKey: string, privateKey: string): string {
  return `Basic ${btoa(`${publicKey}:${privateKey}`)}`;
}

export type PaymentLink = {
  id: string;
  alias: string;
  url: string;
  amount: number;
  bookingId: string;
  status: PaymentStatus;
};

export type GenerateLinkInput = {
  amount: number;
  currency: string;
  bookingId: string;
  description: string;
};

export type TpagoCallback = {
  payment?: {
    link_alias?: string;
    status?: string;
    response_code?: string;
    amount?: number;
    ticket_number?: number;
    authorization_code?: string;
  };
};

export function mapResponseCode(code: string | undefined): PaymentStatus {
  if (code === "00") return "paid";
  if (!code) return "pending";
  return "failed";
}

export function applyCallback(body: TpagoCallback): {
  alias: string;
  status: PaymentStatus;
  ticket?: number;
} {
  const p = body.payment;
  if (!p?.link_alias) throw new Error("Callback TPago sin link_alias");
  return {
    alias: p.link_alias,
    status: mapResponseCode(p.response_code),
    ticket: p.ticket_number,
  };
}

/** TPago reverses the charge unless this exact JSON is returned. */
export function callbackAck(): { status: "success" } {
  return { status: "success" };
}

export type FetchLike = typeof fetch;

export class TpagoClient {
  constructor(
    readonly config: TpagoConfig | null,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  get dryRun(): boolean {
    return this.config === null;
  }

  async createLink(input: GenerateLinkInput): Promise<PaymentLink> {
    if (input.currency !== "PYG") {
      throw new Error(`TPago solo cobra PYG, no ${input.currency}`);
    }
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new Error("Monto TPago debe ser entero PYG > 0");
    }
    if (!this.config) {
      const alias = `DRYRUN${input.bookingId.replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase()}`;
      return {
        id: `dry_${input.bookingId}`,
        alias,
        url: `${TPAGO_SANDBOX}/links?alias=${alias}&reference_id=${encodeURIComponent(input.bookingId)}`,
        amount: input.amount,
        bookingId: input.bookingId,
        status: "pending",
      };
    }

    const path = `/external-commerce/api/0.1/commerces/${this.config.commerceCode}/branches/${this.config.branchCode}/links/generate-payment-link`;
    const res = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: basicAuth(this.config.publicKey, this.config.privateKey),
      },
      body: JSON.stringify({
        amount: input.amount,
        description: input.description,
        reference_id: input.bookingId,
        require_user_data: false,
      }),
    });
    const json = (await res.json()) as {
      status?: string;
      payment_link?: { id?: number; link_alias?: string; link_url?: string };
      messages?: { dsc?: string }[];
    };
    if (!res.ok || json.status !== "success" || !json.payment_link?.link_url) {
      const dsc = json.messages?.[0]?.dsc ?? `HTTP ${res.status}`;
      throw new Error(`TPago createLink: ${dsc}`);
    }
    return {
      id: String(json.payment_link.id ?? json.payment_link.link_alias),
      alias: json.payment_link.link_alias ?? "",
      url: json.payment_link.link_url,
      amount: input.amount,
      bookingId: input.bookingId,
      status: "pending",
    };
  }
}

export async function handleTpagoHook(req: Request): Promise<Response> {
  let body: TpagoCallback = {};
  try {
    body = (await req.json()) as TpagoCallback;
  } catch {
    /* still ack — a 4xx would reverse a real charge */
  }
  try {
    applyCallback(body);
  } catch {
    /* unknown/malformed still ack */
  }
  return Response.json(callbackAck());
}
