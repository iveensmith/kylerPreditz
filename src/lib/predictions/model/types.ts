// Mirrors the Prisma `PredictionMarket` enum, kept as a plain literal union so
// this module has zero dependency on generated/DB code (see CLAUDE.md: the
// model is pure — no DB, no network, no LLM).
export const MARKETS = [
  "HOME_WIN",
  "AWAY_WIN",
  "DRAW",
  "DOUBLE_CHANCE_1X",
  "DOUBLE_CHANCE_X2",
  "DOUBLE_CHANCE_12",
  "DRAW_NO_BET_HOME",
  "DRAW_NO_BET_AWAY",
  "OVER_1_5",
  "UNDER_1_5",
  "OVER_2_5",
  "UNDER_2_5",
  "OVER_3_5",
  "UNDER_3_5",
  "BTTS_YES",
  "BTTS_NO",
  "CORRECT_SCORE",
  "HT_OVER_0_5",
] as const;

export type Market = (typeof MARKETS)[number];

export type MatchResult = {
  /** ISO date string. Only used for chronological ordering, not calendar-time decay. */
  date: string;
  venue: "home" | "away";
  goalsFor: number;
  goalsAgainst: number;
};

export type TeamHistory = {
  /** A team's prior matches, in any order. At least MIN_MATCHES_REQUIRED are needed. */
  matches: MatchResult[];
};

export type LeagueAverages = {
  /** League-wide average goals scored by the home side per match. */
  avgHomeGoals: number;
  /** League-wide average goals scored by the away side per match. */
  avgAwayGoals: number;
};

export type FixtureInput = {
  home: TeamHistory;
  away: TeamHistory;
  league: LeagueAverages;
};

export type MarketProbability = {
  market: Market;
  /** Human-readable pick, e.g. "Home", "Over 2.5", "2-1". */
  selection: string;
  /** 0-1 */
  probability: number;
};

export type ExpectedGoals = {
  home: number;
  away: number;
};

export type PredictionResult =
  | {
      skip: false;
      expectedGoals: ExpectedGoals;
      markets: MarketProbability[];
      topPick: MarketProbability;
      /** Rounded probability, 0-100. */
      confidence: number;
      /** 1 / probability, rounded to 2dp. */
      odds: number;
    }
  | {
      skip: true;
      reason: string;
      markets?: MarketProbability[];
    };

export type MatchOutcome = "WON" | "LOST" | "VOID";
