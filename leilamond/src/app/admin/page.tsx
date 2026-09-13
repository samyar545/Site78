import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/adminGuard";
import { StatCard } from "@/components/admin/StatCard";
import { formatToman } from "@/lib/utils/format";

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    todayRevenue,
    monthRevenue,
    totalOrders,
    newOrders,
    totalUsers,
    lowStockProducts,
    bestSellers,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { status: "PAID", createdAt: { gte: startOfToday } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: "PAID", createdAt: { gte: startOfMonth } }, _sum: { total: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.product.findMany({ where: { stock: { lte: 5 }, status: "ACTIVE" }, take: 5, orderBy: { stock: "asc" } }),
    prisma.product.findMany({ orderBy: { salesCount: "desc" }, take: 5 }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text">داشبورد</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="فروش امروز" value={formatToman(todayRevenue._sum.total ?? 0)} />
        <StatCard label="فروش این ماه" value={formatToman(monthRevenue._sum.total ?? 0)} />
        <StatCard label="کل سفارش‌ها" value={String(totalOrders)} hint={`${newOrders} سفارش جدید`} />
        <StatCard label="تعداد کاربران" value={String(totalUsers)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-text">محصولات کم‌موجود</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-text-muted">موردی برای نمایش نیست</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>{p.name}</span>
                  <span className="text-error">{p.stock} عدد باقی‌مانده</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-text">پرفروش‌ترین‌ها</h2>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-text-muted">موردی برای نمایش نیست</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {bestSellers.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>{p.name}</span>
                  <span className="text-text-muted">{p.salesCount} فروش</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
