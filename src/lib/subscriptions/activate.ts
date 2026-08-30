import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { PLANS, LIFETIME_EXPIRES_AT, subscriptionWindow } from "@/lib/plans.config";

/**
 * Turns a verified Paystack payment into a Subscription row. Idempotent: the
 * paystackRef column is unique, so a repeat call (webhook + callback both fire)
 * returns the existing row instead of erroring or double-crediting.
 *
 * If the user already has an active subscription, the new period is stacked on
 * top of the later of {now, current expiry} - a renewal extends rather than
 * resets. Lifetime always wins.
 */
export async function activateSubscription(params: {
  reference: string;
  userId: string;
  plan: SubscriptionPlan;
}): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.subscription.findUnique({ where: { paystackRef: params.reference } });
  if (existing) return { id: existing.id, created: false };

  const now = new Date();
  const currentActive = await prisma.subscription.findFirst({
    where: { userId: params.userId, status: SubscriptionStatus.ACTIVE, expiresAt: { gt: now } },
    orderBy: { expiresAt: "desc" },
    select: { expiresAt: true },
  });

  const startFrom = currentActive && currentActive.expiresAt > now ? currentActive.expiresAt : now;
  const { durationDays } = PLANS[params.plan];
  const expiresAt =
    durationDays === null
      ? LIFETIME_EXPIRES_AT
      : subscriptionWindow(params.plan, startFrom).expiresAt;

  const sub = await prisma.subscription.create({
    data: {
      userId: params.userId,
      plan: params.plan,
      status: SubscriptionStatus.ACTIVE,
      startsAt: now,
      expiresAt,
      paystackRef: params.reference,
    },
  });
  return { id: sub.id, created: true };
}
