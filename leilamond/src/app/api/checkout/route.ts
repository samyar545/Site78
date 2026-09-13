import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/requireAuth";
import { getEffectiveUnitPrice } from "@/lib/pricing/effectivePrice";
import { getShippingProvider } from "@/lib/shipping/ShippingProvider";
import { getPaymentProvider } from "@/lib/payment";
import { generateOrderNumber } from "@/lib/utils/counters";

const schema = z.object({
  addressId: z.string().min(1),
  couponCode: z.string().optional(),
  shippingMethodKey: z.string().default("standard"),
  customerNote: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const address = await prisma.address.findFirst({ where: { id: body.addressId, userId: user.id } });
    if (!address) return NextResponse.json({ error: "آدرس معتبر نیست" }, { status: 400 });

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "سبد خرید خالی است" }, { status: 400 });
    }

    // مبلغ همیشه سمت سرور از دیتابیس محاسبه می‌شود — هرگز از ورودی کاربر گرفته نمی‌شود.
    let subtotal = 0;
    const lineItems: {
      productId: string;
      variantId?: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }[] = [];

    for (const item of cart.items) {
      const availableStock = item.variant?.stock ?? item.product.stock;
      if (item.product.status !== "ACTIVE" || availableStock < item.quantity) {
        return NextResponse.json(
          { error: `موجودی «${item.product.name}» کافی نیست` },
          { status: 409 }
        );
      }
      const basePrice = item.variant?.price ?? item.product.basePrice;
      const unitPrice = await getEffectiveUnitPrice(item.productId, basePrice);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      lineItems.push({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        productName: item.product.name,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    // کوپن
    let discountTotal = 0;
    let couponId: string | undefined;
    if (body.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: body.couponCode.toUpperCase() } });
      const now = new Date();
      const validCoupon =
        coupon &&
        coupon.isActive &&
        (!coupon.startAt || coupon.startAt <= now) &&
        (!coupon.endAt || coupon.endAt >= now) &&
        (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit!) &&
        (!coupon.minPurchase || subtotal >= coupon.minPurchase);

      if (!validCoupon) {
        return NextResponse.json({ error: "کد تخفیف معتبر نیست" }, { status: 400 });
      }
      couponId = coupon!.id;
      if (coupon!.type === "PERCENT" && coupon!.percent) {
        discountTotal = Math.round(subtotal * (coupon!.percent / 100));
        if (coupon!.maxDiscount) discountTotal = Math.min(discountTotal, coupon!.maxDiscount);
      } else if (coupon!.type === "FIXED" && coupon!.fixedAmount) {
        discountTotal = Math.min(coupon!.fixedAmount, subtotal);
      }
    }

    // هزینه ارسال
    const shippingProvider = getShippingProvider();
    const rates = await shippingProvider.getRates({
      city: address.city,
      province: address.province,
      weightGrams: 0, // TODO: مجموع وزن محصولات سبد را در فاز بعد محاسبه کنید
      orderTotal: subtotal,
    });
    const chosenRate = rates.find((r) => r.methodKey === body.shippingMethodKey) ?? rates[0];
    const shippingCost = chosenRate?.cost ?? 0;

    const total = subtotal - discountTotal + shippingCost;

    // تراکنش اتمیک: ایجاد سفارش + آیتم‌ها + کاهش موجودی + خالی‌کردن سبد
    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(tx as typeof prisma);

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          addressId: address.id,
          status: "AWAITING_PAYMENT",
          subtotal,
          discountTotal,
          shippingCost,
          total,
          couponId,
          customerNote: body.customerNote,
          items: { create: lineItems },
        },
      });

      for (const item of lineItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usageCount: { increment: 1 } } });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    // ایجاد پرداخت (سمت سرور، Provider-based)
    const provider = getPaymentProvider();
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/callback`;
    const paymentResult = await provider.requestPayment({
      orderId: order.id,
      amount: total,
      description: `پرداخت سفارش ${order.orderNumber} — لیلاموند`,
      callbackUrl,
      customerMobile: user.phone ?? undefined,
      customerEmail: user.email ?? undefined,
    });

    if (!paymentResult.ok) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return NextResponse.json({ error: paymentResult.errorMessage ?? "خطا در اتصال به درگاه پرداخت" }, { status: 502 });
    }

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: provider.key,
        amount: total,
        status: "PENDING_CALLBACK",
        authority: paymentResult.authority,
        idempotencyKey: randomUUID(),
      },
    });

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, redirectUrl: paymentResult.redirectUrl });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر", details: err.flatten() }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
