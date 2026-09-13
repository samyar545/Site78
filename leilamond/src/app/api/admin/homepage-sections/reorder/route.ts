import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const schema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.HOMEPAGE_MANAGE);

    const { orderedIds } = schema.parse(await req.json());

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.homepageSection.update({ where: { id }, data: { sortOrder: index } })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
