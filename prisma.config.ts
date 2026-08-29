import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Secrets live in .env.local per project convention (see CLAUDE.md), not .env.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prefer a direct (unpooled) connection for migrations when one is provided -
    // `prisma migrate deploy` (run from the build script) can stall on a pgBouncer
    // pooler. Falls back to DATABASE_URL when DIRECT_URL is unset.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
