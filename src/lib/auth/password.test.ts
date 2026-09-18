import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("round-trips: a hashed password verifies against the original", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects the wrong password against a real hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("salts each hash uniquely, but both still verify", async () => {
    const [a, b] = await Promise.all([hashPassword("same password"), hashPassword("same password")]);
    expect(a).not.toBe(b);
    expect(await verifyPassword("same password", a)).toBe(true);
    expect(await verifyPassword("same password", b)).toBe(true);
  });
});

describe("password length constants", () => {
  it("MIN_PASSWORD_LENGTH is 8", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it("MAX_PASSWORD_LENGTH matches bcrypt's real 72-byte limit", () => {
    expect(MAX_PASSWORD_LENGTH).toBe(72);
  });
});
