import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "../src/lib/db/prisma";
import { buildContextPacket, reviewFixtures } from "../src/lib/predictions/ai";
import type { ContextPacket } from "../src/lib/predictions/ai";
import { DEFAULT_CONFIDENCE_FLOOR, evaluateOutcome, predictFixture } from "../src/lib/predictions/model";
import type { FixtureInput, Market, MarketProbability } from "../src/lib/predictions/model";
import { buildH2h, buildTeamContextStats, computeLeaguePosition } from "./lib/context-from-history";
import { gatherBacktestCases, toMatchResults } from "./lib/historical-data";

const CONFIDENCE_FLOOR = DEFAULT_CONFIDENCE_FLOOR;

type Tally = { published: number; won: number; lost: number; void: number };
const newTally = (): Tally => ({ published: 0, won: 0, lost: 0, void: 0 });

function record(tally: Tally, market: Market, selection: string, actual: Parameters<typeof evaluateOutcome>[2], breakdown: Map<Market, { won: number; lost: number }>) {
  tally.published++;
  const outcome = evaluateOutcome(market, selection, actual);
  if (outcome === "WON") tally.won++;
  else if (outcome === "LOST") tally.lost++;
  else tally.void++;
  if (outcome !== "VOID") {
    const mb = breakdown.get(market) ?? { won: 0, lost: 0 };
    if (outcome === "WON") mb.won++;
    else mb.lost++;
    breakdown.set(market, mb);
  }
  return outcome;
}

function hitRate(t: Tally): string {
  const decided = t.won + t.lost;
  return decided > 0 ? `${((t.won / decided) * 100).toFixed(1)}% (${t.won}/${decided})` : "n/a";
}

async function main() {
  const cases = await gatherBacktestCases();

  const baseTally = newTally();
  const aiTally = newTally();
  const baseBreakdown = new Map<Market, { won: number; lost: number }>();
  const aiBreakdown = new Map<Market, { won: number; lost: number }>();
  let aiAdjustedCount = 0;
  let aiSkippedCount = 0;

  const reviewItems: { packet: ContextPacket; basePick: MarketProbability }[] = [];
  const evalContext: {
    leagueName: string;
    fixture: (typeof cases)[number]["fixture"];
    basePick: MarketProbability;
    baseConfidence: number;
  }[] = [];

  for (const { leagueName, fixture, homeHistory, awayHistory, seasonFixturesBeforeKickoff, league } of cases) {
    const input: FixtureInput = {
      home: { matches: toMatchResults(fixture.teams.home.id, homeHistory) },
      away: { matches: toMatchResults(fixture.teams.away.id, awayHistory) },
      league,
    };

    const base = predictFixture(input, CONFIDENCE_FLOOR);
    if (base.skip) continue;

    const actual = {
      homeGoals: fixture.goals.home ?? 0,
      awayGoals: fixture.goals.away ?? 0,
      htHomeGoals: fixture.score.halftime.home ?? undefined,
      htAwayGoals: fixture.score.halftime.away ?? undefined,
    };
    record(baseTally, base.topPick.market, base.topPick.selection, actual, baseBreakdown);

    const homeStats = buildTeamContextStats(fixture.teams.home.id, homeHistory, fixture.fixture.date);
    const awayStats = buildTeamContextStats(fixture.teams.away.id, awayHistory, fixture.fixture.date);
    homeStats.leaguePosition = computeLeaguePosition(fixture.teams.home.id, seasonFixturesBeforeKickoff);
    awayStats.leaguePosition = computeLeaguePosition(fixture.teams.away.id, seasonFixturesBeforeKickoff);

    const packet = buildContextPacket({
      fixture: {
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        league: leagueName,
        kickoffUtc: fixture.fixture.date,
        venue: fixture.fixture.venue.name,
      },
      baseModel: { expectedGoals: base.expectedGoals, markets: base.markets, topPick: base.topPick },
      homeTeam: homeStats,
      awayTeam: awayStats,
      h2h: buildH2h(fixture.teams.home.id, fixture.teams.away.id, homeHistory),
      injuries: { home: [], away: [] },
      context: { competition: "league", isDerby: false },
    });

    reviewItems.push({ packet, basePick: base.topPick });
    evalContext.push({ leagueName, fixture, basePick: base.topPick, baseConfidence: base.confidence });
  }

  console.log(`Reviewing ${reviewItems.length} fixtures with the AI layer (grouped calls)...`);
  const aiPicks = await reviewFixtures(reviewItems);

  const log: string[] = [];
  for (let i = 0; i < aiPicks.length; i++) {
    const pick = aiPicks[i];
    const { leagueName, fixture, basePick, baseConfidence } = evalContext[i];

    if (pick.skip) {
      aiSkippedCount++;
      continue;
    }
    if (pick.aiAdjusted) aiAdjustedCount++;

    const actual = {
      homeGoals: fixture.goals.home ?? 0,
      awayGoals: fixture.goals.away ?? 0,
      htHomeGoals: fixture.score.halftime.home ?? undefined,
      htAwayGoals: fixture.score.halftime.away ?? undefined,
    };
    const outcome = record(aiTally, pick.market, pick.selection, actual, aiBreakdown);

    const changed = pick.market !== basePick.market ? ` (was ${basePick.market} ${baseConfidence}%)` : "";
    log.push(
      `[${leagueName}] ${fixture.teams.home.name} ${fixture.goals.home}-${fixture.goals.away} ${fixture.teams.away.name} | ` +
        `ai=${pick.market} (${pick.selection}) conf=${pick.confidence}%${changed} -> ${outcome}`,
    );
  }

  console.log(log.join("\n"));

  console.log("\n=== Base model vs AI-adjusted (same fixtures) ===");
  console.log(`Base:  published=${baseTally.published} won=${baseTally.won} lost=${baseTally.lost} void=${baseTally.void}  hit rate ${hitRate(baseTally)}`);
  console.log(`AI:    published=${aiTally.published} won=${aiTally.won} lost=${aiTally.lost} void=${aiTally.void}  hit rate ${hitRate(aiTally)}`);
  console.log(`AI adjusted the pick on ${aiAdjustedCount}/${reviewItems.length} fixtures; AI chose to skip ${aiSkippedCount}.`);

  console.log("\nBase, by market:");
  for (const [m, { won, lost }] of baseBreakdown) console.log(`  ${m}: ${won}/${won + lost}`);
  console.log("AI, by market:");
  for (const [m, { won, lost }] of aiBreakdown) console.log(`  ${m}: ${won}/${won + lost}`);
}

main().finally(() => prisma.$disconnect());
