/**
 * One-time reconciliation after switching AI_LAYER_MODE full -> reasoning_only.
 *
 * The scheduled generate-predictions job only writes fixtures that have no
 * prediction row yet, so existing pending picks made under "full" keep the AI's
 * market/selection/confidence adjustments. This resets every pending, non-
 * manual pick to its stored base-model values (market, selection, confidence,
 * derived odds) and clears the adjustment flags - exactly what reviewFixtures-
 * WithMode(reasoning_only) would have produced - while keeping the AI-written
 * `reasoning` text. No deletes, no regeneration, no API calls.
 *
 *   npx tsx scripts/reconcile-reasoning-only.ts          # apply
 *   npx tsx scripts/reconcile-reasoning-only.ts --dry     # preview only
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { SettledStatus } from "../src/generated/prisma/enums";
import { prisma } from "../src/lib/db/prisma";

const CONFIDENCE_DISPLAY_CAP = 92;
const DRY = process.argv.includes("--dry");

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

(async () => {
  const rows = await prisma.prediction.findMany({
    where: {
      settledAs: SettledStatus.PENDING,
      isManualOverride: false,
      baseMarket: { not: null },
      baseSelection: { not: null },
      baseConfidence: { not: null },
    },
    select: {
      id: true,
      market: true,
      selection: true,
      confidence: true,
      odds: true,
      aiAdjusted: true,
      baseMarket: true,
      baseSelection: true,
      baseConfidence: true,
      fixture: { select: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
    },
  });

  let changed = 0;
  for (const r of rows) {
    const conf = Math.min(r.baseConfidence as number, CONFIDENCE_DISPLAY_CAP);
    const odds = round2(1 / (conf / 100));
    const needs =
      r.market !== r.baseMarket ||
      r.selection !== r.baseSelection ||
      r.confidence !== conf ||
      Number(r.odds) !== odds ||
      r.aiAdjusted;

    if (!needs) continue;
    changed++;
    const label = `${r.fixture.homeTeam.name} v ${r.fixture.awayTeam.name}`;
    console.log(
      `${DRY ? "[dry] " : ""}${label}: ${r.market}/${r.selection}/${r.confidence} -> ${r.baseMarket}/${r.baseSelection}/${conf}`,
    );

    if (!DRY) {
      await prisma.prediction.update({
        where: { id: r.id },
        data: {
          // non-null: the where clause filters baseMarket / baseSelection / baseConfidence
          market: r.baseMarket as NonNullable<typeof r.baseMarket>,
          selection: r.baseSelection as string,
          confidence: conf,
          odds,
          aiAdjusted: false,
          adjustmentReason: null,
        },
      });
    }
  }

  console.log(
    `\n${DRY ? "would change" : "changed"} ${changed} of ${rows.length} eligible pending predictions.`,
  );
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
