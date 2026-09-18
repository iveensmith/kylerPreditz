"use server";

import { prisma } from "@/lib/db/prisma";
import { generateToken, hashToken, isExpired } from "@/lib/auth/tokens";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { sendEmail } from "@/lib/email/resend";
import { verificationEmail } from "@/lib/email/templates";
import { absoluteUrl } from "@/lib/seo";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/** Generates a fresh token for the user and emails the verification link. */
export async function sendVerificationEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  if (!user || user.emailVerified) return;

  // Invalidate prior outstanding tokens so an old emailed link stops working
  // once a new one is issued.
  await prisma.verificationToken.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const { raw, hash } = generateToken();
  await prisma.verificationToken.create({
    data: { userId, tokenHash: hash, expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS) },
  });

  const link = absoluteUrl(`/verify-email?token=${raw}`);
  const { subject, html } = verificationEmail(link);
  await sendEmail({ to: user.email, subject, html });
}

export type ResendResult = { ok: true };

/**
 * Always returns the same generic result regardless of whether the email
 * exists, is already verified, or is being rate-limited - none of that
 * should be distinguishable to the caller.
 */
export async function resendVerificationEmail(rawEmail: string): Promise<ResendResult> {
  const email = rawEmail.trim().toLowerCase();
  const { allowed } = await checkRateLimit("resend-verification", email);
  if (!allowed) return { ok: true };

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    try {
      await sendVerificationEmail(user.id);
    } catch (err) {
      console.error("[auth] failed to resend verification email:", err);
    }
  }
  return { ok: true };
}

export type ConfirmResult = { ok: true } | { ok: false; error: string };

export async function confirmVerification(rawToken: string): Promise<ConfirmResult> {
  if (!rawToken) return { ok: false, error: "Missing verification token." };

  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.consumedAt || isExpired(record.expiresAt)) {
    return { ok: false, error: "This verification link is invalid or has expired." };
  }

  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
  ]);

  return { ok: true };
}
