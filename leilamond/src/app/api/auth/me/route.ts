import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  const { id, email, phone, firstName, lastName, avatarUrl, role } = session.user;
  return NextResponse.json({
    user: { id, email, phone, firstName, lastName, avatarUrl, role: role.key },
  });
}
