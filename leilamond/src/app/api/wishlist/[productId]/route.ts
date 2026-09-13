import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/requireAuth";

export async function DELETE(_req: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const user = await requireUser();
    await prisma.favorite.deleteMany({ where: { userId: user.id, productId: params.productId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
