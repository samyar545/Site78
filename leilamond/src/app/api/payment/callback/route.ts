import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payment";

/**
 * Callback درگاه پرداخت.
 * قوانین امنیتی حیاتی (بندهای 117-119):
 *  - مبلغ و وضعیت Paid هرگز از Client پذیرفته نمی‌شود؛ همه‌چیز از دیتابیس و Verify واقعی می‌آید.
 *  - عملیات با idempotencyKey محافظت می‌شود تا Callback تکراری باعث پرداخت دوبار نشود.
 *  - بروزرسانی سفارش داخل یک Transaction انجام می‌شود.
 */
export async function GET(req: NextRequest) {
  const authority = req.nextUrl.searchParams.get("Authority");
  const status = req.nextUrl.searchParams.get("Status");

  if (!authority) {
    return NextResponse.redirect(new URL("/checkout/failed", req.url));
  }

  const payment = await prisma.payment.findUnique({
    where: { authority },
    include: { order: true },
  });

  if (!payment) {
    return NextResponse.redirect(new URL("/checkout/failed", req.url));
  }

  // Idempotency: اگر قبلاً Verify شده، دوباره پرداخت را اعمال نکن.
  if (payment.status === "VERIFIED") {
    return NextResponse.redirect(new URL(`/orders/${payment.orderId}`, req.url));
  }

  if (status !== "OK") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.redirect(new URL("/checkout/failed", req.url));
  }

  const provider = getPaymentProvider(payment.provider);
  const result = await provider.verifyPayment({
    authority,
    amount: payment.amount, // مبلغ همیشه از دیتابیس خوانده می‌شود، نه از Query String
  });

  if (!result.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", gatewayResponse: result.rawResponse as object },
    });
    return NextResponse.redirect(new URL("/checkout/failed", req.url));
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "VERIFIED",
        refId: result.refId,
        verifiedAt: new Date(),
        gatewayResponse: result.rawResponse as object,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "PAID" },
    }),
  ]);

  return NextResponse.redirect(new URL(`/orders/${payment.orderId}`, req.url));
}
