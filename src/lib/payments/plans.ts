export type PlanKey =
  | 'IN_STARTER'
  | 'IN_GROWTH'
  | 'IN_PRO'
  | 'US_STARTER'
  | 'US_GROWTH'
  | 'US_PRO';

export interface PlanDefinition {
  key: PlanKey;
  tier: 'STARTER' | 'GROWTH' | 'PRO';
  name: string;
  country: 'IN' | 'US';
  currency: 'INR' | 'USD';
  priceMinor: number; // in paise or cents
  monthlyPriceFormatted: string;
  itemLimit: number;
  imageCreditsMonthly: number;
  aiQuestionsMonthly: number;
  allowCustomColors: boolean;
  allowUpsellingPairings: boolean;
  allowMultipleMenus: boolean;
  analyticsTier: 'BASIC' | 'ADVANCED';
}

export const PLAN_CATALOG: Record<PlanKey, PlanDefinition> = {
  IN_STARTER: {
    key: 'IN_STARTER',
    tier: 'STARTER',
    name: 'Starter (India)',
    country: 'IN',
    currency: 'INR',
    priceMinor: 99900,
    monthlyPriceFormatted: '₹999/mo',
    itemLimit: 50,
    imageCreditsMonthly: 15,
    aiQuestionsMonthly: 1000,
    allowCustomColors: false,
    allowUpsellingPairings: false,
    allowMultipleMenus: false,
    analyticsTier: 'BASIC',
  },
  IN_GROWTH: {
    key: 'IN_GROWTH',
    tier: 'GROWTH',
    name: 'Growth (India)',
    country: 'IN',
    currency: 'INR',
    priceMinor: 179900,
    monthlyPriceFormatted: '₹1,799/mo',
    itemLimit: 150,
    imageCreditsMonthly: 50,
    aiQuestionsMonthly: 5000,
    allowCustomColors: true,
    allowUpsellingPairings: true,
    allowMultipleMenus: false,
    analyticsTier: 'ADVANCED',
  },
  IN_PRO: {
    key: 'IN_PRO',
    tier: 'PRO',
    name: 'Pro (India)',
    country: 'IN',
    currency: 'INR',
    priceMinor: 269900,
    monthlyPriceFormatted: '₹2,699/mo',
    itemLimit: 9999, // fair use
    imageCreditsMonthly: 200,
    aiQuestionsMonthly: 20000,
    allowCustomColors: true,
    allowUpsellingPairings: true,
    allowMultipleMenus: true,
    analyticsTier: 'ADVANCED',
  },
  US_STARTER: {
    key: 'US_STARTER',
    tier: 'STARTER',
    name: 'Starter (US)',
    country: 'US',
    currency: 'USD',
    priceMinor: 2900,
    monthlyPriceFormatted: '$29/mo',
    itemLimit: 50,
    imageCreditsMonthly: 15,
    aiQuestionsMonthly: 1000,
    allowCustomColors: false,
    allowUpsellingPairings: false,
    allowMultipleMenus: false,
    analyticsTier: 'BASIC',
  },
  US_GROWTH: {
    key: 'US_GROWTH',
    tier: 'GROWTH',
    name: 'Growth (US)',
    country: 'US',
    currency: 'USD',
    priceMinor: 5900,
    monthlyPriceFormatted: '$59/mo',
    itemLimit: 150,
    imageCreditsMonthly: 50,
    aiQuestionsMonthly: 5000,
    allowCustomColors: true,
    allowUpsellingPairings: true,
    allowMultipleMenus: false,
    analyticsTier: 'ADVANCED',
  },
  US_PRO: {
    key: 'US_PRO',
    tier: 'PRO',
    name: 'Pro (US)',
    country: 'US',
    currency: 'USD',
    priceMinor: 11900,
    monthlyPriceFormatted: '$119/mo',
    itemLimit: 9999, // fair use
    imageCreditsMonthly: 200,
    aiQuestionsMonthly: 20000,
    allowCustomColors: true,
    allowUpsellingPairings: true,
    allowMultipleMenus: true,
    analyticsTier: 'ADVANCED',
  },
};

export function getPlansForCountry(country: 'IN' | 'US'): PlanDefinition[] {
  return Object.values(PLAN_CATALOG).filter((p) => p.country === country);
}

export function formatCurrencyMinor(minor: number, currency: string = 'INR'): string {
  const amount = minor / 100;
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

