import {
  MockVirtualTryOnProvider,
  MockFaceAnalysisProvider,
  MockProductRecommendationProvider,
} from "./MockProviders";

export function isAIEnabled(): boolean {
  return process.env.AI_ENABLED === "true";
}

export function getVirtualTryOnProvider() {
  // در آینده: if (process.env.AI_PROVIDER === "vendor-x") return new VendorXTryOnProvider();
  return new MockVirtualTryOnProvider();
}

export function getFaceAnalysisProvider() {
  return new MockFaceAnalysisProvider();
}

export function getProductRecommendationProvider() {
  return new MockProductRecommendationProvider();
}

/**
 * هر فراخوانی AI باید از این Wrapper عبور کند تا:
 *  - اگر AI غیرفعال یا Down بود، فروشگاه اصلی خطا نگیرد (Graceful Failure، بند 131/132).
 *  - Timeout مناسب اعمال شود.
 */
export async function withAIFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  timeoutMs = 8000
): Promise<T> {
  if (!isAIEnabled()) return fallback;
  try {
    const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs));
    return await Promise.race([fn(), timeout]);
  } catch {
    return fallback;
  }
}

export * from "./BeautyAIProvider";
