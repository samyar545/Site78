import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(220),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  basePrice: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().optional(),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().min(1),
  brandId: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("DRAFT"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.PRODUCTS_READ);

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const pageSize = Math.min(100, Number(sp.get("pageSize") ?? 25));

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true, brand: true, images: { where: { isPrimary: true }, take: 1 } },
      }),
      prisma.product.count(),
    ]);

    return NextResponse.json({ items, pagination: { page, pageSize, total } });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.PRODUCTS_CREATE);

    const body = createSchema.parse(await req.json());

    const product = await prisma.product.create({ data: body });

    await prisma.auditLog.create({
      data: {
        actorId: session!.user.id,
        action: "product.create",
        entityType: "Product",
        entityId: product.id,
        after: product as unknown as object,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر", details: err.flatten() }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
