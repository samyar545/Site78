"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین" },
  { value: "cheapest", label: "ارزان‌ترین" },
  { value: "expensive", label: "گران‌ترین" },
  { value: "popular", label: "محبوب‌ترین" },
  { value: "bestSelling", label: "پرفروش‌ترین" },
];

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-text-muted">مرتب‌سازی:</span>
      <select
        defaultValue={searchParams.get("sort") ?? "newest"}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:border-primary"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
