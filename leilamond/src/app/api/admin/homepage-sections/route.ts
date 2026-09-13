import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

export async function GET() {
  const sections = await prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ sections });
}

const schema = z.object({
  type: z.enum([
    "HERO_BANNER",
    "PRODUCT_GRID",
    "PRODUCT_CAROUSEL",
    "CATEGORY_GRID",
    "DISCOUNT_PRODUCTS",
    "NEW_PRODUCTS",
    "BEST_SELLERS",
    "ADVERTISEMENT",
    "CUSTOM_BANNER",
    "TEXT_SECTION",
    "BRAND_SECTION",
  ]),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  productLimit: z.number().int().min(1).max(40).optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.HOMEPAGE_MANAGE);

    const body = schema.parse(await req.json());
    const maxOrder = await prisma.homepageSection.aggregate({ _max: { sortOrder: true } });

    const section = await prisma.homepageSection.create({
      data: { ...body, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1, status: "DRAFT", isActive: false },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
