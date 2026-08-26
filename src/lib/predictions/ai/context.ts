import type { ExpectedGoals, MarketProbability } from "../model";
import type { ContextPacket, H2hEntry, TeamContextStats } from "./types";

export type BuildContextPacketInput = {
  fixture: { home: string; away: string; league: string; kickoffUtc: string; venue: string | null };
  baseModel: { expectedGoals: ExpectedGoals; markets: MarketProbability[]; topPick: MarketProbability };
  homeTeam: TeamContextStats;
  awayTeam: TeamContextStats;
  h2h: H2hEntry[];
  injuries?: { home: string[]; away: string[] };
  context: { competition: string; isDerby: boolean; homeUnbeatenRun?: number };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Pure shaping of already-fetched data into the AI layer's context packet.
 * No DB, no network - callers gather the raw inputs (Phase 3: from Postgres;
 * here: from the same historical dataset used for the stage-1 backtest).
 */
export function buildContextPacket(input: BuildContextPacketInput): ContextPacket {
  return {
    fixture: input.fixture,
    baseModel: {
      expectedGoals: { home: round2(input.baseModel.expectedGoals.home), away: round2(input.baseModel.expectedGoals.away) },
      markets: input.baseModel.markets.map((m) => ({ ...m, probability: round2(m.probability) })),
      topPick: { ...input.baseModel.topPick, probability: round2(input.baseModel.topPick.probability) },
    },
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    h2h: input.h2h,
    injuries: input.injuries ?? { home: [], away: [] },
    context: input.context,
  };
}
