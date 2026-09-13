# لیلاموند | Leilamond

فروشگاه آنلاین لوازم آرایشی و زیبایی — Next.js + TypeScript + PostgreSQL + Prisma

## ⚠️ وضعیت فعلی پروژه (صادقانه)

این پروژه به‌صورت **مرحله‌ای** ساخته می‌شود (طبق اولویت خودت: Architecture → DB → Backend → Admin → E-commerce Logic → Payment → AI → Frontend).

### فاز ۱ — معماری و Database ✅
- Database Schema کامل (`prisma/schema.prisma`)
- معماری Provider-based پرداخت، AI، Shipping، Notification
- Auth مبتنی بر Session + RBAC
- Docker، Design Tokens، Seed پایه

### فاز ۲ — Backend API (همین تحویل) ✅
- **Auth**: register / login (با Rate Limit ساده) / logout / me
- **کاتالوگ عمومی**: لیست محصولات با فیلتر/سورت/صفحه‌بندی پیشرفته (`/api/products`)، جزئیات محصول + محصولات مرتبط + ثبت Recently Viewed (`/api/products/[slug]`)
- **ادمین کاتالوگ**: CRUD کامل محصول (`/api/admin/products`)، دسته‌بندی، برند — با Authorization + Audit Log روی هر تغییر
- **سبد خرید**: افزودن/ویرایش/حذف آیتم با بررسی موجودی (`/api/cart`)
- **آدرس‌ها**: CRUD آدرس‌های کاربر
- **کوپن**: اعتبارسنجی کد تخفیف
- **قیمت مؤثر**: محاسبه خودکار کمترین قیمت از میان تخفیف عادی و کمپین‌های Countdown (`src/lib/pricing/effectivePrice.ts`)
- **Checkout**: تراکنش اتمیک کامل — بررسی موجودی، محاسبه سرور-ساید مبلغ (هرگز از کلاینت)، اعمال کوپن، محاسبه هزینه ارسال، کاهش موجودی، ایجاد سفارش، فراخوانی Provider پرداخت (`/api/checkout`)
- **Callback پرداخت**: Verify واقعی + Idempotent + Transaction (فاز ۱، بازبینی‌شده)
- **سفارش‌ها**: مشاهده سفارش (مالک یا ادمین)، لیست و تغییر وضعیت در ادمین — انتقال به PAID فقط از مسیر Callback واقعی ممکن است، نه از این Route
- **نظرات**: ثبت Review با تشخیص خودکار Verified Purchase + Moderation در ادمین (تایید → بازمحاسبه امتیاز محصول)
- **Wishlist**: افزودن/حذف/لیست
- **پشتیبانی (Ticketing)**: ایجاد تیکت با شماره یکتا، ارسال پیام در تیکت، لیست/فیلتر/Assign/تغییر وضعیت در ادمین
- Seed تکمیل‌شده با نقش‌های SUPPORT_AGENT، ORDER_MANAGER، PRODUCT_MANAGER (هرکدام فقط دسترسی حوزه خودشان)

### فاز ۳ — پنل ادمین (UI) (همین تحویل) ✅
- `/admin/login`: صفحه ورود مجزای ادمین (بند ۷۰)
- Layout ادمین با Sidebar و محافظت سمت سرور (`requireAdminSession`) — مکمل Authorization سمت API، نه جایگزین آن
- **داشبورد**: فروش امروز/ماه، تعداد سفارش‌ها، تعداد کاربران، محصولات کم‌موجود، پرفروش‌ترین‌ها
- **مدیریت محصول**: لیست + فرم ایجاد/ویرایش کامل (قیمت، موجودی، وضعیت، دسته، برند، ویژه)
- **مدیریت دسته‌بندی**: لیست + افزودن + فعال/غیرفعال
- **مدیریت سفارش**: لیست + تغییر وضعیت (تبدیل به PAID از این مسیر مسدود است — فقط Callback واقعی می‌تواند)
- **Homepage Builder کامل با Drag & Drop** (`@dnd-kit`): افزودن Section از میان تمام انواع خواسته‌شده (Hero، Product Grid/Carousel، Category Grid، Discount/New/Best-seller، Advertisement، Custom Banner، Text، Brand)، جابه‌جایی با کشیدن و ذخیره فوری ترتیب، فعال/غیرفعال، Draft/Publish
- **تیکت‌های پشتیبانی**: نمای فهرستی برای ادمین
- Root Layout با فونت/جهت RTL و Design Tokens متصل به Tailwind

### فاز ۴ — Frontend فروشگاه (همین تحویل) ✅
- **صفحه اصلی Dynamic واقعی**: بخش‌ها مستقیماً از `HomepageSection` در دیتابیس خوانده می‌شوند (نه Hard-coded) — همان چیدمانی که در Homepage Builder ساختید اینجا رندر می‌شود (Hero، Category Grid، Discount/New/Best-seller، بنر سفارشی/تبلیغ، بخش متنی)
- **لیست محصولات** با فیلتر دسته/برند/جستجو و مرتب‌سازی
- **صفحه محصول**: گالری تصاویر، انتخاب Variant، قیمت مؤثر (با احتساب تخفیف/کمپین Countdown)، افزودن به سبد، نظرات تأییدشده، محصولات مشابه
- **سبد خرید**: نمایش زنده از API، تغییر تعداد، حذف، هشدار کمبود موجودی
- **Checkout**: انتخاب/افزودن آدرس، کد تخفیف، اتصال مستقیم به Provider پرداخت واقعی
- **صفحه نتیجه سفارش**: موفق/در انتظار + جزئیات کامل سفارش، و صفحه شکست پرداخت
- **ورود/ثبت‌نام مشتری** (مسیر جدا از ادمین)
- **حساب کاربری**: خلاصه سفارش‌ها، مدیریت آدرس، **پشتیبانی آنلاین (ایجاد و مشاهده تیکت)**
- Header/Footer با منوی دسته‌بندی، جستجو، نشان سبد خرید زنده

**نکته طراحی:** صفحات سبد خرید/Checkout/ورود عمداً بدون Header/Footer کامل هستند (الگوی رایج «Focused Checkout Flow» برای کاهش حواس‌پرتی هنگام پرداخت).

**🔜 در فازهای بعدی:**
- مدیریت بنر، تبلیغ (با Position دقیق)، کمپین تخفیف Countdown، کوپن، تنظیمات سایت، Media Library — در پنل ادمین
- Countdown Timer واقعی روی کمپین‌های تخفیف (سرور-ساید)
- صفحه AI Beauty (Virtual Try-On UI)
- پاسخ‌گویی به تیکت از هر دو سمت (UI Thread کامل)
- Wishlist UI، Product Comparison، Recently Viewed UI
- تست‌های خودکار (Vitest)
- Security headers، محدودیت آپلود فایل، Audit امنیتی نهایی

### ⚠️ نکات فنی برای بازبینی در فاز بعد
- `src/app/api/cart/route.ts`: کلید یکتای `cartId_productId_variantId` وقتی `variantId` وجود ندارد فعلاً با رشته خالی مدیریت می‌شود؛ در فاز Frontend باید این منطق با دقت بیشتری روی مقدار `null` واقعی تست شود.
- Rate limiting لاگین فعلاً In-memory است — برای Production چندنمونه‌ای (چند Instance) باید با Redis جایگزین شود.

## ⚠️ محدودیت مهم محیط ساخت این پروژه

این کد در محیطی نوشته شده که به اینترنت دسترسی ندارد؛ بنابراین **`npm install` و `npm run build` هرگز در این محیط اجرا و تست نشده‌اند.**
نسخه‌های پکیج در `package.json` بر اساس آخرین نسخه‌های پایدار شناخته‌شده نوشته شده‌اند اما ممکن است در سیستم شما نیاز به `npm install` و رفع چند خطای احتمالی TypeScript/Import در اولین اجرا داشته باشید.
**پیش از استفاده Production، حتماً روی سیستم خودتان `npm run build` و `npm run typecheck` را اجرا و خروجی را بررسی کنید.**

## نصب و راه‌اندازی (Development)

```bash
# 1. نصب Dependencyها
npm install

# 2. تنظیم Environment Variables
cp .env.example .env
# سپس مقادیر DATABASE_URL و بقیه موارد را در .env ویرایش کنید

# 3. بالا آوردن PostgreSQL (یا از Docker استفاده کنید)
docker compose up -d db

# 4. اجرای Migration
npx prisma migrate dev --name init

# 5. Seed کردن دیتای نمونه
npm run seed

# 6. اجرای Development Server
npm run dev
```

سایت روی `http://localhost:3000` بالا می‌آید.

## اطلاعات ورود Demo

| نقش | ایمیل | رمز عبور |
|---|---|---|
| ادمین (Super Admin) | admin@leilamond.test | Leilamond@Admin123 |
| کاربر عادی | customer@leilamond.test | Customer@123 |

⚠️ این حساب‌ها فقط برای Development هستند — قبل از Production حتماً حذف یا رمزشان را عوض کنید.

## Build و اجرای Production

```bash
npm run build
npm run start
# یا با Docker:
docker compose up -d --build
```

## تنظیم درگاه پرداخت بانکی واقعی

1. در `.env`: `PAYMENT_PROVIDER=zarinpal` را تنظیم کنید.
2. `PAYMENT_MERCHANT_ID` را با Merchant ID واقعی که از زرین‌پال گرفته‌اید پر کنید.
3. پیاده‌سازی واقعی در `src/lib/payment/ZarinPalProvider.ts` است — هیچ تغییری در بقیه کد لازم نیست.
4. برای اضافه کردن درگاه دیگر (آیدی‌پی، نکست‌پی و...): یک کلاس جدید که `PaymentProvider` را پیاده‌سازی می‌کند در `src/lib/payment/` بسازید و در `src/lib/payment/index.ts` اضافه کنید.

## تنظیم AI Beauty

1. `AI_ENABLED=true` و `AI_PROVIDER` و `AI_API_KEY` را در `.env` پر کنید.
2. در `src/lib/ai/index.ts` بجای Mock Providerها، Provider واقعی خود را وایر کنید (اینترفیس‌ها در `BeautyAIProvider.ts`).
3. تا زمانی‌که Provider واقعی وصل نشده، سیستم به‌صورت خودکار روی Mock/Fallback کار می‌کند و باعث Down شدن فروشگاه نمی‌شود.

## تنظیم Storage تصاویر

مقادیر `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` را در `.env` برای هر سرویس S3-compatible (مثل Liara Object Storage, ArvanCloud, AWS S3) پر کنید.

## ساختار پروژه

```
/prisma            Schema + Seed
/src
  /app             Next.js App Router (صفحات + API Routes)
  /components      UI Components
  /features        منطق دامنه (محصول، سبد خرید، سفارش، ...)
  /lib
    /auth          Session, Password, RBAC
    /payment       PaymentProvider + ZarinPal + Mock
    /ai            BeautyAIProvider + Mock + Fallback
    /shipping      ShippingProvider
    /notification  NotificationProvider
  /server          منطق سرور/سرویس‌ها
  /admin           پنل ادمین
  /types           Type تعریف‌های مشترک
  /hooks           React Hooks
  /utils           توابع کمکی
```

## Deployment روی VPS

مستندات کامل استقرار (Ubuntu + Nginx + SSL + PM2/Docker + Backup) در فاز نهایی پروژه در `docs/deployment.md` اضافه خواهد شد.

---

این پروژه بخشی از یک ساخت مرحله‌ای است. برای ادامه، مرحله بعدی (API Routeهای کامل فروشگاه یا پنل ادمین) را مشخص کنید.
