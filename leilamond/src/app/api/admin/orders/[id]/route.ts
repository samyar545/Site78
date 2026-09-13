import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const schema = z.object({
  status: z.enum(["PENDING", "AWAITING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"]),
});

// توجه: این Route فقط برای تغییر وضعیت‌های عملیاتی (Processing/Shipped/Delivered/Cancelled) است.
// انتقال به وضعیت PAID هرگز نباید از این مسیر یا از سمت کلاینت اتفاق بیفتد —
// آن وضعیت فقط باید نتیجهٔ Verify واقعی در src/app/api/payment/callback باشد.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.ORDERS_UPDATE);

    const body = schema.parse(await req.json());
    if (body.status === "PAID") {
      return NextResponse.json(
        { error: "وضعیت PAID فقط توسط سیستم تایید پرداخت قابل تنظیم است" },
        { status: 400 }
      );
    }

    const before = await prisma.order.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });

    const order = await prisma.order.update({ where: { id: params.id }, data: { status: body.status } });

    await prisma.auditLog.create({
      data: {
        actorId: session!.user.id,
        action: "order.statusUpdate",
        entityType: "Order",
        entityId: params.id,
        before: { status: before.status },
        after: { status: order.status },
      },
    });

    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
