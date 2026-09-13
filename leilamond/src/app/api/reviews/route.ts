import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/requireAuth";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    // Verified Purchase: بررسی می‌کند کاربر واقعاً این محصول را (در سفارش Paid/Delivered) خریده باشد
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId: body.productId,
        order: { userId: user.id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      },
    });

    const review = await prisma.review.create({
      data: {
        productId: body.productId,
        userId: user.id,
        rating: body.rating,
        comment: body.comment,
        images: body.images ?? [],
        isVerifiedPurchase: !!purchased,
        status: "PENDING", // نیاز به تایید ادمین قبل از نمایش عمومی (بند 25 / 100)
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
