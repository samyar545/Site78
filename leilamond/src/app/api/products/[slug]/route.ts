import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
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

  if (!product || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
  }

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, status: "ACTIVE" },
    take: 8,
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });

  // ثبت «اخیراً مشاهده‌شده» برای کاربر لاگین‌شده (silent — خطای اینجا نباید کل صفحه را بشکند)
  try {
    const session = await getCurrentSession();
    if (session) {
      await prisma.recentlyViewed.upsert({
        where: { userId_productId: { userId: session.user.id, productId: product.id } },
        update: { viewedAt: new Date() },
        create: { userId: session.user.id, productId: product.id },
      });
    }
  } catch {
    // silently ignore — recently-viewed tracking is non-critical
  }

  return NextResponse.json({ product, related });
}
