/**
 * Thin Paystack REST wrapper. Direct fetch (no SDK) against api.paystack.co,
 * authed with PAYSTACK_SECRET_KEY. Only the two calls the checkout flow needs:
 * initialize a transaction, and verify one by reference.
 * Docs: https://paystack.com/docs/api/transaction/
 */
const BASE_URL = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

type PaystackEnvelope<T> = { status: boolean; message: string; data: T };

async function paystackFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    // never cache a payment call
    cache: "no-store",
  });

  const body = (await res.json().catch(() => null)) as PaystackEnvelope<T> | null;
  if (!res.ok || !body?.status) {
    throw new Error(`Paystack ${path} failed (${res.status}): ${body?.message ?? "unknown error"}`);
  }
  return body.data;
}

export type InitTransactionInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
};

export type InitTransactionResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export async function initTransaction(input: InitTransactionInput): Promise<InitTransactionResult> {
  const data = await paystackFetch<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    },
  );
  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}

export type VerifiedTransaction = {
  status: string; // "success" | "failed" | "abandoned" | ...
  reference: string;
  amountKobo: number;
  currency: string;
  customerEmail: string | null;
  metadata: Record<string, unknown> | null;
  paidAt: string | null;
};

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const data = await paystackFetch<{
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string | null;
    customer?: { email?: string | null } | null;
    metadata?: Record<string, unknown> | string | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });

  return {
    status: data.status,
    reference: data.reference,
    amountKobo: data.amount,
    currency: data.currency,
    customerEmail: data.customer?.email ?? null,
    // Paystack sometimes returns metadata as a JSON string.
    metadata:
      typeof data.metadata === "string"
        ? safeParse(data.metadata)
        : (data.metadata ?? null),
    paidAt: data.paid_at ?? null,
  };
}

function safeParse(s: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
