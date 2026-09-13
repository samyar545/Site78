import Link from "next/link";

export default function CheckoutFailedPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center" dir="rtl">
      <div className="mb-4 text-4xl text-error">✕</div>
      <h1 className="mb-2 text-xl font-bold text-text">پرداخت انجام نشد</h1>
      <p className="mb-6 text-sm text-text-muted">
        پرداخت شما با مشکل مواجه شد یا لغو شد. مبلغی از حساب شما کسر نشده است. می‌توانید دوباره تلاش کنید.
      </p>
      <Link href="/cart" className="rounded-md bg-primary px-5 py-2 text-sm text-white hover:opacity-90">
        بازگشت به سبد خرید
      </Link>
    </div>
  );
}
