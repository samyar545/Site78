import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { AddToCartBox } from "@/components/storefront/AddToCartBox";
import { formatToman, formatFaDate } from "@/lib/utils/format";
import { getEffectiveUnitPrice } from "@/lib/pricing/effectivePrice";

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true } },
      brand: true,
      category: true,
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!product || product.status !== "ACTIVE") notFound();

  const [related, effectivePrice] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, status: "ACTIVE" },
      take: 4,
      include: { images: { where: { isPrimary: true }, take: 1 } },
    }),
    getEffectiveUnitPrice(product.id, product.basePrice),
  ]);

  const hasDiscount = effectivePrice < product.basePrice;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-text-muted">بدون تصویر</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.images.slice(1).map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} src={img.url} alt="" className="aspect-square rounded-md object-cover" />
                ))}
              </div>
            )}
          </div>

          <div>
            {product.brand && <div className="mb-1 text-sm text-text-muted">{product.brand.name}</div>}
            <h1 className="mb-2 text-2xl font-bold text-text">{product.name}</h1>

            {product.ratingCount > 0 && (
              <div className="mb-4 text-sm text-text-muted">
                ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount} نظر)
              </div>
            )}

            <div className="mb-6 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-text">{formatToman(effectivePrice)}</span>
              {hasDiscount && (
                <span className="text-sm text-text-muted line-through">{formatToman(product.basePrice)}</span>
              )}
            </div>

            {product.shortDescription && <p className="mb-6 text-sm text-text-muted">{product.shortDescription}</p>}

            <AddToCartBox
              productId={product.id}
              stock={product.stock}
              variants={product.variants.map((v) => ({ id: v.id, name: v.name, stock: v.stock }))}
            />

            {product.description && (
              <div className="mt-8">
                <h2 className="mb-2 text-sm font-semibold text-text">توضیحات محصول</h2>
                <p className="whitespace-pre-line text-sm leading-7 text-text-muted">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        <section className="mt-14">
          <h2 className="mb-4 text-lg font-bold text-text">نظرات کاربران</h2>
          {product.reviews.length === 0 ? (
            <p className="text-sm text-text-muted">هنوز نظری برای این محصول ثبت نشده است.</p>
          ) : (
            <div className="space-y-4">
              {product.reviews.map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm">
                    <span className="font-medium text-text">
                      {r.user.firstName} {r.user.lastName}
                    </span>
                    <span className="text-text-muted">★ {r.rating}</span>
                    {r.isVerifiedPurchase && <span className="text-xs text-success">خرید تأییدشده</span>}
                    <span className="text-xs text-text-muted">{formatFaDate(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-text-muted">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 text-lg font-bold text-text">محصولات مشابه</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
