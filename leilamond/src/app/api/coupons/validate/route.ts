import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/requireAuth";

const schema = z.object({ code: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const { code } = schema.parse(await req.json());

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    const now = new Date();

    if (
      !coupon ||
      !coupon.isActive ||
      (coupon.startAt && coupon.startAt > now) ||
      (coupon.endAt && coupon.endAt < now) ||
      (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
    ) {
      return NextResponse.json({ valid: false, error: "کد تخفیف معتبر نیست یا منقضی شده است" }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        percent: coupon.percent,
        fixedAmount: coupon.fixedAmount,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount,
      },
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
