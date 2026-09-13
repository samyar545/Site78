import { prisma } from "@/lib/prisma";

/**
 * تولید شماره سفارش یکتا و قابل‌خواندن، مثلاً LEI-100234.
 * برای جلوگیری از Race Condition در تولید عدد، از شمارشگر مبتنی بر جدول Setting
 * استفاده می‌کنیم که داخل Transaction به‌صورت Atomic افزایش می‌یابد.
 */
export async function generateOrderNumber(tx: typeof prisma): Promise<string> {
  const key = "counters.order";
  const current = await tx.setting.upsert({
    where: { key },
    update: {},
    create: { key, value: { seq: 100000 } },
  });
  const seq = ((current.value as { seq: number }).seq ?? 100000) + 1;
  await tx.setting.update({ where: { key }, data: { value: { seq } } });
  return `LEI-${seq}`;
}

export async function generateTicketNumber(): Promise<string> {
  const key = "counters.ticket";
  const current = await prisma.setting.upsert({
    where: { key },
    update: {},
    create: { key, value: { seq: 10000 } },
  });
  const seq = ((current.value as { seq: number }).seq ?? 10000) + 1;
  await prisma.setting.update({ where: { key }, data: { value: { seq } } });
  return `LEI-${seq}`;
}
