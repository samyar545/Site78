import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/adminGuard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { HomepageBuilder } from "@/components/admin/HomepageBuilder";

export default async function HomepageBuilderPage() {
  await requireAdminSession(PERMISSIONS.HOMEPAGE_MANAGE);

  const sections = await prisma.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, type: true, title: true, isActive: true, status: true, sortOrder: true },
  });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-text">چیدمان صفحه اصلی</h1>
      <p className="mb-6 text-sm text-text-muted">
        بخش‌های صفحه اصلی را اضافه، فعال/غیرفعال و مرتب کنید. تغییرات پس از «انتشار» روی سایت نمایش داده می‌شوند.
      </p>
      <HomepageBuilder initial={sections} />
    </div>
  );
}
