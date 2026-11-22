import { createHmac, timingSafeEqual } from "node:crypto";
import { InternalServerError, ValidationError } from "@shared/errors/index.ts";

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
}

export class RazorpayService {
  getMode(): "MOCK" | "RAZORPAY" {
    if (process.env.PAYMENT_MODE?.trim().toUpperCase() !== "MOCK") return "RAZORPAY";
    if (process.env.NODE_ENV === "production") {
      throw new InternalServerError("Mock payments are disabled in production");
    }
    return "MOCK";
  }

  private credentials(): { keyId: string; keySecret: string } {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new InternalServerError("Payment provider is not configured");
    return { keyId, keySecret };
  }

  getPublicKeyId(): string {
    return this.credentials().keyId;
  }

  async createOrder(amount: number, currency: string, receipt: string): Promise<RazorpayOrder> {
    if (this.getMode() === "MOCK") {
      return { id: `test_order_${receipt}_${Date.now()}`, amount, currency, status: "created" };
    }
    const credentials = this.credentials();
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, currency, receipt, payment_capture: 1 }),
    });
    if (!response.ok) throw new InternalServerError("Unable to create payment order");
    const order = await response.json() as RazorpayOrder;
    if (!order.id || order.amount !== amount || order.currency !== currency) throw new InternalServerError("Payment provider returned an invalid order");
    return order;
  }

  verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
    const { keySecret } = this.credentials();
    return this.matchesHmac(keySecret, `${orderId}|${paymentId}`, signature);
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new InternalServerError("Payment webhook is not configured");
    return this.matchesHmac(secret, rawBody, signature);
  }

  async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    const credentials = this.credentials();
    const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64")}` },
    });
    if (!response.ok) throw new InternalServerError("Unable to verify payment with provider");
    return await response.json() as RazorpayPayment;
  }

  assertCheckoutPayload(orderId: unknown, paymentId: unknown, signature: unknown): { orderId: string; paymentId: string; signature: string } {
    if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string" ||
      !/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[\da-f]{64}$/i.test(signature)) {
      throw new ValidationError("Payment verification details are invalid");
    }
    return { orderId, paymentId, signature };
  }

  private matchesHmac(secret: string, message: string | Buffer, signature: string): boolean {
    if (!/^[\da-f]{64}$/i.test(signature)) return false;
    const expected = createHmac("sha256", secret).update(message).digest();
    const actual = Buffer.from(signature, "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
