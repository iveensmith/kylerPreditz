import type { ExpectedGoals, Market, MarketProbability } from "../model";

export type TeamContextStats = {
  form: string; // last 5 as "WWDLW"
  last6Results: { date: string; opponent: string; score: string; venue: "home" | "away" }[];
  goalsForAvg: number;
  goalsAgainstAvg: number;
  homeGoalsForAvg?: number;
  awayGoalsForAvg?: number;
  cleanSheets: number;
  leaguePosition: number | null;
  restDays: number | null;
};

export type H2hEntry = {
  date: string;
  score: string;
  /** "home" if the fixture's current home team was also home in this past meeting. */
  venue: "home" | "away";
};

export type ContextPacket = {
  fixture: {
    home: string;
    away: string;
    league: string;
    kickoffUtc: string;
    venue: string | null;
  };
  baseModel: {
    expectedGoals: ExpectedGoals;
    markets: MarketProbability[];
    topPick: MarketProbability;
  };
  homeTeam: TeamContextStats;
  awayTeam: TeamContextStats;
  h2h: H2hEntry[];
  injuries: { home: string[]; away: string[] };
  context: {
    competition: string;
    isDerby: boolean;
    homeUnbeatenRun?: number;
  };
};

export type AiLayerMode = "full" | "reasoning_only" | "off";

export type ValidatedPick = {
  market: Market;
  selection: string;
  confidence: number;
  baseConfidence: number;
  aiAdjusted: boolean;
  adjustmentReason: string | null;
  reasoning: string;
  skip: boolean;
};
