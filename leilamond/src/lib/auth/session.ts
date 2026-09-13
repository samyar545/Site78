import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "leilamond_session";
const SESSION_TTL_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, meta?: { userAgent?: string; ip?: string }) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta?.userAgent,
      ip: meta?.ip,
    },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }
  return session;
}

export async function revokeSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }
  cookies().delete(SESSION_COOKIE);
}

/** ابطال همه‌ی نشست‌های فعال یک کاربر (مثلاً هنگام تغییر رمز عبور) */
export async function revokeAllSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
