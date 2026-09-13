import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "لیلاموند | Leilamond — فروشگاه آنلاین لوازم آرایشی و زیبایی",
  description: "فروشگاه آنلاین لوکس لوازم آرایشی و زیبایی لیلاموند",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
