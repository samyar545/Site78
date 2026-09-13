"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  isDefault: boolean;
};

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/addresses")
      .then((res) => (res.status === 401 ? router.push("/login") : res.json()))
      .then((data) => {
        if (!data) return;
        setAddresses(data.addresses ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) return <div className="px-4 py-20 text-center text-text-muted">در حال بارگذاری…</div>;

  return (
    <div className="mx-auto max-w-xl px-4 py-10" dir="rtl">
      <h1 className="mb-6 text-xl font-bold text-text">آدرس‌های من</h1>
      <div className="space-y-3">
        {addresses.map((a) => (
          <div key={a.id} className="flex items-start justify-between rounded-lg border border-border bg-surface p-4 text-sm">
            <div>
              <div className="font-medium text-text">
                {a.fullName} — {a.phone} {a.isDefault && <span className="text-primary">(پیش‌فرض)</span>}
              </div>
              <div className="text-text-muted">
                {a.province}، {a.city}، {a.addressLine}
              </div>
            </div>
            <button onClick={() => remove(a.id)} className="text-error hover:underline">
              حذف
            </button>
          </div>
        ))}
        {addresses.length === 0 && <p className="text-text-muted">هنوز آدرسی ثبت نکرده‌اید.</p>}
      </div>
    </div>
  );
}
