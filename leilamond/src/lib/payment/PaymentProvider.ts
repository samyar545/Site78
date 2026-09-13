/**
 * معماری پرداخت لیلاموند
 * ----------------------------------------------------------------------
 * هیچ منطق پرداختی نباید در UI پخش شود. تمام تصمیم‌گیری‌ها (ایجاد تراکنش،
 * Verify کردن، تطبیق مبلغ) سمت سرور و پشت این اینترفیس انجام می‌شود.
 *
 * فلو:
 *   createOrder → createPayment (requestPayment) → redirect به درگاه
 *   → callback از درگاه → verifyPayment → به‌روزرسانی Order → نمایش نتیجه
 *
 * verifyPayment باید Idempotent باشد: اگر callback چند بار بیاید،
 * سفارش نباید دوبار Paid شود (از idempotencyKey روی مدل Payment استفاده کنید).
 */

export interface PaymentRequestInput {
  orderId: string;
  amount: number; // به تومان یا کوچک‌ترین واحد پولی که در کل پروژه استفاده می‌شود
  description: string;
  callbackUrl: string;
  customerMobile?: string;
  customerEmail?: string;
}

export interface PaymentRequestResult {
  ok: boolean;
  redirectUrl?: string;
  authority?: string; // شناسه تراکنش سمت درگاه (Authority در زرین‌پال، id در سایر درگاه‌ها)
  errorMessage?: string;
}

export interface PaymentVerifyInput {
  authority: string;
  amount: number; // مبلغ سفارش سمت ما — همیشه با پاسخ درگاه مقایسه می‌شود
}

export interface PaymentVerifyResult {
  ok: boolean;
  refId?: string; // شماره پیگیری نهایی که به کاربر نمایش داده می‌شود
  rawResponse?: unknown;
  errorMessage?: string;
}

export interface PaymentProvider {
  readonly key: string; // e.g. "zarinpal" | "idpay" | "nextpay" | "mock"
  requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult>;
  verifyPayment(input: PaymentVerifyInput): Promise<PaymentVerifyResult>;
}
