import { prisma } from "@/lib/prisma";

/**
 * قیمت مؤثر یک محصول را با در نظر گرفتن:
 *  - compareAtPrice/basePrice خود محصول
 *  - تخفیف‌های فعال (Discount) که این محصول را شامل می‌شوند
 *  - کمپین‌های تخفیف ویژه (DiscountCampaign) فعال
 * محاسبه می‌کند. کمترین قیمت معتبر برگردانده می‌شود.
 * این تابع باید تنها منبع محاسبه قیمت در Checkout باشد — هرگز به قیمتی که
 * از Client ارسال می‌شود اعتماد نکنید.
 */
export async function getEffectiveUnitPrice(productId: string, basePrice: number): Promise<number> {
  const now = new Date();

  const [discount, campaign] = await Promise.all([
    prisma.discountProduct.findFirst({
      where: {
        productId,
        discount: { isActive: true, startAt: { lte: now }, endAt: { gte: now } },
      },
      include: { discount: true },
    }),
    prisma.campaignProduct.findFirst({
      where: {
        productId,
        campaign: { isActive: true, startAt: { lte: now }, endAt: { gte: now } },
      },
      include: { campaign: true },
    }),
  ]);

  const candidates = [basePrice];

  if (discount) {
    if (discount.discount.fixedPrice) candidates.push(discount.discount.fixedPrice);
    else if (discount.discount.percent) candidates.push(Math.round(basePrice * (1 - discount.discount.percent / 100)));
  }

  if (campaign) {
    if (campaign.campaign.fixedPrice) candidates.push(campaign.campaign.fixedPrice);
    else if (campaign.campaign.percent) candidates.push(Math.round(basePrice * (1 - campaign.campaign.percent / 100)));
  }

  return Math.min(...candidates);
}
