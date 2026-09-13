import Link from "next/link";
import { formatToman } from "@/lib/utils/format";

type CardProduct = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice: number | null;
  ratingAvg: number;
  images: { url: string }[];
};

export function ProductCard({ product }: { product: CardProduct }) {
  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.basePrice / product.compareAtPrice!) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-border bg-background transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-muted">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0].url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">بدون تصویر</div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 right-2 rounded-full bg-primary px-2 py-1 text-xs text-white">
            ٪{discountPercent}−
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="mb-1 line-clamp-1 text-sm text-text">{product.name}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-text">{formatToman(product.basePrice)}</span>
          {hasDiscount && (
            <span className="text-xs text-text-muted line-through">{formatToman(product.compareAtPrice!)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
