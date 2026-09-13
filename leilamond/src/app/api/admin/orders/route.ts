import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";
import type { Prisma, OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.ORDERS_READ);

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const pageSize = Math.min(100, Number(sp.get("pageSize") ?? 25));
    const status = sp.get("status") as OrderStatus | null;

    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(sp.get("orderNumber") ? { orderNumber: { contains: sp.get("orderNumber")! } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ items, pagination: { page, pageSize, total } });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
