import { existsSync, rmSync, cpSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Prisma 7's WASM query compiler needs a different loading strategy per
 * target (see prisma/schema.prisma's generator comment and
 * https://github.com/prisma/prisma/issues/28657) - `prisma generate` produces
 * two separate client outputs, and this script copies whichever one the
 * current build needs into the stable `src/generated/prisma` path that
 * `src/lib/db/prisma.ts` imports from (`@/generated/prisma`).
 *
 *   npx tsx scripts/select-prisma-client.ts node      # local dev, tests, scripts (default)
 *   npx tsx scripts/select-prisma-client.ts workerd   # Cloudflare Workers build only
 */
const target = process.argv[2];
if (target !== "node" && target !== "workerd") {
  console.error('Usage: tsx scripts/select-prisma-client.ts <node|workerd>');
  process.exit(1);
}

const root = resolve(__dirname, "..");
const src = resolve(root, "src/generated", target === "node" ? "prisma-node" : "prisma-workerd");
const dest = resolve(root, "src/generated/prisma");

if (!existsSync(src)) {
  console.error(`${src} does not exist - run \`npx prisma generate\` first.`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`Prisma client: using "${target}" build at src/generated/prisma`);
