"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

const SALT_ROUNDS = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

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
  const email = input.email.trim().toLowerCase();
  const { password, confirm } = input;

  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < MIN_PASSWORD) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD} characters.` };
  }
  if (password !== confirm) return { ok: false, error: "The two passwords don't match." };

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, error: "An account with that email already exists — sign in instead." };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.create({ data: { email, passwordHash, role: UserRole.USER } });

  return { ok: true };
}
