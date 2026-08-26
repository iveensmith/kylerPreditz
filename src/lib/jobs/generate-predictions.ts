import { FixtureStatus, PredictionMarket } from "@/generated/prisma/enums";
import { ApiFootballQuotaExceededError } from "@/lib/api-football/client";
import { getCurrentSeason } from "@/lib/api-football/season";
import { seasonCalendarForApiId } from "@/lib/leagues.config";
import { prisma } from "@/lib/db/prisma";
import { buildContextPacket, DEFAULT_AI_MODEL, reviewFixturesWithMode } from "@/lib/predictions/ai";
import type { AiLayerMode, ContextPacket } from "@/lib/predictions/ai";
import { buildH2hEntries, buildInjuries, buildTeamContextStats } from "@/lib/predictions/context-input";
import { buildTeamHistory, computeLeagueAverages } from "@/lib/predictions/history";
import { DEFAULT_CONFIDENCE_FLOOR, MIN_MATCHES_REQUIRED, predictFixture, type MarketProbability } from "@/lib/predictions/model";

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
  errors: string[];
};

/**
 * Stage 1 (statistical model) + stage 2 (AI review) for every fixture in the
 * next 48h that doesn't have a prediction yet. Fixtures the model can't
 * confidently pick are left without a Prediction row - an empty slot beats a
 * bad tip, per spec.
 */
export async function generatePredictions(): Promise<GeneratePredictionsResult> {
  const result: GeneratePredictionsResult = {
    fixturesConsidered: 0,
    predictionsPublished: 0,
    skippedInsufficientHistory: 0,
    skippedBelowFloor: 0,
    errors: [],
  };

  const windowEnd = new Date(Date.now() + GENERATE_WINDOW_HOURS * 60 * 60 * 1000);
  const fixtures = await prisma.fixture.findMany({
    where: {
      status: FixtureStatus.SCHEDULED,
      kickoffUtc: { gte: new Date(), lte: windowEnd },
      prediction: null,
    },
    include: { league: true, homeTeam: true, awayTeam: true },
  });
  result.fixturesConsidered = fixtures.length;
  if (fixtures.length === 0) return result;

  const floor = getConfidenceFloor();
  const leagueAveragesCache = new Map<string, Awaited<ReturnType<typeof computeLeagueAverages>>>();

  type Prepared = {
    fixtureId: string;
    basePick: MarketProbability;
    baseConfidence: number;
    baseOdds: number;
    packet: ContextPacket;
  };
  const prepared: Prepared[] = [];

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

      const modelResult = predictFixture(
        { home: { matches: homeMatches }, away: { matches: awayMatches }, league: leagueAverages },
        floor,
      );
      if (modelResult.skip) {
        result.skippedBelowFloor++;
        continue;
      }

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

      prepared.push({
        fixtureId: fixture.id,
        basePick: modelResult.topPick,
        baseConfidence: modelResult.confidence,
        baseOdds: modelResult.odds,
        packet,
      });
    }
  } catch (err) {
    if (err instanceof ApiFootballQuotaExceededError) {
      result.errors.push("quota exhausted while building context packets, stopping this run");
    } else {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
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
