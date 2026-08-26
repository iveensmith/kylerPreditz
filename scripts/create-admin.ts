import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

const SALT_ROUNDS = 12;

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: npm run admin:create -- <email> <password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: UserRole.ADMIN },
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
