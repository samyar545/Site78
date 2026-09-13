/**
 * معماری AI Beauty لیلاموند
 * ----------------------------------------------------------------------
 * AI هرگز مستقیماً به یک سرویس خاص قفل نمی‌شود. تمام سرویس‌ها پشت این
 * اینترفیس‌ها قرار دارند. اگر AI در دسترس نباشد یا خطا بدهد، فروشگاه اصلی
 * باید کاملاً کار کند (نگاه کنید به src/lib/ai/withFallback.ts).
 *
 * توجه حقوقی/ایمنی: این سیستم هیچ‌گاه نباید ادعای تشخیص پزشکی کند.
 * خروجی‌های FaceAnalysisProvider صرفاً «پیشنهاد زیبایی» هستند، نه تشخیص طبی.
 */

export interface VirtualTryOnInput {
  userImageRef: string; // فقط رفرنس/URL ذخیره‌شده در Storage امن — نه Base64 خام در دیتابیس
  productId: string;
  region: "lips" | "cheeks" | "eyeshadow" | "eyeliner" | "hair";
}

export interface VirtualTryOnResult {
  ok: boolean;
  resultImageUrl?: string;
  errorMessage?: string;
}

export interface VirtualTryOnProvider {
  readonly key: string;
  tryOn(input: VirtualTryOnInput): Promise<VirtualTryOnResult>;
}

export interface FaceAnalysisInput {
  userImageRef: string;
}

export interface FaceAnalysisResult {
  ok: boolean;
  // خروجی‌ها همگی «پیشنهادی» هستند و نباید به‌عنوان تشخیص پزشکی/پوستی ارائه شوند.
  suggestedSkinType?: "oily" | "dry" | "combination" | "normal" | "sensitive";
  suggestedTones?: string[];
  disclaimer: string; // همیشه باید پر شود، مثلاً: "این تحلیل جایگزین مشاوره پزشکی نیست."
  errorMessage?: string;
}

export interface FaceAnalysisProvider {
  readonly key: string;
  analyze(input: FaceAnalysisInput): Promise<FaceAnalysisResult>;
}

export interface ProductRecommendationInput {
  userId?: string;
  skinType?: string;
  favoriteColors?: string[];
  recentlyViewedProductIds?: string[];
  favoriteProductIds?: string[];
}

export interface ProductRecommendationResult {
  ok: boolean;
  productIds: string[];
  errorMessage?: string;
}

export interface ProductRecommendationProvider {
  readonly key: string;
  recommend(input: ProductRecommendationInput): Promise<ProductRecommendationResult>;
}
