import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/requireAuth";

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: {
        include: {
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          variant: true,
        },
      },
    },
  });
}

function computeTotals(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  let subtotal = 0;
  const issues: string[] = [];

  for (const item of cart.items) {
    const unitPrice = item.variant?.price ?? item.product.basePrice;
    const availableStock = item.variant?.stock ?? item.product.stock;
    if (availableStock < item.quantity) {
      issues.push(`موجودی «${item.product.name}» کافی نیست`);
    }
    subtotal += unitPrice * item.quantity;
  }

  return { subtotal, issues };
}

export async function GET() {
  try {
    const user = await requireUser();
    const cart = await getOrCreateCart(user.id);
    const totals = computeTotals(cart);
    return NextResponse.json({ cart, ...totals });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(50).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = addSchema.parse(await req.json());

    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json({ error: "محصول موجود نیست" }, { status: 404 });
    }

    const stock = body.variantId
      ? (await prisma.productVariant.findUnique({ where: { id: body.variantId } }))?.stock ?? 0
      : product.stock;
    if (stock < body.quantity) {
      return NextResponse.json({ error: "موجودی کافی نیست" }, { status: 409 });
    }

    const cart = await prisma.cart.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });

    const item = await prisma.cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId: body.productId,
          variantId: body.variantId ?? "",
        },
      },
      update: { quantity: { increment: body.quantity } },
      create: {
        cartId: cart.id,
        productId: body.productId,
        variantId: body.variantId,
        quantity: body.quantity,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
