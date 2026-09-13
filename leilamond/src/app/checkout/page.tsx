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

export default function CheckoutPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    province: "",
    city: "",
    postalCode: "",
    addressLine: "",
  });

  useEffect(() => {
    fetch("/api/addresses")
      .then((res) => (res.status === 401 ? router.push("/login") : res.json()))
      .then((data) => {
        if (!data) return;
        setAddresses(data.addresses ?? []);
        const def = data.addresses?.find((a: Address) => a.isDefault) ?? data.addresses?.[0];
        if (def) setAddressId(def.id);
        else setShowNewAddress(true);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAddress, isDefault: addresses.length === 0 }),
    });
    const data = await res.json();
    if (res.ok) {
      setAddresses((prev) => [...prev, data.address]);
      setAddressId(data.address.id);
      setShowNewAddress(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId, couponCode: couponCode || undefined }),
    });
    const data = await res.json();

    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "ثبت سفارش ناموفق بود");
      return;
    }

    window.location.href = data.redirectUrl;
  }

  if (loading) {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center text-text-muted">در حال بارگذاری…</div>;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10" dir="rtl">
      <h1 className="mb-6 text-xl font-bold text-text">تسویه حساب</h1>

      <div className="mb-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-text">آدرس تحویل</h2>

        {addresses.length > 0 && !showNewAddress && (
          <div className="space-y-2">
            {addresses.map((a) => (
              <label key={a.id} className="flex items-start gap-2 rounded-md border border-border p-3 text-sm">
                <input
                  type="radio"
                  name="address"
                  checked={addressId === a.id}
                  onChange={() => setAddressId(a.id)}
                  className="mt-1"
                />
                <span>
                  <div className="font-medium text-text">{a.fullName} — {a.phone}</div>
                  <div className="text-text-muted">
                    {a.province}، {a.city}، {a.addressLine}
                  </div>
                </span>
              </label>
            ))}
            <button onClick={() => setShowNewAddress(true)} className="text-sm text-primary hover:underline">
              + آدرس جدید
            </button>
          </div>
        )}

        {showNewAddress && (
          <form onSubmit={handleAddAddress} className="space-y-3">
            <input
              required
              placeholder="نام و نام خانوادگی"
              value={newAddress.fullName}
              onChange={(e) => setNewAddress((v) => ({ ...v, fullName: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              required
              placeholder="شماره موبایل"
              value={newAddress.phone}
              onChange={(e) => setNewAddress((v) => ({ ...v, phone: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="استان"
                value={newAddress.province}
                onChange={(e) => setNewAddress((v) => ({ ...v, province: e.target.value }))}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                required
                placeholder="شهر"
                value={newAddress.city}
                onChange={(e) => setNewAddress((v) => ({ ...v, city: e.target.value }))}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <input
              required
              placeholder="کد پستی"
              value={newAddress.postalCode}
              onChange={(e) => setNewAddress((v) => ({ ...v, postalCode: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <textarea
              required
              placeholder="آدرس کامل"
              value={newAddress.addressLine}
              onChange={(e) => setNewAddress((v) => ({ ...v, addressLine: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:opacity-90">
              ذخیره آدرس
            </button>
          </form>
        )}
      </div>

      <div className="mb-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-text">کد تخفیف</h2>
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="مثلاً LEILA20"
          dir="ltr"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || !addressId}
        className="w-full rounded-md bg-primary py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "در حال انتقال به درگاه پرداخت…" : "پرداخت"}
      </button>
    </div>
  );
}
