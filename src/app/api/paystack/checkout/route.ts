import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isPlan, PLANS } from "@/lib/plans.config";
import { initTransaction } from "@/lib/paystack/client";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Starts a Paystack checkout for the signed-in user and 303s to the hosted
 * payment page. A Route Handler (not a Server Action) so the redirect to an
 * external URL is a plain HTTP redirect the browser always follows.
 *
 * No DB write happens here - the Subscription row is created only after the
 * payment is verified (/api/paystack/callback + /api/paystack/webhook).
 */
export async function GET(request: Request) {
  const planRaw = new URL(request.url).searchParams.get("plan") ?? "";
  if (!isPlan(planRaw)) {
    return NextResponse.redirect(absoluteUrl("/vip?checkout=unavailable"));
  }
  const plan = PLANS[planRaw];

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(absoluteUrl("/login?next=/vip"));
  }
  const userId = session.user.id;

  // Email from the DB, not the session - the JWT can hold a stale address.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      subscriptions: {
        where: { status: SubscriptionStatus.ACTIVE, plan: "LIFETIME" },
        select: { id: true },
      },
    },
  });
  if (!user?.email) {
    return NextResponse.redirect(absoluteUrl("/vip?checkout=unavailable"));
  }
  if (user.subscriptions.length > 0) {
    return NextResponse.redirect(absoluteUrl("/premium")); // lifetime member
  }

  const reference = `up-${userId}-${Date.now()}-${randomUUID().slice(0, 8)}`;

  try {
    const { authorizationUrl } = await initTransaction({
      email: user.email,
      amountKobo: plan.priceKobo,
      reference,
      callbackUrl: absoluteUrl("/api/paystack/callback"),
      metadata: {
        userId,
        plan: plan.plan,
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: plan.label },
          { display_name: "Account", variable_name: "email", value: user.email },
        ],
      },
    });
    return NextResponse.redirect(authorizationUrl);
  } catch (err) {
    console.error(`[checkout] initTransaction failed for ${userId} / ${plan.plan}:`, err);
    return NextResponse.redirect(absoluteUrl("/vip?checkout=unavailable"));
  }
}
