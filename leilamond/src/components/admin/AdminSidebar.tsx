"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_GROUPS = [
  {
    label: "نمای کلی",
    items: [{ href: "/admin", label: "داشبورد" }],
  },
  {
    label: "فروشگاه",
    items: [
      { href: "/admin/products", label: "محصولات" },
      { href: "/admin/categories", label: "دسته‌بندی‌ها" },
      { href: "/admin/orders", label: "سفارش‌ها" },
    ],
  },
  {
    label: "محتوا و چیدمان",
    items: [{ href: "/admin/homepage-builder", label: "چیدمان صفحه اصلی" }],
  },
  {
    label: "پشتیبانی مشتریان",
    items: [{ href: "/admin/support", label: "تیکت‌های پشتیبانی" }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-l border-border bg-surface min-h-screen p-4">
      <div className="mb-6 px-2">
        <div className="text-lg font-bold text-primary">لیلاموند</div>
        <div className="text-xs text-text-muted">پنل مدیریت</div>
      </div>

      <nav className="space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-2 mb-2 text-xs text-text-muted">{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary text-white"
                        : "text-text hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
