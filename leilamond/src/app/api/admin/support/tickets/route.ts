import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";
import type { Prisma, TicketStatus, TicketPriority } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.SUPPORT_READ);

    const sp = req.nextUrl.searchParams;
    const where: Prisma.SupportTicketWhereInput = {
      ...(sp.get("status") ? { status: sp.get("status") as TicketStatus } : {}),
      ...(sp.get("priority") ? { priority: sp.get("priority") as TicketPriority } : {}),
      ...(sp.get("userId") ? { userId: sp.get("userId")! } : {}),
      ...(sp.get("q")
        ? { OR: [{ subject: { contains: sp.get("q")!, mode: "insensitive" } }, { ticketNumber: { contains: sp.get("q")! } }] }
        : {}),
    };

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        assignee: { select: { firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
