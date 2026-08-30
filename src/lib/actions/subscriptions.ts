"use server";

import { revalidatePath } from "next/cache";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const PLAN_DAYS: Record<SubscriptionPlan, number> = {
  WEEKLY: 7,
  MONTHLY: 30,
  LIFETIME: 3650,
};

/**
 * Admin-only: grants an active subscription to an existing user by email. A
 * stand-in until Paystack checkout (Phase 7.3) exists - used to test the
 * subscriber-only /premium view. The paystackRef is a synthetic marker.
 */
export async function grantTestSubscription(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const plan = String(formData.get("plan") ?? "") as SubscriptionPlan;
  if (!email) throw new Error("Email is required");
  if (!(plan in PLAN_DAYS)) throw new Error("Pick a valid plan");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user account with email ${email}`);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + PLAN_DAYS[plan] * 24 * 60 * 60 * 1000);

  await prisma.subscription.create({
    data: {
      userId: user.id,
      plan,
      status: SubscriptionStatus.ACTIVE,
      startsAt: now,
      expiresAt,
      paystackRef: `admin-grant-${user.id}-${now.getTime()}`,
    },
  });

  revalidatePath("/admin/subscribers");
}

/** Admin-only: marks a subscription cancelled (does not delete the row). */
export async function revokeSubscription(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Subscription id is required");
  await prisma.subscription.update({
    where: { id },
    data: { status: SubscriptionStatus.CANCELLED },
  });
  revalidatePath("/admin/subscribers");
}
