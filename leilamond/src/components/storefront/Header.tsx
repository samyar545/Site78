import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { CartCountBadge } from "./CartCountBadge";

export async function Header() {
  const [session, categories] = await Promise.all([
    getCurrentSession(),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
  ]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-primary">
          لیلاموند
        </Link>

        <form action="/products" className="hidden flex-1 max-w-md md:block">
          <input
            name="q"
            placeholder="جستجوی محصول، برند یا دسته‌بندی…"
            className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </form>

        <div className="flex items-center gap-4 text-sm">
          <Link href={session ? "/account" : "/login"} className="text-text hover:text-primary">
            {session ? "حساب من" : "ورود / ثبت‌نام"}
          </Link>
          <Link href="/cart" className="relative text-text hover:text-primary">
            سبد خرید
            <CartCountBadge />
          </Link>
        </div>
      </div>

      <nav className="border-t border-border">
        <div className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-2 text-sm text-text-muted">
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`} className="whitespace-nowrap hover:text-primary">
              {c.name}
            </Link>
          ))}
          <Link href="/products?discounted=true" className="whitespace-nowrap text-primary hover:opacity-80">
            تخفیف‌ها
          </Link>
        </div>
      </nav>
    </header>
  );
}
