import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
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

export default async function OrderPage({ params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) notFound();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } }, address: true },
  });

  if (!order) notFound();
  const isOwner = order.userId === session.user.id;
  if (!isOwner && !hasPermission(session, PERMISSIONS.ORDERS_READ)) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10" dir="rtl">
        {order.status === "PAID" ? (
          <div className="mb-6 rounded-lg bg-success/10 p-4 text-center text-success">
            پرداخت شما با موفقیت انجام شد. سفارش شما ثبت شد.
          </div>
        ) : (
          <div className="mb-6 rounded-lg bg-warning/10 p-4 text-center text-warning">
            وضعیت این سفارش: {STATUS_LABEL[order.status]}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-bold text-text" dir="ltr">
            {order.orderNumber}
          </h1>
          <span className="text-sm text-text-muted">{formatFaDate(order.createdAt)}</span>
        </div>

        <div className="mb-6 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.product.images[0].url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1 text-sm">
                <div className="text-text">{item.productName}</div>
                <div className="text-text-muted">{item.quantity} عدد</div>
              </div>
              <div className="text-sm font-medium text-text">{formatToman(item.lineTotal)}</div>
            </div>
          ))}
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-surface p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">جمع کل</span>
            <span>{formatToman(order.subtotal)}</span>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-success">
              <span>تخفیف</span>
              <span>-{formatToman(order.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-muted">هزینه ارسال</span>
            <span>{order.shippingCost === 0 ? "رایگان" : formatToman(order.shippingCost)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold text-text">
            <span>مبلغ نهایی</span>
            <span>{formatToman(order.total)}</span>
          </div>
        </div>

        {order.address && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm">
            <div className="mb-1 font-medium text-text">آدرس تحویل</div>
            <div className="text-text-muted">
              {order.address.fullName} — {order.address.phone}
              <br />
              {order.address.province}، {order.address.city}، {order.address.addressLine}
            </div>
          </div>
        )}

        <Link href="/products" className="mt-8 block text-center text-sm text-primary hover:underline">
          ادامه خرید
        </Link>
      </main>
      <Footer />
    </>
  );
}
