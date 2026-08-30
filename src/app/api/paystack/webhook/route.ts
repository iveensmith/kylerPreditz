import { NextResponse } from "next/server";
import { isPlan, PLANS } from "@/lib/plans.config";
import { verifyWebhookSignature } from "@/lib/paystack/webhook";
import { activateSubscription } from "@/lib/subscriptions/activate";

export const dynamic = "force-dynamic";

/**
 * Paystack server-to-server event feed. This is the reliable path: the buyer
 * might close the tab before the browser callback fires. Signature-verified,
 * and activateSubscription is idempotent so callback + webhook can both run.
 * Always 200 on a valid signature so Paystack doesn't retry events we ignore.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ ignored: event.event ?? "unknown" });
  }

  const data = event.data ?? {};
  const reference = typeof data.reference === "string" ? data.reference : null;
  const status = typeof data.status === "string" ? data.status : null;
  const amount = typeof data.amount === "number" ? data.amount : 0;
  const meta =
    data.metadata && typeof data.metadata === "object"
      ? (data.metadata as Record<string, unknown>)
      : null;
  const userId = typeof meta?.userId === "string" ? meta.userId : null;
  const planRaw = typeof meta?.plan === "string" ? meta.plan : null;

  if (status !== "success" || !reference || !userId || !planRaw || !isPlan(planRaw)) {
    console.error(`[paystack:webhook] charge.success ${reference ?? "?"} missing/invalid fields`, { status, meta });
    return NextResponse.json({ ok: false });
  }

  if (amount < PLANS[planRaw].priceKobo) {
    console.error(`[paystack:webhook] ${reference} underpaid: ${amount} < ${PLANS[planRaw].priceKobo}`);
    return NextResponse.json({ ok: false });
  }

  try {
    const { created } = await activateSubscription({ reference, userId, plan: planRaw });
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error(`[paystack:webhook] ${reference} activation failed:`, err);
    // 500 so Paystack retries - a transient DB error should not lose the payment.
    return new NextResponse("activation failed", { status: 500 });
  }
}
