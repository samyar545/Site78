import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";

async function assertAccess(ticketId: string) {
  const session = await getCurrentSession();
  if (!session) return { error: "لطفاً وارد شوید" as const, status: 401 as const, session: null };

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "تیکت یافت نشد" as const, status: 404 as const, session };

  const isOwner = ticket.userId === session.user.id;
  const isStaff = hasPermission(session, PERMISSIONS.SUPPORT_READ);
  if (!isOwner && !isStaff) return { error: "دسترسی ندارید" as const, status: 403 as const, session };

  return { ticket, session, isStaff };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const access = await assertAccess(params.id);
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: params.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json({ messages });
}

const schema = z.object({
  body: z.string().min(1).max(5000),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await assertAccess(params.id);
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

  try {
    const body = schema.parse(await req.json());
    const isFromStaff = !!access.isStaff && access.ticket!.userId !== access.session!.user.id;

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: params.id,
        authorId: access.session!.user.id,
        body: body.body,
        attachments: body.attachments ?? [],
        isFromStaff,
      },
    });

    await prisma.supportTicket.update({
      where: { id: params.id },
      data: { status: isFromStaff ? "WAITING_FOR_USER" : "WAITING_FOR_SUPPORT" },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
