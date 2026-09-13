import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/adminGuard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { Badge } from "@/components/admin/Badge";
import { formatFaDate } from "@/lib/utils/format";

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "warning" | "muted" | "error" }> = {
  OPEN: { label: "باز", tone: "warning" },
  WAITING_FOR_SUPPORT: { label: "منتظر پشتیبانی", tone: "error" },
  WAITING_FOR_USER: { label: "منتظر کاربر", tone: "muted" },
  RESOLVED: { label: "حل‌شده", tone: "success" },
  CLOSED: { label: "بسته‌شده", tone: "muted" },
};

export default async function AdminSupportPage() {
  await requireAdminSession(PERMISSIONS.SUPPORT_READ);

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text">تیکت‌های پشتیبانی</h1>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-border text-text-muted">
            <tr>
              <th className="p-3 font-medium">شماره تیکت</th>
              <th className="p-3 font-medium">موضوع</th>
              <th className="p-3 font-medium">مشتری</th>
              <th className="p-3 font-medium">اولویت</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">آخرین بروزرسانی</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => {
              const status = STATUS_LABEL[t.status];
              return (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="p-3" dir="ltr">
                    {t.ticketNumber}
                  </td>
                  <td className="p-3">{t.subject}</td>
                  <td className="p-3 text-text-muted">
                    {t.user.firstName} {t.user.lastName}
                  </td>
                  <td className="p-3 text-text-muted">{t.priority}</td>
                  <td className="p-3">
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td className="p-3 text-text-muted">{formatFaDate(t.updatedAt)}</td>
                </tr>
              );
            })}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-text-muted">
                  هیچ تیکتی ثبت نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
