import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { generateToken, hashToken, isExpired } from "./tokens";

describe("generateToken / hashToken", () => {
  it("hash is a deterministic sha256 of the raw value", () => {
    const { raw, hash } = generateToken();
    expect(hash).toBe(createHash("sha256").update(raw).digest("hex"));
    expect(hashToken(raw)).toBe(hash);
  });

  it("raw token is 64 hex characters (32 random bytes)", () => {
    const { raw } = generateToken();
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces unique raw tokens across calls", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken().raw));
    expect(tokens.size).toBe(50);
  });
});

describe("isExpired", () => {
  it("is false for a future timestamp", () => {
    expect(isExpired(new Date(Date.now() + 60_000))).toBe(false);
  });

  it("is true for a past timestamp", () => {
    expect(isExpired(new Date(Date.now() - 1))).toBe(true);
  });

  it("is true exactly at the expiry instant", () => {
    const now = new Date();
    expect(isExpired(now)).toBe(true);
  });
});
