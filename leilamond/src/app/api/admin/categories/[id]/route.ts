import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  imageUrl: z.string().url().optional(),
  icon: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.CATEGORIES_MANAGE);
    const body = schema.parse(await req.json());

    const category = await prisma.category.update({ where: { id: params.id }, data: body });

    await prisma.auditLog.create({
      data: { actorId: session!.user.id, action: "category.update", entityType: "Category", entityId: params.id, after: category as unknown as object },
    });

    return NextResponse.json({ category });
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
    assertPermission(session, PERMISSIONS.CATEGORIES_MANAGE);

    const productCount = await prisma.product.count({ where: { categoryId: params.id } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: "این دسته‌بندی دارای محصول است و نمی‌توان آن را حذف کرد. ابتدا آن را غیرفعال کنید." },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id: params.id } });
    await prisma.auditLog.create({
      data: { actorId: session!.user.id, action: "category.delete", entityType: "Category", entityId: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
