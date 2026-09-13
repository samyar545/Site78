import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/adminGuard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  await requireAdminSession(PERMISSIONS.PRODUCTS_UPDATE);

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text">ویرایش محصول</h1>
      <ProductForm
        categories={categories}
        brands={brands}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription ?? undefined,
          basePrice: product.basePrice,
          compareAtPrice: product.compareAtPrice,
          stock: product.stock,
          categoryId: product.categoryId,
          brandId: product.brandId ?? undefined,
          status: product.status,
          isFeatured: product.isFeatured,
        }}
      />
    </div>
  );
}
