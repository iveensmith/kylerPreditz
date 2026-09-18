import { describe, expect, it } from "vitest";
import { RATE_LIMITS } from "./rate-limit";

// The atomic upsert SQL in checkRateLimit() needs a real Postgres connection
// (same as the ApiRateLimitWindow pattern it mirrors, which also has no
// DB-integration test in this repo) - covered by manual/staging testing
// instead. This just locks in the threshold config itself.
describe("RATE_LIMITS", () => {
  it("has a config for every auth endpoint that needs throttling", () => {
    expect(Object.keys(RATE_LIMITS).sort()).toEqual(
      ["login", "password-reset", "register", "resend-verification"].sort(),
    );
  });

  it("login allows 5 attempts per 15 minutes", () => {
    expect(RATE_LIMITS.login).toEqual({ max: 5, windowMs: 15 * 60_000 });
  });

  it("register allows 10 attempts per hour", () => {
    expect(RATE_LIMITS.register).toEqual({ max: 10, windowMs: 60 * 60_000 });
  });

  it("password-reset and resend-verification each allow 3 attempts per hour", () => {
    expect(RATE_LIMITS["password-reset"]).toEqual({ max: 3, windowMs: 60 * 60_000 });
    expect(RATE_LIMITS["resend-verification"]).toEqual({ max: 3, windowMs: 60 * 60_000 });
  });
});
