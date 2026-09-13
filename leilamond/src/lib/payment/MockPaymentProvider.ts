import type {
  PaymentProvider,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from "./PaymentProvider";

/**
 * Provider تستی — فقط برای Development/Sandbox.
 * هرگز نباید در Production فعال باشد مگر برای QA داخلی با علامت‌گذاری واضح.
 * ساختار خروجی دقیقاً مطابق Providerهای واقعی است تا جایگزینی بدون تغییر UI ممکن باشد.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly key = "mock";

  async requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const authority = `MOCK-${input.orderId}-${Date.now()}`;
    return {
      ok: true,
      authority,
      redirectUrl: `${input.callbackUrl}?Authority=${authority}&Status=OK&mock=1`,
    };
  }

  async verifyPayment(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    return {
      ok: true,
      refId: `MOCKREF-${Date.now()}`,
      rawResponse: { mock: true, amount: input.amount },
    };
  }
}
