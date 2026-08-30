import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paystack signs every webhook POST with HMAC-SHA512 of the raw request body,
 * keyed by your secret key, in the `x-paystack-signature` header.
 * https://paystack.com/docs/payments/webhooks/#verify-event-origin
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;

  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
