/**
 * Fails fast at import time rather than letting a missing/weak secret fall
 * through to an insecure default (e.g. NextAuth boots with a dev-only
 * fallback secret if NEXTAUTH_SECRET is unset).
 */
export function assertSecret(name: string, value: string | undefined, minLength = 32): string {
  if (!value || value.length < minLength) {
    throw new Error(`${name} is missing or too short (need >= ${minLength} chars). Set it in .env.local / Vercel env vars.`);
  }
  return value;
}
