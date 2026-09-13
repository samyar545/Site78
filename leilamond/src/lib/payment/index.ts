import type { PaymentProvider } from "./PaymentProvider";
import { ZarinPalProvider } from "./ZarinPalProvider";
import { MockPaymentProvider } from "./MockPaymentProvider";

/**
 * انتخاب Provider فعال بر اساس تنظیمات (Setting: payment.provider در دیتابیس
 * یا PAYMENT_PROVIDER در env). این تابع تنها نقطه‌ای است که UI/API باید
 * برای گرفتن Provider پرداخت صدا بزند — هیچ‌جای دیگری مستقیماً
 * ZarinPalProvider یا MockPaymentProvider را import نکند.
 */
export function getPaymentProvider(providerKey?: string): PaymentProvider {
  const key = providerKey ?? process.env.PAYMENT_PROVIDER ?? "mock";

  switch (key) {
    case "zarinpal":
      return new ZarinPalProvider();
    // case "idpay": return new IdPayProvider();
    // case "nextpay": return new NextPayProvider();
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}

export * from "./PaymentProvider";
