"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
};

export function CategoryManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, sortOrder: initial.length }),
    });
    const data = await res.json();

    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "ذخیره ناموفق بود");
      return;
    }
    setName("");
    setSlug("");
    router.refresh();
  }

  async function toggleActive(cat: Category) {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-border text-text-muted">
            <tr>
              <th className="p-3 font-medium">نام</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {initial.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-text-muted" dir="ltr">
                  {c.slug}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleActive(c)}
                    className={c.isActive ? "text-success hover:underline" : "text-text-muted hover:underline"}
                  >
                    {c.isActive ? "فعال" : "غیرفعال"}
                  </button>
                </td>
              </tr>
            ))}
            {initial.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-text-muted">
                  هنوز دسته‌بندی‌ای ثبت نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCreate} className="h-fit rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-text">افزودن دسته‌بندی</h2>
        <label className="mb-1 block text-sm text-text">نام</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <label className="mb-1 block text-sm text-text">Slug</label>
        <input
          required
          dir="ltr"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {error && <p className="mb-3 text-sm text-error">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "در حال ذخیره…" : "افزودن"}
        </button>
      </form>
    </div>
  );
}
