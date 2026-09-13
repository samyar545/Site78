"use client";

import { useEffect, useState } from "react";

export function CartCountBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const total = (data.cart?.items ?? []).reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);
        setCount(total);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!count) return null;

  return (
    <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
      {count}
    </span>
  );
}
