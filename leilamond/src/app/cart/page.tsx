"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatToman } from "@/lib/utils/format";

type CartItem = {
  id: string;
  quantity: number;
  product: { id: string; name: string; basePrice: number; slug: string; images: { url: string }[] };
  variant: { id: string; name: string; price: number | null } | null;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [issues, setIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/cart");
    if (res.status === 401) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setItems(data.cart?.items ?? []);
    setSubtotal(data.subtotal ?? 0);
    setIssues(data.issues ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;
    await fetch(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    load();
  }

  async function removeItem(itemId: string) {
    await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
    load();
  }

  if (authRequired) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="mb-4 text-text-muted">برای مشاهده سبد خرید ابتدا وارد حساب کاربری خود شوید.</p>
        <Link href="/login" className="rounded-md bg-primary px-5 py-2 text-sm text-white hover:opacity-90">
          ورود / ثبت‌نام
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-text-muted">در حال بارگذاری…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="mb-4 text-text-muted">سبد خرید شما خالی است.</p>
        <Link href="/products" className="rounded-md bg-primary px-5 py-2 text-sm text-white hover:opacity-90">
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
      <h1 className="mb-6 text-xl font-bold text-text">سبد خرید</h1>

      {issues.length > 0 && (
        <div className="mb-4 rounded-md bg-error/10 p-3 text-sm text-error">
          {issues.map((issue, i) => (
            <div key={i}>{issue}</div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const unitPrice = item.variant?.price ?? item.product.basePrice;
          return (
            <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.product.images[0].url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <Link href={`/products/${item.product.slug}`} className="text-sm text-text hover:text-primary">
                  {item.product.name}
                </Link>
                {item.variant && <div className="text-xs text-text-muted">{item.variant.name}</div>}
                <div className="mt-1 text-sm font-medium text-text">{formatToman(unitPrice)}</div>
              </div>
              <div className="flex items-center rounded-md border border-border">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-muted">
                  −
                </button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-muted">
                  +
                </button>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-sm text-error hover:underline">
                حذف
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-surface p-4">
        <span className="text-sm text-text-muted">جمع کل</span>
        <span className="text-lg font-bold text-text">{formatToman(subtotal)}</span>
      </div>

      <Link
        href="/checkout"
        className="mt-4 block w-full rounded-md bg-primary py-3 text-center text-sm font-medium text-white hover:opacity-90"
      >
        ادامه فرآیند خرید
      </Link>
    </div>
  );
}
