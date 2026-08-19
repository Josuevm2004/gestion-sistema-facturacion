export const DEFAULT_MONTHLY_BILLING_DAY = 1;

function parseBillingDay(value?: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MONTHLY_BILLING_DAY;
  return Math.min(31, Math.max(1, Math.trunc(parsed)));
}

export const MONTHLY_BILLING_DAY = parseBillingDay(process.env.NEXT_PUBLIC_MONTHLY_BILLING_DAY);
