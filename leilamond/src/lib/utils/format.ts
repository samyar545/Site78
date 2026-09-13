const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** تبدیل عدد لاتین به ارقام فارسی برای نمایش (مقدار اصلی در دیتابیس همیشه Integer استاندارد است) */
export function toFaDigits(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function formatToman(amount: number): string {
  return `${toFaDigits(amount.toLocaleString("en-US"))} تومان`;
}

export function formatFaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
