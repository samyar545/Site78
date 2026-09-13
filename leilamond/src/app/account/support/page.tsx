"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  updatedAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "باز",
  WAITING_FOR_SUPPORT: "منتظر پشتیبانی",
  WAITING_FOR_USER: "منتظر پاسخ شما",
  RESOLVED: "حل‌شده",
  CLOSED: "بسته‌شده",
};

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch("/api/support/tickets");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setTickets(data.tickets ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, priority }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubject("");
      setMessage("");
      setShowForm(false);
      load();
    }
  }

  if (loading) return <div className="px-4 py-20 text-center text-text-muted">در حال بارگذاری…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10" dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">پشتیبانی آنلاین</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:opacity-90"
        >
          + تیکت جدید
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-lg border border-border bg-surface p-4 space-y-3">
          <input
            required
            placeholder="موضوع"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="LOW">کم</option>
            <option value="NORMAL">عادی</option>
            <option value="HIGH">بالا</option>
            <option value="URGENT">فوری</option>
          </select>
          <textarea
            required
            placeholder="پیام خود را بنویسید…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "در حال ارسال…" : "ارسال تیکت"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {tickets.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm">
            <div>
              <div className="text-text">{t.subject}</div>
              <div className="text-xs text-text-muted" dir="ltr">
                {t.ticketNumber}
              </div>
            </div>
            <span className="text-xs text-text-muted">{STATUS_LABEL[t.status]}</span>
          </div>
        ))}
        {tickets.length === 0 && <p className="text-text-muted">هنوز تیکتی ثبت نکرده‌اید.</p>}
      </div>
    </div>
  );
}
