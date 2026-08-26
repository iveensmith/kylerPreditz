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
    url: process.env["DATABASE_URL"],
  },
});
