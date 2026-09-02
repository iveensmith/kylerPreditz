import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "@/lib/db/prisma";

/**
 * EXPLAIN (ANALYZE, BUFFERS) for the queries that filter/search by a specific
 * column - team recent-form lookups, market-coverage groupBy, the premium gate.
 * Used to check index coverage; re-run after a schema change to compare plans.
 *
 *   npx tsx scripts/explain-hot-queries.ts
 *
 * Read-only (EXPLAIN ANALYZE does execute the SELECTs, but writes nothing).
 */

async function ex(label: string, sql: string, params: unknown[] = []) {
  console.log("\n=== " + label + " ===");
  try {
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, string>>>(
      "EXPLAIN (ANALYZE, BUFFERS, SUMMARY OFF) " + sql,
      ...params,
    );
    for (const r of rows) console.log("  " + r["QUERY PLAN"]);
  } catch (e) {
    console.log("  ERROR: " + (e as Error).message);
  }
}

async function main() {
  const sizes = await prisma.$queryRawUnsafe<Array<{ relname: string; n: number }>>(`
    SELECT relname::text AS relname, n_live_tup::int AS n FROM pg_stat_user_tables
    WHERE relname IN ('Fixture','Prediction','Subscription','TeamStats','Standing','Team','Post','User')
    ORDER BY n_live_tup DESC`);
  console.log("ROW COUNTS:");
  for (const s of sizes) console.log(`  ${s.relname.padEnd(14)} ${s.n}`);

  const idx = await prisma.$queryRawUnsafe<Array<{ indexdef: string }>>(`
    SELECT indexdef::text AS indexdef FROM pg_indexes
    WHERE schemaname='public' AND tablename IN ('Fixture','Prediction','Subscription')
    ORDER BY tablename, indexname`);
  console.log("\nEXISTING INDEXES (Fixture / Prediction / Subscription):");
  for (const i of idx) console.log("  " + i.indexdef);

  const team = await prisma.team.findFirst({ where: { league: { slug: "premier-league" } } });
  if (!team) throw new Error("no premier-league team found");
  console.log(`\nsample teamId = ${team.id} (${team.name})`);

  await ex(
    "Fixture: single-team recent form (LIMIT 20)",
    `SELECT * FROM "Fixture"
     WHERE "status" = 'FINISHED' AND "homeScore" IS NOT NULL AND "awayScore" IS NOT NULL
       AND ("homeTeamId" = $1 OR "awayTeamId" = $1)
     ORDER BY "kickoffUtc" DESC LIMIT 20`,
    [team.id],
  );

  const teams = await prisma.team.findMany({
    where: { league: { isFeatured: true } }, select: { id: true },
  });
  const ids = teams.map((t) => t.id);
  console.log(`\nbatched over ${ids.length} featured-league teams`);

  await ex(
    "Fixture: batched recent form (homeTeamId/awayTeamId = ANY)",
    `SELECT "id","homeTeamId","awayTeamId","kickoffUtc","homeScore","awayScore"
     FROM "Fixture"
     WHERE "status" = 'FINISHED' AND "homeScore" IS NOT NULL AND "awayScore" IS NOT NULL
       AND ("homeTeamId" = ANY($1::text[]) OR "awayTeamId" = ANY($1::text[]))
     ORDER BY "kickoffUtc" DESC`,
    [ids],
  );

  await ex(
    "Prediction: market-coverage groupBy market over 7d fixture window",
    `SELECT p."market", count(*)
     FROM "Prediction" p
     JOIN "Fixture" f ON f."id" = p."fixtureId"
     WHERE p."market" = ANY($1::"PredictionMarket"[])
       AND f."kickoffUtc" >= now() AND f."kickoffUtc" <= now() + interval '7 days'
     GROUP BY p."market"`,
    [["OVER_1_5", "OVER_2_5", "BTTS_YES", "BTTS_NO", "DRAW", "HOME_WIN", "AWAY_WIN", "CORRECT_SCORE"]],
  );

  await ex(
    "Subscription: viewer premium check (userId + status + expiresAt)",
    `SELECT "expiresAt" FROM "Subscription"
     WHERE "userId" = $1 AND "status" = 'ACTIVE' AND "expiresAt" > now()
     ORDER BY "expiresAt" DESC LIMIT 1`,
    ["nonexistent"],
  );
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
