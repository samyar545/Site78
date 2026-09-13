import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const loginSchema = z.object({
  identifier: z.string().min(3), // ایمیل یا شماره موبایل
  password: z.string().min(1),
});

/**
 * Rate limiting ساده و در-حافظه — فقط برای Development مناسب است.
 * در Production باید با Redis (یا میان‌افزار Rate Limit سطح Nginx/Cloudflare)
 * جایگزین شود چون این پیاده‌سازی بین چند Instance/Process به اشتراک گذاشته نمی‌شود.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  const now = Date.now();
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const rateLimitKey = `${ip}:${body.identifier}`;

    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: body.identifier }, { phone: body.identifier }] },
    });

    // پیام خطای یکسان برای «کاربر یافت نشد» و «رمز اشتباه» تا از User Enumeration جلوگیری شود
    const invalidCredentials = () =>
      NextResponse.json({ error: "ایمیل/شماره یا رمز عبور اشتباه است" }, { status: 401 });

    if (!user || !user.isActive) return invalidCredentials();

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return invalidCredentials();

    await createSession(user.id, {
      userAgent: req.headers.get("user-agent") ?? undefined,
      ip,
    });

    attempts.delete(rateLimitKey);

    return NextResponse.json({ user: { id: user.id, email: user.email, phone: user.phone } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
