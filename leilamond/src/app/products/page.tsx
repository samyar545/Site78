import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { SortSelect } from "@/components/storefront/SortSelect";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { publishedAt: "desc" },
  cheapest: { basePrice: "asc" },
  expensive: { basePrice: "desc" },
  popular: { ratingCount: "desc" },
  bestSelling: { salesCount: "desc" },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const sort = SORT_MAP[searchParams.sort ?? "newest"] ?? SORT_MAP.newest;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(searchParams.q ? { name: { contains: searchParams.q, mode: "insensitive" } } : {}),
    ...(searchParams.category ? { category: { slug: searchParams.category } } : {}),
    ...(searchParams.brand ? { brand: { slug: searchParams.brand } } : {}),
    ...(searchParams.discounted === "true" ? { compareAtPrice: { not: null } } : {}),
  };

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: sort,
      take: 40,
      include: { images: { where: { isPrimary: true }, take: 1 } },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-text">
            {searchParams.q ? `نتایج جستجوی «${searchParams.q}»` : "همه محصولات"}
          </h1>
          <SortSelect />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
          <aside className="space-y-6 text-sm">
            <div>
              <div className="mb-2 font-medium text-text">دسته‌بندی‌ها</div>
              <ul className="space-y-1 text-text-muted">
                {categories.map((c) => (
                  <li key={c.id}>
                    <a href={`/products?category=${c.slug}`} className="hover:text-primary">
                      {c.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 font-medium text-text">برندها</div>
              <ul className="space-y-1 text-text-muted">
                {brands.map((b) => (
                  <li key={b.id}>
                    <a href={`/products?brand=${b.slug}`} className="hover:text-primary">
                      {b.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {products.length === 0 && (
              <p className="col-span-full py-12 text-center text-text-muted">محصولی یافت نشد</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
