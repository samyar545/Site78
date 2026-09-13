import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/adminGuard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { Badge } from "@/components/admin/Badge";
import { formatToman } from "@/lib/utils/format";

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "warning" | "muted" }> = {
  ACTIVE: { label: "فعال", tone: "success" },
  DRAFT: { label: "پیش‌نویس", tone: "warning" },
  INACTIVE: { label: "غیرفعال", tone: "muted" },
};

export default async function AdminProductsPage() {
  await requireAdminSession(PERMISSIONS.PRODUCTS_READ);

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { category: true, brand: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">محصولات</h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + محصول جدید
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-border text-text-muted">
            <tr>
              <th className="p-3 font-medium">نام</th>
              <th className="p-3 font-medium">دسته‌بندی</th>
              <th className="p-3 font-medium">برند</th>
              <th className="p-3 font-medium">قیمت</th>
              <th className="p-3 font-medium">موجودی</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const status = STATUS_LABEL[p.status];
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3 text-text-muted">{p.category.name}</td>
                  <td className="p-3 text-text-muted">{p.brand?.name ?? "—"}</td>
                  <td className="p-3">{formatToman(p.basePrice)}</td>
                  <td className={p.stock <= 5 ? "p-3 text-error" : "p-3"}>{p.stock}</td>
                  <td className="p-3">
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="text-primary hover:underline">
                      ویرایش
                    </Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-text-muted">
                  هنوز محصولی ثبت نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
