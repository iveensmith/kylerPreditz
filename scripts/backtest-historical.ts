import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "../src/lib/db/prisma";
import { DEFAULT_CONFIDENCE_FLOOR, evaluateOutcome, predictFixture } from "../src/lib/predictions/model";
import type { FixtureInput, Market } from "../src/lib/predictions/model";
import { gatherBacktestCases, toMatchResults } from "./lib/historical-data";

const CONFIDENCE_FLOOR = DEFAULT_CONFIDENCE_FLOOR;

async function main() {
  const summary = { published: 0, won: 0, lost: 0, void: 0, skipped: 0 };
  const marketBreakdown = new Map<Market, { won: number; lost: number }>();
  const log: string[] = [];

  const cases = await gatherBacktestCases();

  for (const { leagueName, fixture, homeHistory, awayHistory, league } of cases) {
    const input: FixtureInput = {
      home: { matches: toMatchResults(fixture.teams.home.id, homeHistory) },
      away: { matches: toMatchResults(fixture.teams.away.id, awayHistory) },
      league,
    };

    const result = predictFixture(input, CONFIDENCE_FLOOR);
    if (result.skip) {
      summary.skipped++;
      continue;
    }

    summary.published++;
    const outcome = evaluateOutcome(result.topPick.market, result.topPick.selection, {
      homeGoals: fixture.goals.home ?? 0,
      awayGoals: fixture.goals.away ?? 0,
      htHomeGoals: fixture.score.halftime.home ?? undefined,
      htAwayGoals: fixture.score.halftime.away ?? undefined,
    });

    if (outcome === "WON") summary.won++;
    else if (outcome === "LOST") summary.lost++;
    else summary.void++;

    if (outcome !== "VOID") {
      const mb = marketBreakdown.get(result.topPick.market) ?? { won: 0, lost: 0 };
      if (outcome === "WON") mb.won++;
      else mb.lost++;
      marketBreakdown.set(result.topPick.market, mb);
    }

    log.push(
      `[${leagueName}] ${fixture.teams.home.name} ${fixture.goals.home}-${fixture.goals.away} ${fixture.teams.away.name} | ` +
        `tip=${result.topPick.market} (${result.topPick.selection}) conf=${result.confidence}% -> ${outcome}`,
    );
  }

  console.log(log.join("\n"));

  const decided = summary.won + summary.lost;
  const hitRate = decided > 0 ? (summary.won / decided) * 100 : 0;

  console.log("\n=== Backtest summary (season 2023, 5 leagues) ===");
  console.log(summary);
  console.log(`Hit rate (WON / (WON+LOST), excluding VOID/skipped): ${hitRate.toFixed(1)}% (${summary.won}/${decided})`);
  console.log("\nBy market:");
  for (const [market, { won, lost }] of marketBreakdown) {
    const n = won + lost;
    console.log(`  ${market}: ${won}/${n} (${((won / n) * 100).toFixed(0)}%)`);
  }
}

main().finally(() => prisma.$disconnect());
