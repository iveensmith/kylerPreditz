import { config } from "dotenv";
config({ path: ".env.local" });

import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const force = process.argv.includes("--force");

  if (!email || !password) {
    console.error("Usage: npm run admin:create -- <email> <password> [--force]");
    process.exit(1);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing && !force) {
    console.error(
      `A user with that email already exists (role: ${existing.role}). Refusing to overwrite. Use --force to override.`,
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, passwordHash, role: UserRole.ADMIN, emailVerified: new Date() },
    update: { passwordHash, role: UserRole.ADMIN },
  });

  console.log(`Admin user ready: ${user.email} (id ${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
