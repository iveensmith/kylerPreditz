import bcrypt from "bcryptjs";

// Shared by registration, the password-reset confirm action, and
// scripts/create-admin.ts so the cost factor and length policy only live in
// one place.
export const SALT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 8;
// bcrypt only looks at the first 72 bytes of input - anything past that is
// silently ignored, which would otherwise let someone believe a 200-char
// password is fully honored when only a prefix of it actually matters.
export const MAX_PASSWORD_LENGTH = 72;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
