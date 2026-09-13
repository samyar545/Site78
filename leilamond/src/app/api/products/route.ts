import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { publishedAt: "desc" },
  cheapest: { basePrice: "asc" },
  expensive: { basePrice: "desc" },
  popular: { ratingCount: "desc" },
  bestSelling: { salesCount: "desc" },
  mostDiscounted: { basePrice: "asc" }, // discount % محاسبه‌شده است؛ در نسخه بعد با فیلد مجازی بهینه می‌شود
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(48, Math.max(1, Number(sp.get("pageSize") ?? 24)));
  const sort = SORT_MAP[sp.get("sort") ?? "newest"] ?? SORT_MAP.newest;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(sp.get("q") ? { name: { contains: sp.get("q")!, mode: "insensitive" } } : {}),
    ...(sp.get("category") ? { category: { slug: sp.get("category")! } } : {}),
    ...(sp.get("brand") ? { brand: { slug: sp.get("brand")! } } : {}),
    ...(sp.get("minPrice") || sp.get("maxPrice")
      ? {
          basePrice: {
            gte: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
            lte: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
          },
        }
      : {}),
    ...(sp.get("color") ? { color: sp.get("color")! } : {}),
    ...(sp.get("minRating") ? { ratingAvg: { gte: Number(sp.get("minRating")) } } : {}),
    ...(sp.get("inStock") === "true" ? { stock: { gt: 0 } } : {}),
    ...(sp.get("discounted") === "true" ? { compareAtPrice: { not: null } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: sort,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
