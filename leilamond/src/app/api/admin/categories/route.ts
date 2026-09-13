import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const schema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140),
  imageUrl: z.string().url().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { children: true },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.CATEGORIES_MANAGE);

    const body = schema.parse(await req.json());
    const category = await prisma.category.create({ data: body });

    await prisma.auditLog.create({
      data: { actorId: session!.user.id, action: "category.create", entityType: "Category", entityId: category.id, after: category as unknown as object },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر", details: err.flatten() }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
