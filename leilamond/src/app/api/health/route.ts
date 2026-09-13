import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const health: Record<string, "ok" | "error"> = { app: "ok" };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = "ok";
  } catch {
    health.database = "error";
  }

  const overall = Object.values(health).every((s) => s === "ok") ? 200 : 503;
  return NextResponse.json(health, { status: overall });
}
