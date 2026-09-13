import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/adminGuard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  await requireAdminSession(PERMISSIONS.CATEGORIES_MANAGE);

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text">دسته‌بندی‌ها</h1>
      <CategoryManager initial={categories} />
    </div>
  );
}
