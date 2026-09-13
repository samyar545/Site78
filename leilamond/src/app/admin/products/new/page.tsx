import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/adminGuard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  await requireAdminSession(PERMISSIONS.PRODUCTS_CREATE);

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text">محصول جدید</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
