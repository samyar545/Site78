import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const schema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140),
  logoUrl: z.string().url().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ brands });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.BRANDS_MANAGE);
    const body = schema.parse(await req.json());
    const brand = await prisma.brand.create({ data: body });

    await prisma.auditLog.create({
      data: { actorId: session!.user.id, action: "brand.create", entityType: "Brand", entityId: brand.id, after: brand as unknown as object },
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
