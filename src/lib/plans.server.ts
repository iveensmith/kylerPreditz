import type { SubscriptionPlan } from "@/generated/prisma/enums";
import { PLANS, PLAN_LIST, type PlanConfig } from "@/lib/plans.config";
import { getSetting, setSetting } from "@/lib/site-settings";

const PRICES_KEY = "planPrices";
export const MIN_PRICE_NAIRA = 100;
export const MAX_PRICE_NAIRA = 10_000_000;

type PriceMap = Partial<Record<SubscriptionPlan, number>>;

function validPrice(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= MIN_PRICE_NAIRA && n <= MAX_PRICE_NAIRA;
}

async function readOverrides(): Promise<PriceMap> {
  try {
    const raw = await getSetting(PRICES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: PriceMap = {};
    for (const p of PLAN_LIST) if (validPrice(parsed[p.plan])) out[p.plan] = parsed[p.plan] as number;
    return out;
  } catch (e) {
    console.error("[plans] price override read failed, using defaults", e);
    return {};
  }
}

/** Plans with any admin-set prices applied over the defaults in plans.config.ts. */
export async function getPlans(): Promise<Record<SubscriptionPlan, PlanConfig>> {
  const o = await readOverrides();
  const withPrice = (p: PlanConfig): PlanConfig =>
    o[p.plan] ? { ...p, priceNaira: o[p.plan]!, priceKobo: o[p.plan]! * 100 } : p;
  return { WEEKLY: withPrice(PLANS.WEEKLY), MONTHLY: withPrice(PLANS.MONTHLY), LIFETIME: withPrice(PLANS.LIFETIME) };
}

export async function getPlanList(): Promise<PlanConfig[]> {
  const plans = await getPlans();
  return [plans.WEEKLY, plans.MONTHLY, plans.LIFETIME];
}

/**
 * Lowest amount (kobo) we accept as "paid in full" when verifying a Paystack charge. Checkout always
 * initiates at the current price, so this only guards tampering - and takes the lower of the built-in
 * and current price so a payment started before an admin price change is still honoured.
 */
export async function minAcceptableKobo(plan: SubscriptionPlan): Promise<number> {
  const current = (await getPlans())[plan].priceKobo;
  return Math.min(PLANS[plan].priceKobo, current);
}

export async function savePlanPrices(prices: Record<SubscriptionPlan, number>): Promise<void> {
  await setSetting(PRICES_KEY, JSON.stringify(prices));
}
