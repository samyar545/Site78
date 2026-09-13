"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };
type Brand = { id: string; name: string };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  shortDescription?: string;
  basePrice: number;
  compareAtPrice?: number | null;
  stock: number;
  categoryId: string;
  brandId?: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  isFeatured?: boolean;
};

export function ProductForm({
  categories,
  brands,
  initial,
}: {
  categories: Category[];
  brands: Brand[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [values, setValues] = useState<ProductFormValues>(
    initial ?? {
      name: "",
      slug: "",
      basePrice: 0,
      stock: 0,
      categoryId: categories[0]?.id ?? "",
      status: "DRAFT",
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();

    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "ذخیره ناموفق بود");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div>
        <label className="mb-1 block text-sm text-text">نام محصول</label>
        <input
          required
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-text">Slug (آدرس URL)</label>
        <input
          required
          dir="ltr"
          value={values.slug}
          onChange={(e) => update("slug", e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-text">توضیح کوتاه</label>
        <textarea
          value={values.shortDescription ?? ""}
          onChange={(e) => update("shortDescription", e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-text">قیمت (تومان)</label>
          <input
            required
            type="number"
            min={0}
            value={values.basePrice}
            onChange={(e) => update("basePrice", Number(e.target.value))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text">قیمت قبل از تخفیف (اختیاری)</label>
          <input
            type="number"
            min={0}
            value={values.compareAtPrice ?? ""}
            onChange={(e) => update("compareAtPrice", e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-text">موجودی</label>
          <input
            required
            type="number"
            min={0}
            value={values.stock}
            onChange={(e) => update("stock", Number(e.target.value))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text">وضعیت</label>
          <select
            value={values.status}
            onChange={(e) => update("status", e.target.value as ProductFormValues["status"])}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="DRAFT">پیش‌نویس</option>
            <option value="ACTIVE">فعال</option>
            <option value="INACTIVE">غیرفعال</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-text">دسته‌بندی</label>
          <select
            value={values.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text">برند</label>
          <select
            value={values.brandId ?? ""}
            onChange={(e) => update("brandId", e.target.value || undefined)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">بدون برند</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          checked={!!values.isFeatured}
          onChange={(e) => update("isFeatured", e.target.checked)}
        />
        محصول ویژه (در بخش‌های ویژه صفحه اصلی نمایش داده شود)
      </label>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "در حال ذخیره…" : "ذخیره محصول"}
        </button>
      </div>
    </form>
  );
}
