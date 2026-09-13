"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "در انتظار" },
  { value: "AWAITING_PAYMENT", label: "در انتظار پرداخت" },
  { value: "PAID", label: "پرداخت‌شده" },
  { value: "PROCESSING", label: "در حال پردازش" },
  { value: "SHIPPED", label: "ارسال‌شده" },
  { value: "DELIVERED", label: "تحویل‌شده" },
  { value: "CANCELLED", label: "لغوشده" },
  { value: "FAILED", label: "ناموفق" },
];

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    if (next === "PAID") return; // فقط سیستم Callback پرداخت می‌تواند این وضعیت را تنظیم کند
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    if (res.ok) {
      setCurrent(next);
      router.refresh();
    }
  }

  return (
    <select
      value={current}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value} disabled={o.value === "PAID" && current !== "PAID"}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
