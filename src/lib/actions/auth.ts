"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { sendVerificationEmail } from "@/lib/actions/verify-email";

const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "The two passwords don't match.",
    path: ["confirm"],
  });

export type RegisterResult = { ok: true } | { ok: false; error: string };

/**
 * Creates a member account (role USER). The caller signs the user in afterwards
 * with the same credentials - this action just validates and persists.
 */
export async function registerUser(input: {
  email: string;
  password: string;
  confirm: string;
}): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { email, password } = parsed.data;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await checkRateLimit("register", ip);
  if (!allowed) {
    return { ok: false, error: "Too many signups from this network — try again later." };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, error: "An account with that email already exists — sign in instead." };
  }

  const passwordHash = await hashPassword(password);

  let userId: string;
  try {
    const user = await prisma.user.create({ data: { email, passwordHash, role: UserRole.USER } });
    userId = user.id;
  } catch (err) {
    // Closes the race between the findUnique check above and this create -
    // two concurrent requests for the same email can both pass the check.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "An account with that email already exists — sign in instead." };
    }
    throw err;
  }

  // Best-effort: a failed send shouldn't fail registration, the user can
  // request a new link from the dashboard.
  try {
    await sendVerificationEmail(userId);
  } catch (err) {
    console.error("[auth] failed to send verification email on registration:", err);
  }

  return { ok: true };
}
