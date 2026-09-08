/**
 * Payment port. Live adapters (TPago, Pagopar, Mercado Pago, Stripe, Redsys)
 * plug in later. This stub never talks to a network.
 */

export type PaymentStatus = "pending" | "paid" | "failed";

export interface CreateChargeInput {
  amount: number;
  currency: string;
  bookingId: string;
  description?: string;
}

export interface PaymentCharge {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

export interface PaymentProvider {
  createCharge(input: CreateChargeInput): Promise<PaymentCharge>;
  markPaid(id: string): Promise<PaymentCharge>;
  markFailed(id: string): Promise<PaymentCharge>;
  getStatus(id: string): Promise<PaymentStatus>;
}

export class StubPaymentProvider implements PaymentProvider {
  private readonly charges = new Map<string, PaymentCharge>();
  private seq = 0;

  async createCharge(input: CreateChargeInput): Promise<PaymentCharge> {
    this.seq += 1;
    const charge: PaymentCharge = {
      id: `pay_stub_${this.seq}`,
      bookingId: input.bookingId,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
    };
    this.charges.set(charge.id, charge);
    return charge;
  }

  async markPaid(id: string): Promise<PaymentCharge> {
    return this.setStatus(id, "paid");
  }

  async markFailed(id: string): Promise<PaymentCharge> {
    return this.setStatus(id, "failed");
  }

  async getStatus(id: string): Promise<PaymentStatus> {
    const charge = this.charges.get(id);
    if (!charge) throw new Error(`Unknown charge ${id}`);
    return charge.status;
  }

  private setStatus(id: string, status: PaymentStatus): PaymentCharge {
    const charge = this.charges.get(id);
    if (!charge) throw new Error(`Unknown charge ${id}`);
    const next = { ...charge, status };
    this.charges.set(id, next);
    return next;
  }
}
