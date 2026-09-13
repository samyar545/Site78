import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { formatToman, formatFaDate } from "@/lib/utils/format";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "در انتظار",
  AWAITING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل داده‌شده",
  CANCELLED: "لغوشده",
  FAILED: "ناموفق",
};

export default async function AccountPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10" dir="rtl">
        <h1 className="mb-1 text-xl font-bold text-text">
          سلام {session.user.firstName ?? ""} 👋
        </h1>
        <p className="mb-8 text-sm text-text-muted">به حساب کاربری خود در لیلاموند خوش آمدید.</p>

        <div className="mb-8 flex flex-wrap gap-3 text-sm">
          <Link href="/account/addresses" className="rounded-md border border-border px-4 py-2 hover:border-primary">
            آدرس‌های من
          </Link>
          <Link href="/account/support" className="rounded-md border border-border px-4 py-2 hover:border-primary">
            پشتیبانی آنلاین
          </Link>
        </div>

        <h2 className="mb-3 text-sm font-semibold text-text">سفارش‌های اخیر</h2>
        <div className="space-y-2">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm hover:border-primary"
            >
              <div>
                <div className="text-text" dir="ltr">{o.orderNumber}</div>
                <div className="text-xs text-text-muted">{formatFaDate(o.createdAt)}</div>
              </div>
              <div className="text-left">
                <div className="text-text">{formatToman(o.total)}</div>
                <div className="text-xs text-text-muted">{STATUS_LABEL[o.status]}</div>
              </div>
            </Link>
          ))}
          {orders.length === 0 && <p className="text-text-muted">هنوز سفارشی ثبت نکرده‌اید.</p>}
        </div>
      </main>
      <Footer />
    </>
  );
}
