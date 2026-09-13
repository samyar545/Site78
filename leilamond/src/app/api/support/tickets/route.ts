import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/requireAuth";
import { generateTicketNumber } from "@/lib/utils/counters";

export async function GET() {
  try {
    const user = await requireUser();
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });
    return NextResponse.json({ tickets });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}

const schema = z.object({
  subject: z.string().min(3).max(200),
  topic: z.string().max(100).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  message: z.string().min(1).max(5000),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const ticketNumber = await generateTicketNumber();

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: user.id,
        subject: body.subject,
        topic: body.topic,
        priority: body.priority,
        status: "OPEN",
        messages: {
          create: {
            authorId: user.id,
            body: body.message,
            attachments: body.attachments ?? [],
            isFromStaff: false,
          },
        },
      },
      include: { messages: true },
    });

    // اعلان برای صف پشتیبانی ادمین در فاز بعد اینجا وصل می‌شود
    // (NotificationProvider → همه‌ی کاربران با Permission support.read)

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
