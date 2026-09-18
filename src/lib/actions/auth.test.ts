import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    verificationToken: { updateMany: vi.fn(), create: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));
vi.mock("@/lib/email/resend", () => ({ sendEmail: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { registerUser } from "./auth";

const mockedPrisma = vi.mocked(prisma, { partial: true, deep: true });

function makeP2002Error(): Prisma.PrismaClientKnownRequestError {
  // Built via the prototype rather than the real constructor, which needs
  // version-specific internal args this test shouldn't need to know about -
  // `instanceof` only cares about the prototype chain.
  const err = Object.create(Prisma.PrismaClientKnownRequestError.prototype);
  err.code = "P2002";
  err.message = "Unique constraint failed on the fields: (`email`)";
  return err;
}

const validInput = { email: "New.User@Example.com", password: "password123", confirm: "password123" };

beforeEach(() => {
  vi.clearAllMocks();
  // Rate limiter allowed by default.
  mockedPrisma.$queryRaw.mockResolvedValue([{ count: 1, windowStart: new Date() }]);
  mockedPrisma.verificationToken.updateMany.mockResolvedValue({ count: 0 });
  mockedPrisma.verificationToken.create.mockResolvedValue({} as never);
});

describe("registerUser validation (no DB touched)", () => {
  it("rejects an invalid email", async () => {
    const result = await registerUser({ ...validInput, email: "not-an-email" });
    expect(result.ok).toBe(false);
    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than the minimum", async () => {
    const result = await registerUser({ ...validInput, password: "short", confirm: "short" });
    expect(result.ok).toBe(false);
  });

  it("rejects a password longer than the maximum", async () => {
    const long = "a".repeat(73);
    const result = await registerUser({ ...validInput, password: long, confirm: long });
    expect(result.ok).toBe(false);
  });

  it("rejects mismatched password/confirm", async () => {
    const result = await registerUser({ ...validInput, confirm: "something-else123" });
    expect(result.ok).toBe(false);
  });
});

describe("registerUser happy path", () => {
  it("lowercases the email, hashes the password, and creates the user", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({ id: "user_1", email: "new.user@example.com" } as never);

    const result = await registerUser(validInput);

    expect(result).toEqual({ ok: true });
    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "new.user@example.com" },
      select: { id: true },
    });
    const createArg = mockedPrisma.user.create.mock.calls[0]![0];
    expect(createArg.data.email).toBe("new.user@example.com");
    expect(createArg.data.passwordHash).not.toBe(validInput.password);
  });
});

describe("registerUser duplicate handling", () => {
  it("returns a friendly error when findUnique already sees the email", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "existing" } as never);

    const result = await registerUser(validInput);

    expect(result.ok).toBe(false);
    expect(mockedPrisma.user.create).not.toHaveBeenCalled();
  });

  it("catches a P2002 race (findUnique missed it, create hit the unique constraint)", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockRejectedValue(makeP2002Error());

    const result = await registerUser(validInput);

    expect(result).toEqual({ ok: false, error: "An account with that email already exists — sign in instead." });
  });

  it("re-throws non-P2002 errors instead of swallowing them", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockRejectedValue(new Error("connection reset"));

    await expect(registerUser(validInput)).rejects.toThrow("connection reset");
  });
});
