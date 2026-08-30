import { SubscriptionPlan } from "@/generated/prisma/enums";

export type PlanConfig = {
  plan: SubscriptionPlan;
  label: string;
  /** Price in whole naira, for display. */
  priceNaira: number;
  /** Price in kobo, what Paystack's API expects. */
  priceKobo: number;
  /** Access length in days; null = never expires (lifetime). */
  durationDays: number | null;
  blurb: string;
};

// Lifetime rows still need a concrete expiresAt (the column is non-null); this
// is "effectively forever" and stays comfortably inside a JS Date.
export const LIFETIME_EXPIRES_AT = new Date("2099-12-31T00:00:00.000Z");

export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  WEEKLY: {
    plan: "WEEKLY",
    label: "Weekly",
    priceNaira: 3000,
    priceKobo: 300_000,
    durationDays: 7,
    blurb: "Seven days of Premium picks. Good for trying it out.",
  },
  MONTHLY: {
    plan: "MONTHLY",
    label: "Monthly",
    priceNaira: 10_000,
    priceKobo: 1_000_000,
    durationDays: 30,
    blurb: "A full month of Premium picks — the usual choice.",
  },
  LIFETIME: {
    plan: "LIFETIME",
    label: "Lifetime",
    priceNaira: 50_000,
    priceKobo: 5_000_000,
    durationDays: null,
    blurb: "One payment, Premium picks for good.",
  },
};

export const PLAN_LIST: PlanConfig[] = [PLANS.WEEKLY, PLANS.MONTHLY, PLANS.LIFETIME];

export function isPlan(value: string): value is SubscriptionPlan {
  return value === "WEEKLY" || value === "MONTHLY" || value === "LIFETIME";
}

/** ₦3,000 */
export function formatNaira(naira: number): string {
  return `₦${naira.toLocaleString("en-NG")}`;
}

/** startsAt/expiresAt for a freshly-paid subscription of this plan. */
export function subscriptionWindow(plan: SubscriptionPlan, from = new Date()): { startsAt: Date; expiresAt: Date } {
  const { durationDays } = PLANS[plan];
  return {
    startsAt: from,
    expiresAt: durationDays === null ? LIFETIME_EXPIRES_AT : new Date(from.getTime() + durationDays * 24 * 60 * 60 * 1000),
  };
}
