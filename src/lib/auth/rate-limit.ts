import { prisma } from "@/lib/db/prisma";

// Self-expiring: a locked-out caller just waits out the window, no separate
// unlock mechanism needed. Login is keyed by email (protects a specific
// account from credential stuffing regardless of source IP); registration is
// keyed by IP (mass account creation is an IP-shaped problem, not an
// email-shaped one - each attempt uses a different email); the two
// email-sending endpoints are keyed by email (the thing being protected is a
// specific inbox, not a specific caller).
export const RATE_LIMITS = {
  login: { max: 5, windowMs: 15 * 60_000 },
  register: { max: 10, windowMs: 60 * 60_000 },
  "password-reset": { max: 3, windowMs: 60 * 60_000 },
  "resend-verification": { max: 3, windowMs: 60 * 60_000 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

export type RateLimitResult = { allowed: boolean; retryAfterMs?: number };

/**
 * Atomic upsert on a single row per (bucket, key), same pattern as
 * ApiRateLimitWindow / throttleForRateLimit in src/lib/api-football/client.ts
 * (a per-minute counter shared across build/cron/serverless processes) -
 * except this denies once over budget instead of sleeping-and-retrying,
 * since an auth request must fail fast rather than stall.
 */
export async function checkRateLimit(bucket: RateLimitBucket, key: string): Promise<RateLimitResult> {
  const { max, windowMs } = RATE_LIMITS[bucket];
  const id = `${bucket}:${key}`;
  const windowSeconds = Math.ceil(windowMs / 1000);

  const [row] = await prisma.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "AuthRateLimit" (id, bucket, "windowStart", count)
    VALUES (${id}, ${bucket}, now(), 1)
    ON CONFLICT (id) DO UPDATE SET
      count = CASE
        WHEN "AuthRateLimit"."windowStart" <= now() - (interval '1 second' * ${windowSeconds}) THEN 1
        ELSE "AuthRateLimit".count + 1
      END,
      "windowStart" = CASE
        WHEN "AuthRateLimit"."windowStart" <= now() - (interval '1 second' * ${windowSeconds}) THEN now()
        ELSE "AuthRateLimit"."windowStart"
      END
    RETURNING count, "windowStart"
  `;

  if (row.count <= max) return { allowed: true };

  const elapsedMs = Date.now() - row.windowStart.getTime();
  return { allowed: false, retryAfterMs: Math.max(windowMs - elapsedMs, 0) };
}
