import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.BRANDS_MANAGE);
    const body = schema.parse(await req.json());
    const brand = await prisma.brand.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ brand });
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
    assertPermission(session, PERMISSIONS.BRANDS_MANAGE);

    const productCount = await prisma.product.count({ where: { brandId: params.id } });
    if (productCount > 0) {
      return NextResponse.json({ error: "این برند دارای محصول است. ابتدا آن را غیرفعال کنید." }, { status: 409 });
    }

    await prisma.brand.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
