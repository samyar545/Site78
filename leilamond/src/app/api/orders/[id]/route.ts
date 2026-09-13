import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
      payments: { orderBy: { createdAt: "desc" } },
      address: true,
      coupon: true,
    },
  });

  if (!order) return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });

  const isOwner = order.userId === session.user.id;
  const isStaff = hasPermission(session, PERMISSIONS.ORDERS_READ);
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  }

  return NextResponse.json({ order });
}
