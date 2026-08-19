function parseBillingDay(value?: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 19;
  return Math.min(31, Math.max(1, Math.trunc(parsed)));
}

export const MONTHLY_BILLING_DAY = parseBillingDay(process.env.NEXT_PUBLIC_MONTHLY_BILLING_DAY);
