import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 text-sm md:grid-cols-4">
        <div>
          <div className="mb-3 text-lg font-bold text-primary">لیلاموند</div>
          <p className="text-text-muted">فروشگاه آنلاین لوازم آرایشی و زیبایی</p>
        </div>
        <div>
          <div className="mb-3 font-medium text-text">فروشگاه</div>
          <ul className="space-y-2 text-text-muted">
            <li><Link href="/products" className="hover:text-primary">همه محصولات</Link></li>
            <li><Link href="/products?discounted=true" className="hover:text-primary">تخفیف‌ها</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-medium text-text">راهنما</div>
          <ul className="space-y-2 text-text-muted">
            <li><Link href="/pages/about" className="hover:text-primary">درباره ما</Link></li>
            <li><Link href="/pages/shipping" className="hover:text-primary">ارسال و بازگشت کالا</Link></li>
            <li><Link href="/account/support" className="hover:text-primary">پشتیبانی آنلاین</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-medium text-text">حساب کاربری</div>
          <ul className="space-y-2 text-text-muted">
            <li><Link href="/login" className="hover:text-primary">ورود / ثبت‌نام</Link></li>
            <li><Link href="/account/addresses" className="hover:text-primary">آدرس‌های من</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} لیلاموند — تمامی حقوق محفوظ است.
      </div>
    </footer>
  );
}
