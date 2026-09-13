"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Variant = { id: string; name: string; stock: number };

export function AddToCartBox({
  productId,
  stock,
  variants,
}: {
  productId: string;
  stock: number;
  variants: Variant[];
}) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const availableStock = variants.length > 0 ? variants.find((v) => v.id === variantId)?.stock ?? 0 : stock;

  async function handleAdd() {
    setStatus("saving");
    setMessage(null);

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, quantity }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      setStatus("error");
      setMessage(data.error ?? "افزودن به سبد خرید ناموفق بود");
      return;
    }

    setStatus("done");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      {variants.length > 0 && (
        <div className="mb-4">
          <label className="mb-1 block text-sm text-text">رنگ / نوع</label>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock === 0}>
                {v.name} {v.stock === 0 ? "(ناموجود)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-text">تعداد</label>
        <div className="flex items-center rounded-md border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-1 text-text hover:bg-muted"
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
            className="px-3 py-1 text-text hover:bg-muted"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={status === "saving" || availableStock === 0}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {availableStock === 0 ? "ناموجود" : status === "saving" ? "در حال افزودن…" : status === "done" ? "به سبد اضافه شد ✓" : "افزودن به سبد خرید"}
      </button>

      {message && <p className="mt-2 text-sm text-error">{message}</p>}
    </div>
  );
}
