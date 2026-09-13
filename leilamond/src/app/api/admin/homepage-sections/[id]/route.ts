import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const schema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  productLimit: z.number().int().min(1).max(40).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
  visibleFrom: z.string().datetime().optional().nullable(),
  visibleUntil: z.string().datetime().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.HOMEPAGE_MANAGE);

    const body = schema.parse(await req.json());
    const section = await prisma.homepageSection.update({
      where: { id: params.id },
      data: {
        ...body,
        visibleFrom: body.visibleFrom ? new Date(body.visibleFrom) : body.visibleFrom,
        visibleUntil: body.visibleUntil ? new Date(body.visibleUntil) : body.visibleUntil,
      },
    });

    return NextResponse.json({ section });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.HOMEPAGE_MANAGE);
    await prisma.homepageSection.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
