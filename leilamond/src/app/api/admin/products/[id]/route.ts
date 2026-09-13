import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, PERMISSIONS, AuthorizationError } from "@/lib/auth/permissions";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  basePrice: z.number().int().positive().optional(),
  compareAtPrice: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  try {
    assertPermission(session, PERMISSIONS.PRODUCTS_READ);
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { images: true, variants: true, category: true, brand: true },
    });
    if (!product) return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}

// این نمونه‌ای از الگوی صحیح است: Authorization سمت سرور + Validation + Audit Log.
// هر Route حساس دیگر (دسته‌بندی، بنر، تبلیغ، سفارش و...) باید از همین الگو پیروی کند.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.PRODUCTS_UPDATE);

    const body = updateSchema.parse(await req.json());

    const before = await prisma.product.findUnique({ where: { id: params.id } });
    if (!before) {
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    const after = await prisma.product.update({
      where: { id: params.id },
      data: body,
    });

    await prisma.auditLog.create({
      data: {
        actorId: session!.user.id,
        action: "product.update",
        entityType: "Product",
        entityId: params.id,
        before: before as unknown as object,
        after: after as unknown as object,
        ip: req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return NextResponse.json({ product: after });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "ورودی نامعتبر است", details: err.flatten() }, { status: 400 });
    }
    // هرگز جزئیات داخلی خطا (Stack Trace) را برای کلاینت نمایش نده.
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}

// حذف واقعی محصول انجام نمی‌شود چون به OrderItem های قبلی متصل است (یکپارچگی تاریخچه سفارش‌ها).
// به‌جای آن، وضعیت INACTIVE می‌شود (Soft Delete).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    assertPermission(session, PERMISSIONS.PRODUCTS_DELETE);

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { status: "INACTIVE" },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session!.user.id,
        action: "product.softDelete",
        entityType: "Product",
        entityId: params.id,
      },
    });

    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
