import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/requireAuth";

const schema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  phone: z.string().min(10).max(15).optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  addressLine: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await prisma.address.findFirst({ where: { id: params.id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "آدرس یافت نشد" }, { status: 404 });

    const body = schema.parse(await req.json());
    if (body.isDefault) {
      await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const address = await prisma.address.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ address });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await prisma.address.findFirst({ where: { id: params.id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "آدرس یافت نشد" }, { status: 404 });

    await prisma.address.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
