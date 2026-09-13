"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ثبت‌نام ناموفق بود");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4" dir="rtl">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-border bg-background p-8">
        <h1 className="mb-6 text-center text-xl font-bold text-primary">ثبت‌نام در لیلاموند</h1>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <input
            placeholder="نام"
            value={form.firstName}
            onChange={(e) => setForm((v) => ({ ...v, firstName: e.target.value }))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            placeholder="نام خانوادگی"
            value={form.lastName}
            onChange={(e) => setForm((v) => ({ ...v, lastName: e.target.value }))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <label className="mb-1 block text-sm text-text">شماره موبایل</label>
        <input
          value={form.phone}
          onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))}
          className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          dir="ltr"
        />

        <label className="mb-1 block text-sm text-text">ایمیل (اختیاری)</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
          className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          dir="ltr"
        />

        <label className="mb-1 block text-sm text-text">رمز عبور</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
          className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          required
          minLength={8}
        />

        {error && <p className="mb-4 text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "در حال ثبت‌نام…" : "ثبت‌نام"}
        </button>

        <p className="mt-4 text-center text-sm text-text-muted">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/login" className="text-primary hover:underline">
            وارد شوید
          </Link>
        </p>
      </form>
    </div>
  );
}
