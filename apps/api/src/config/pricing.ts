// Single source of truth for pricing. KES is canonical (the primary market);
// USD amounts for Stripe/PayPal are derived from it so a price change only
// needs to happen in one place. Amounts are in whole units (not cents) —
// each provider's service layer handles subunit conversion itself.
export const SUBSCRIPTION_PRICING_KES: Record<'MONTHLY' | 'YEARLY' | 'LIFETIME', number> = {
  MONTHLY: 300,
  YEARLY: 2500,
  LIFETIME: 6000,
};

// Approximate KES → USD rate for international card payments. In production
// this should be refreshed periodically from a forex API rather than hardcoded;
// flagged here as a clear extension point.
const KES_TO_USD_RATE = 0.0077;

export const kesToUsd = (amountKes: number): number => {
  return Math.max(1, Math.round(amountKes * KES_TO_USD_RATE * 100) / 100);
};

export const getSubscriptionPriceKes = (plan: 'MONTHLY' | 'YEARLY' | 'LIFETIME'): number => {
  return SUBSCRIPTION_PRICING_KES[plan];
};

export const applyDiscount = (amountKes: number, discountPercent: number): number => {
  const discounted = amountKes - Math.round((amountKes * discountPercent) / 100);
  return Math.max(0, discounted);
};
