import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/requireAuth";

const updateSchema = z.object({ quantity: z.number().int().min(1).max(50) });

async function assertOwnership(itemId: string, userId: string) {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== userId) {
    throw new NotFoundOrForbiddenError();
  }
  return item;
}

class NotFoundOrForbiddenError extends Error {
  status = 404;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = updateSchema.parse(await req.json());
    await assertOwnership(params.id, user.id);

    const item = await prisma.cartItem.update({ where: { id: params.id }, data: { quantity: body.quantity } });
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof NotFoundOrForbiddenError) {
      return NextResponse.json({ error: "یافت نشد" }, { status: err.status });
    }
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await assertOwnership(params.id, user.id);
    await prisma.cartItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof NotFoundOrForbiddenError) {
      return NextResponse.json({ error: "یافت نشد" }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
