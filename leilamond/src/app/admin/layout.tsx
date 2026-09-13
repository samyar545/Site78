import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  const isStaff = !!session && session.user.role.key !== "CUSTOMER";

  if (!isStaff) {
    // صفحه لاگین (و هر مسیر بدون نشست معتبر) بدون Sidebar نمایش داده می‌شود؛
    // صفحات محافظت‌شده خودشان با requireAdminSession() به /admin/login هدایت می‌کنند.
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
