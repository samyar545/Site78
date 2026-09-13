import type {
  VirtualTryOnProvider,
  VirtualTryOnInput,
  VirtualTryOnResult,
  FaceAnalysisProvider,
  FaceAnalysisInput,
  FaceAnalysisResult,
  ProductRecommendationProvider,
  ProductRecommendationInput,
  ProductRecommendationResult,
} from "./BeautyAIProvider";

/**
 * Mock Providerهای AI — فقط برای Development.
 * ساختار ورودی/خروجی دقیقاً مطابق سرویس واقعی است؛ با قرار دادن API Key واقعی
 * در env و پیاده‌سازی یک Provider جدید (که همین اینترفیس‌ها را implement می‌کند)
 * می‌توان بدون تغییر در بقیه‌ی کد به سرویس واقعی سوییچ کرد (بنگرید src/lib/ai/index.ts).
 */

export class MockVirtualTryOnProvider implements VirtualTryOnProvider {
  readonly key = "mock";
  async tryOn(input: VirtualTryOnInput): Promise<VirtualTryOnResult> {
    return { ok: true, resultImageUrl: input.userImageRef }; // فعلاً همان تصویر ورودی را برمی‌گرداند
  }
}

export class MockFaceAnalysisProvider implements FaceAnalysisProvider {
  readonly key = "mock";
  async analyze(_input: FaceAnalysisInput): Promise<FaceAnalysisResult> {
    return {
      ok: true,
      suggestedSkinType: "normal",
      suggestedTones: ["nude", "rose"],
      disclaimer: "این تحلیل صرفاً یک پیشنهاد زیبایی است و جایگزین مشاوره پزشکی یا پوستی نیست.",
    };
  }
}

export class MockProductRecommendationProvider implements ProductRecommendationProvider {
  readonly key = "mock";
  async recommend(input: ProductRecommendationInput): Promise<ProductRecommendationResult> {
    return { ok: true, productIds: input.recentlyViewedProductIds?.slice(0, 4) ?? [] };
  }
}
