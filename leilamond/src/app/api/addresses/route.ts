import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/requireAuth";

export async function GET() {
  try {
    const user = await requireUser();
    const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });
    return NextResponse.json({ addresses });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}

const schema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().min(10).max(15),
  province: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(5).max(12),
  addressLine: z.string().min(5).max(400),
  isDefault: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    if (body.isDefault) {
      await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({ data: { ...body, userId: user.id } });
    return NextResponse.json({ address }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "خطای غیرمنتظره رخ داد" }, { status: 500 });
  }
}
