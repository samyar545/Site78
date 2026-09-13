"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ورود ناموفق بود");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-background p-8 shadow-md"
      >
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold text-primary">لیلاموند</div>
          <div className="mt-1 text-sm text-text-muted">ورود به پنل مدیریت</div>
        </div>

        <label className="mb-1 block text-sm text-text">ایمیل یا شماره موبایل</label>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          autoComplete="username"
          required
        />

        <label className="mb-1 block text-sm text-text">رمز عبور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          autoComplete="current-password"
          required
        />

        {error && <p className="mb-4 text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "در حال ورود…" : "ورود"}
        </button>
      </form>
    </div>
  );
}
