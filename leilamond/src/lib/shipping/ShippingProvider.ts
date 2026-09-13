export interface ShippingRateInput {
  city: string;
  province: string;
  weightGrams: number;
  orderTotal: number;
}

export interface ShippingRateResult {
  methodKey: string;
  label: string; // e.g. "پست پیشتاز"
  cost: number;
  etaDays?: number;
}

export interface ShippingProvider {
  readonly key: string;
  getRates(input: ShippingRateInput): Promise<ShippingRateResult[]>;
}

export class MockShippingProvider implements ShippingProvider {
  readonly key = "mock";
  async getRates(input: ShippingRateInput): Promise<ShippingRateResult[]> {
    const free = input.orderTotal >= 2_000_000;
    return [
      { methodKey: "standard", label: "پست پیشتاز", cost: free ? 0 : 45_000, etaDays: 3 },
      { methodKey: "express", label: "ارسال اکسپرس", cost: 90_000, etaDays: 1 },
    ];
  }
}

export function getShippingProvider(): ShippingProvider {
  // در آینده: بر اساس Setting می‌توان Provider واقعی (تیپاکس، پست و ...) را جایگزین کرد
  return new MockShippingProvider();
}
