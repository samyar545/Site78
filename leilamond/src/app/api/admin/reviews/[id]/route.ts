import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]).optional(),
  adminReply: z.string().max(2000).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.REVIEWS_MODERATE);
    const body = schema.parse(await req.json());

    const review = await prisma.review.update({ where: { id: params.id }, data: body });

    // اگر تایید شد، میانگین امتیاز و تعداد نظرات محصول را بازمحاسبه کن
    if (body.status === "APPROVED") {
      const agg = await prisma.review.aggregate({
        where: { productId: review.productId, status: "APPROVED" },
        _avg: { rating: true },
        _count: true,
      });
      await prisma.product.update({
        where: { id: review.productId },
        data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
      });
    }

    return NextResponse.json({ review });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
