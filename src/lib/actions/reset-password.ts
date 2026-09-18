"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { generateToken, hashToken, isExpired } from "@/lib/auth/tokens";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { hashPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email/resend";
import { passwordResetEmail } from "@/lib/email/templates";
import { absoluteUrl } from "@/lib/seo";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour - short-lived, this is the highest-value token to steal

export type RequestResetResult = { ok: true };

/**
 * Always returns the same generic result whether or not the account exists,
 * and "spends" the rate-limit slot either way, so the endpoint's cost/timing
 * can't be used to enumerate accounts.
 */
export async function requestPasswordReset(rawEmail: string): Promise<RequestResetResult> {
  const email = rawEmail.trim().toLowerCase();
  const { allowed } = await checkRateLimit("password-reset", email);
  if (!allowed) return { ok: true };

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const { raw, hash } = generateToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    });

    const link = absoluteUrl(`/reset-password/confirm?token=${raw}`);
    const { subject, html } = passwordResetEmail(link);
    try {
      await sendEmail({ to: email, subject, html });
    } catch (err) {
      console.error("[auth] failed to send password reset email:", err);
    }
  }

  return { ok: true };
}

const confirmSchema = z
  .object({
    token: z.string().min(1),
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

export type ConfirmResetResult = { ok: true } | { ok: false; error: string };

export async function confirmPasswordReset(input: {
  token: string;
  password: string;
  confirm: string;
}): Promise<ConfirmResetResult> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.consumedAt || isExpired(record.expiresAt)) {
    return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    // Invalidate any other outstanding reset tokens for this user too, not
    // just the one that was used.
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
  ]);

  return { ok: true };
}
