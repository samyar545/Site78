import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
}).refine((d) => d.email || d.phone, { message: "ایمیل یا شماره موبایل الزامی است" });

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          body.email ? { email: body.email } : undefined,
          body.phone ? { phone: body.phone } : undefined,
        ].filter(Boolean) as object[],
      },
    });
    if (existing) {
      return NextResponse.json({ error: "این ایمیل یا شماره قبلاً ثبت شده است" }, { status: 409 });
    }

    const customerRole = await prisma.role.findUnique({ where: { key: "CUSTOMER" } });
    if (!customerRole) {
      return NextResponse.json({ error: "خطای پیکربندی سیستم — نقش مشتری یافت نشد" }, { status: 500 });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        phone: body.phone,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        roleId: customerRole.id,
        // در پروژه واقعی: emailVerifiedAt خالی می‌ماند و لینک/کد تایید ارسال می‌شود
      },
    });

    await createSession(user.id, { userAgent: req.headers.get("user-agent") ?? undefined });

    return NextResponse.json({ user: { id: user.id, email: user.email, phone: user.phone } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "ورودی نامعتبر", details: err.flatten() }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
