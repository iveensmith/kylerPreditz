import { randomBytes, createHash } from "node:crypto";

/**
 * Verification/reset links carry the raw token; only its hash is ever
 * persisted (same principle as password hashing - if the DB leaks, the
 * tokens inside it shouldn't be directly usable).
 */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
