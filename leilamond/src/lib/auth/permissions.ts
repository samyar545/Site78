/**
 * لیست تمام Permissionهای سیستم. این رشته‌ها باید دقیقاً با مقادیر
 * seed‌شده در جدول Permission یکی باشند (prisma/seed.ts).
 */
export const PERMISSIONS = {
  PRODUCTS_READ: "products.read",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",

  CATEGORIES_MANAGE: "categories.manage",
  BRANDS_MANAGE: "brands.manage",

  ORDERS_READ: "orders.read",
  ORDERS_UPDATE: "orders.update",

  USERS_READ: "users.read",
  USERS_UPDATE: "users.update",

  DISCOUNTS_MANAGE: "discounts.manage",
  COUPONS_MANAGE: "coupons.manage",
  ADVERTISEMENTS_MANAGE: "advertisements.manage",
  BANNERS_MANAGE: "banners.manage",
  HOMEPAGE_MANAGE: "homepage.manage",
  PAGES_MANAGE: "pages.manage",
  REVIEWS_MODERATE: "reviews.moderate",

  SUPPORT_READ: "support.read",
  SUPPORT_REPLY: "support.reply",

  SETTINGS_UPDATE: "settings.update",
  MEDIA_MANAGE: "media.manage",
  ANALYTICS_READ: "analytics.read",
  AUDIT_READ: "audit.read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

type SessionWithPermissions = {
  user: {
    role: {
      permissions: { permission: { key: string } }[];
    };
  };
} | null;

/**
 * بررسی Authorization سمت سرور. این تابع باید در هر API Route حساس
 * (مخصوصاً همه‌ی مسیرهای /api/admin/*) صدا زده شود — صرفاً مخفی کردن
 * دکمه در UI کافی نیست (بند 103).
 */
export function hasPermission(session: SessionWithPermissions, permission: PermissionKey): boolean {
  if (!session) return false;
  return session.user.role.permissions.some((rp) => rp.permission.key === permission);
}

export function assertPermission(session: SessionWithPermissions, permission: PermissionKey): void {
  if (!hasPermission(session, permission)) {
    throw new AuthorizationError(`دسترسی لازم برای این عملیات وجود ندارد: ${permission}`);
  }
}

export class AuthorizationError extends Error {
  status = 403;
}
