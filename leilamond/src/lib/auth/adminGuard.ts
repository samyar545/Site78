import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission, type PermissionKey } from "@/lib/auth/permissions";

/**
 * محافظت از صفحات ادمین سمت سرور (React Server Component).
 * توجه: این محافظت مکمل Authorization سمت API است، نه جایگزین آن —
 * هر API Route حساس باید خودش هم assertPermission را صدا بزند (بند 103).
 */
export async function requireAdminSession(permission?: PermissionKey) {
  const session = await getCurrentSession();
  if (!session) redirect("/admin/login");

  const roleKey = session.user.role.key;
  const isStaffRole = roleKey !== "CUSTOMER";
  if (!isStaffRole) redirect("/admin/login");

  if (permission && !hasPermission(session, permission)) {
    redirect("/admin?error=forbidden");
  }

  return session;
}
