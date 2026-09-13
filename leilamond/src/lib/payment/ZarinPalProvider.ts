import type {
  PaymentProvider,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from "./PaymentProvider";

/**
 * پیاده‌سازی واقعی درگاه زرین‌پال.
 * MERCHANT_ID باید در Environment Variable به نام PAYMENT_MERCHANT_ID قرار بگیرد.
 * این فایل هرگز نباید در Client/Frontend import یا bundle شود — فقط سمت سرور.
 */

const ZARINPAL_REQUEST_URL = "https://api.zarinpal.com/pg/v4/payment/request.json";
const ZARINPAL_VERIFY_URL = "https://api.zarinpal.com/pg/v4/payment/verify.json";
const ZARINPAL_GATEWAY_URL = "https://www.zarinpal.com/pg/StartPay/";

export class ZarinPalProvider implements PaymentProvider {
  readonly key = "zarinpal";

  private get merchantId(): string {
    const id = process.env.PAYMENT_MERCHANT_ID;
    if (!id) {
      throw new Error(
        "PAYMENT_MERCHANT_ID تنظیم نشده است. آن را در .env قرار دهید."
      );
    }
    return id;
  }

  async requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    try {
      const res = await fetch(ZARINPAL_REQUEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          amount: input.amount,
          description: input.description,
          callback_url: input.callbackUrl,
          metadata: {
            mobile: input.customerMobile,
            email: input.customerEmail,
          },
        }),
      });
      const data = await res.json();

      if (data?.data?.code === 100 && data.data.authority) {
        return {
          ok: true,
          authority: data.data.authority,
          redirectUrl: `${ZARINPAL_GATEWAY_URL}${data.data.authority}`,
        };
      }

      return {
        ok: false,
        errorMessage: data?.errors?.message ?? "خطا در ایجاد تراکنش پرداخت",
      };
    } catch (err) {
      return { ok: false, errorMessage: "ارتباط با درگاه پرداخت برقرار نشد" };
    }
  }

  async verifyPayment(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    try {
      const res = await fetch(ZARINPAL_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          amount: input.amount,
          authority: input.authority,
        }),
      });
      const data = await res.json();

      // کد 100: تایید موفق. کد 101: قبلاً Verify شده (باید Idempotent مدیریت شود).
      if (data?.data?.code === 100 || data?.data?.code === 101) {
        return { ok: true, refId: String(data.data.ref_id ?? ""), rawResponse: data };
      }

      return {
        ok: false,
        rawResponse: data,
        errorMessage: data?.errors?.message ?? "تایید پرداخت ناموفق بود",
      };
    } catch (err) {
      return { ok: false, errorMessage: "ارتباط با درگاه پرداخت برقرار نشد" };
    }
  }
}
