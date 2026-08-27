import { FixtureStatus, PredictionMarket } from "@/generated/prisma/enums";
import { ApiFootballQuotaExceededError } from "@/lib/api-football/client";
import { getCurrentSeason } from "@/lib/api-football/season";
import { seasonCalendarForApiId } from "@/lib/leagues.config";
import { prisma } from "@/lib/db/prisma";
import { buildContextPacket, buildFallbackPick, DEFAULT_AI_MODEL, reviewFixturesWithMode } from "@/lib/predictions/ai";
import type { AiLayerMode, ContextPacket } from "@/lib/predictions/ai";
import { buildH2hEntries, buildInjuries, buildTeamContextStats } from "@/lib/predictions/context-input";
import { buildTeamHistory, computeLeagueAverages } from "@/lib/predictions/history";
import { assignCoverageFills, getUncoveredMarketPages } from "@/lib/predictions/market-coverage";
import { DEFAULT_CONFIDENCE_FLOOR, MIN_MATCHES_REQUIRED, predictFixture, selectTopPick, type MarketProbability } from "@/lib/predictions/model";

const GENERATE_WINDOW_HOURS = 48;
const VALID_MODES: AiLayerMode[] = ["full", "reasoning_only", "off"];

function getAiLayerMode(): AiLayerMode {
  const raw = process.env.AI_LAYER_MODE;
  return VALID_MODES.includes(raw as AiLayerMode) ? (raw as AiLayerMode) : "full";
}

function getConfidenceFloor(): number {
  const raw = Number(process.env.CONFIDENCE_FLOOR);
  return Number.isFinite(raw) && raw > 0 && raw <= 100 ? raw / 100 : DEFAULT_CONFIDENCE_FLOOR;
}

export type GeneratePredictionsResult = {
  fixturesConsidered: number;
  predictionsPublished: number;
  skippedInsufficientHistory: number;
  skippedBelowFloor: number;
  /** Published specifically to give an otherwise-empty market page at least one live pick. */
  coverageFillsPublished: number;
  errors: string[];
};

/**
 * Stage 1 (statistical model) + stage 2 (AI review) for every fixture in the
 * next 48h that doesn't have a prediction yet. Fixtures the model can't
 * confidently pick are left without a Prediction row - an empty slot beats a
 * bad tip, per spec.
 *
 * Before the normal per-fixture top pick runs, a coverage pass (see
 * market-coverage.ts) checks every market-type page on the site for zero
 * live predictions and, where possible, dedicates one fixture to publish
 * its real (never fabricated) probability for that specific market instead
 * of its own natural best pick. Coverage fills skip AI review entirely -
 * the AI is otherwise free to change the published market away from the
 * base pick, which would silently undo the coverage guarantee.
 *
 * windowHours defaults to the normal 48h rolling window the scheduled job
 * always uses; only ever pass a wider value for a one-off manual run (e.g.
 * seeding initial market coverage against a bigger pool of fixtures).
 * maxFixtures caps how many candidates get processed (soonest kickoff
 * first) - each one means several sequential context-building calls, so an
 * unbounded wide-window run can take a very long time; leave unset for the
 * normal scheduled job, where the 48h window already keeps this small.
 */
export async function generatePredictions(
  options: { windowHours?: number; maxFixtures?: number } = {},
): Promise<GeneratePredictionsResult> {
  const { windowHours = GENERATE_WINDOW_HOURS, maxFixtures } = options;
  const result: GeneratePredictionsResult = {
    fixturesConsidered: 0,
    predictionsPublished: 0,
    skippedInsufficientHistory: 0,
    skippedBelowFloor: 0,
    coverageFillsPublished: 0,
    errors: [],
  };

  const windowEnd = new Date(Date.now() + windowHours * 60 * 60 * 1000);
  const fixtures = await prisma.fixture.findMany({
    where: {
      status: FixtureStatus.SCHEDULED,
      kickoffUtc: { gte: new Date(), lte: windowEnd },
      prediction: null,
    },
    orderBy: { kickoffUtc: "asc" },
    take: maxFixtures,
    include: { league: true, homeTeam: true, awayTeam: true },
  });
  result.fixturesConsidered = fixtures.length;
  if (fixtures.length === 0) return result;

  const floor = getConfidenceFloor();
  const leagueAveragesCache = new Map<string, Awaited<ReturnType<typeof computeLeagueAverages>>>();

  type Built = {
    fixtureId: string;
    markets: MarketProbability[];
    packet: ContextPacket;
  };
  const built: Built[] = [];

  try {
    for (const fixture of fixtures) {
      let leagueAverages = leagueAveragesCache.get(fixture.leagueId);
      if (!leagueAverages) {
        leagueAverages = await computeLeagueAverages({ leagueDbId: fixture.leagueId, leagueApiId: fixture.league.apiId });
        leagueAveragesCache.set(fixture.leagueId, leagueAverages);
      }

      const [homeMatches, awayMatches] = await Promise.all([
        buildTeamHistory({ teamDbId: fixture.homeTeamId, teamApiId: fixture.homeTeam.apiId, leagueApiId: fixture.league.apiId }),
        buildTeamHistory({ teamDbId: fixture.awayTeamId, teamApiId: fixture.awayTeam.apiId, leagueApiId: fixture.league.apiId }),
      ]);

      if (homeMatches.length < MIN_MATCHES_REQUIRED || awayMatches.length < MIN_MATCHES_REQUIRED) {
        result.skippedInsufficientHistory++;
        continue;
      }

      // floor=0 here so `markets` always has every market's real probability,
      // regardless of the site's confidence floor - the coverage pass below
      // needs the full picture to find candidates for under-covered markets.
      // skip is only ever true here for insufficient history, already
      // handled above, so this is never a `skip: true` result.
      const modelResult = predictFixture(
        { home: { matches: homeMatches }, away: { matches: awayMatches }, league: leagueAverages },
        0,
      );
      if (modelResult.skip) continue;

      const season = getCurrentSeason(fixture.kickoffUtc, seasonCalendarForApiId(fixture.league.apiId));
      const [homeStats, awayStats, h2h, injuries] = await Promise.all([
        buildTeamContextStats({ teamDbId: fixture.homeTeamId, leagueDbId: fixture.leagueId, season, kickoffUtc: fixture.kickoffUtc }),
        buildTeamContextStats({ teamDbId: fixture.awayTeamId, leagueDbId: fixture.leagueId, season, kickoffUtc: fixture.kickoffUtc }),
        buildH2hEntries(fixture.homeTeam.apiId, fixture.awayTeam.apiId),
        buildInjuries(fixture.league.apiId, season, fixture.homeTeam.apiId, fixture.awayTeam.apiId),
      ]);

      const packet = buildContextPacket({
        fixture: {
          home: fixture.homeTeam.name,
          away: fixture.awayTeam.name,
          league: fixture.league.name,
          kickoffUtc: fixture.kickoffUtc.toISOString(),
          venue: fixture.venue,
        },
        baseModel: { expectedGoals: modelResult.expectedGoals, markets: modelResult.markets, topPick: modelResult.topPick },
        homeTeam: homeStats,
        awayTeam: awayStats,
        h2h,
        injuries,
        context: { competition: "league", isDerby: false },
      });

      built.push({ fixtureId: fixture.id, markets: modelResult.markets, packet });
    }
  } catch (err) {
    if (err instanceof ApiFootballQuotaExceededError) {
      result.errors.push("quota exhausted while building context packets, stopping this run");
    } else {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  if (built.length === 0) return result;

  const uncoveredPages = await getUncoveredMarketPages();
  const fills = assignCoverageFills(
    built.map((b) => ({ fixtureId: b.fixtureId, markets: b.markets })),
    uncoveredPages,
  );
  const fillByFixtureId = new Map(fills.map((f) => [f.fixtureId, f.market]));

  type Prepared = {
    fixtureId: string;
    basePick: MarketProbability;
    baseConfidence: number;
    baseOdds: number;
    packet: ContextPacket;
  };
  const prepared: Prepared[] = [];

  for (const item of built) {
    const fill = fillByFixtureId.get(item.fixtureId);
    if (fill) {
      const pick = buildFallbackPick(fill, item.packet);
      const odds = Math.round((1 / (pick.confidence / 100)) * 100) / 100;
      try {
        await prisma.prediction.create({
          data: {
            fixtureId: item.fixtureId,
            market: pick.market as PredictionMarket,
            selection: pick.selection,
            odds,
            confidence: pick.confidence,
            reasoning: pick.reasoning,
            baseMarket: pick.market as PredictionMarket,
            baseSelection: pick.selection,
            baseConfidence: pick.confidence,
            allMarkets: item.packet.baseModel.markets,
            expectedGoalsHome: item.packet.baseModel.expectedGoals.home,
            expectedGoalsAway: item.packet.baseModel.expectedGoals.away,
            aiAdjusted: false,
            adjustmentReason: null,
            aiModel: null,
            generatedAt: new Date(),
          },
        });
        result.coverageFillsPublished++;
        result.predictionsPublished++;
      } catch (err) {
        result.errors.push(`fixture ${item.fixtureId}: ${err instanceof Error ? err.message : String(err)}`);
      }
      continue;
    }

    const topPick = selectTopPick(item.markets, floor);
    if (!topPick) {
      result.skippedBelowFloor++;
      continue;
    }
    prepared.push({
      fixtureId: item.fixtureId,
      basePick: topPick,
      baseConfidence: Math.round(topPick.probability * 100),
      baseOdds: Math.round((1 / topPick.probability) * 100) / 100,
      packet: item.packet,
    });
  }

  if (prepared.length === 0) return result;

  const mode = getAiLayerMode();
  const picks = await reviewFixturesWithMode(
    prepared.map((p) => ({ packet: p.packet, basePick: p.basePick })),
    mode,
  );

  const aiModel = mode === "off" ? null : process.env.AI_MODEL || DEFAULT_AI_MODEL;

  for (let i = 0; i < prepared.length; i++) {
    const pick = picks[i];
    const base = prepared[i];
    if (pick.skip) continue;

    const odds = Math.round((1 / (pick.confidence / 100)) * 100) / 100;
    try {
      await prisma.prediction.create({
        data: {
          fixtureId: base.fixtureId,
          market: pick.market as PredictionMarket,
          selection: pick.selection,
          odds,
          confidence: pick.confidence,
          reasoning: pick.reasoning,
          baseMarket: base.basePick.market as PredictionMarket,
          baseSelection: base.basePick.selection,
          baseConfidence: base.baseConfidence,
          allMarkets: base.packet.baseModel.markets,
          expectedGoalsHome: base.packet.baseModel.expectedGoals.home,
          expectedGoalsAway: base.packet.baseModel.expectedGoals.away,
          aiAdjusted: pick.aiAdjusted,
          adjustmentReason: pick.adjustmentReason,
          aiModel,
          generatedAt: new Date(),
        },
      });
      result.predictionsPublished++;
    } catch (err) {
      result.errors.push(`fixture ${base.fixtureId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
