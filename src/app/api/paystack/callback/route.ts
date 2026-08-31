import { NextResponse } from "next/server";
import { isPlan } from "@/lib/plans.config";
import { PLANS } from "@/lib/plans.config";
import { verifyTransaction } from "@/lib/paystack/client";
import { activateSubscription } from "@/lib/subscriptions/activate";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Where Paystack sends the buyer's browser after checkout (?reference=...).
 * We re-verify the transaction server-side against Paystack - the query string
 * is not trusted - then create the Subscription (idempotent with the webhook).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");

  if (!reference) {
    // Not a real Paystack redirect - it always carries reference/trxref.
    return NextResponse.redirect(absoluteUrl("/vip?checkout=unavailable"));
  }

  try {
    const txn = await verifyTransaction(reference);

    if (txn.status !== "success") {
      return NextResponse.redirect(absoluteUrl("/vip?checkout=failed"));
    }

    const userId = typeof txn.metadata?.userId === "string" ? txn.metadata.userId : null;
    const planRaw = typeof txn.metadata?.plan === "string" ? txn.metadata.plan : null;

    if (!userId || !planRaw || !isPlan(planRaw)) {
      console.error(`[paystack:callback] ${reference} verified but metadata is missing/invalid`, txn.metadata);
      return NextResponse.redirect(absoluteUrl("/vip?checkout=error"));
    }

    // Guard against a tampered amount - the plan must have been paid in full.
    if (txn.amountKobo < PLANS[planRaw].priceKobo) {
      console.error(`[paystack:callback] ${reference} underpaid: got ${txn.amountKobo}, expected ${PLANS[planRaw].priceKobo}`);
      return NextResponse.redirect(absoluteUrl("/vip?checkout=error"));
    }

    await activateSubscription({ reference, userId, plan: planRaw });
    return NextResponse.redirect(absoluteUrl("/premium?welcome=1"));
  } catch (err) {
    console.error(`[paystack:callback] ${reference} failed:`, err);
    return NextResponse.redirect(absoluteUrl("/vip?checkout=error"));
  }
}
