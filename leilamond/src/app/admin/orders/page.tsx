import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/adminGuard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { formatToman, formatFaDate } from "@/lib/utils/format";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

export default async function AdminOrdersPage() {
  await requireAdminSession(PERMISSIONS.ORDERS_READ);

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { firstName: true, lastName: true, phone: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text">سفارش‌ها</h1>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-border text-text-muted">
            <tr>
              <th className="p-3 font-medium">شماره سفارش</th>
              <th className="p-3 font-medium">مشتری</th>
              <th className="p-3 font-medium">مبلغ</th>
              <th className="p-3 font-medium">تاریخ</th>
              <th className="p-3 font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="p-3" dir="ltr">
                  {o.orderNumber}
                </td>
                <td className="p-3">
                  {o.user.firstName} {o.user.lastName}
                </td>
                <td className="p-3">{formatToman(o.total)}</td>
                <td className="p-3 text-text-muted">{formatFaDate(o.createdAt)}</td>
                <td className="p-3">
                  <OrderStatusSelect orderId={o.id} status={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-text-muted">
                  هنوز سفارشی ثبت نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
