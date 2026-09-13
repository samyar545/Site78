import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/requireAuth";

export async function GET() {
  try {
    const user = await requireUser();
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ favorites });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}

const schema = z.object({ productId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { productId } = schema.parse(await req.json());

    const favorite = await prisma.favorite.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      update: {},
      create: { userId: user.id, productId },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
