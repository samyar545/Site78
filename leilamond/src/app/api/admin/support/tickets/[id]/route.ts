import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const schema = z.object({
  status: z.enum(["OPEN", "WAITING_FOR_SUPPORT", "WAITING_FOR_USER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.SUPPORT_REPLY);
    const body = schema.parse(await req.json());

    const ticket = await prisma.supportTicket.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ ticket });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
