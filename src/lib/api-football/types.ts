import { z } from "zod";

// Shapes below cover only the fields this project reads. API-Football responses
// carry far more; zod silently strips anything not listed here.

const nullableNumber = z.number().nullable();

export const apiFootballEnvelope = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.object({
    errors: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
    results: z.number(),
    response: resultSchema,
  });

// --- /leagues -----------------------------------------------------------

export const apiLeagueSchema = z.object({
  league: z.object({
    id: z.number(),
    name: z.string(),
    type: z.string(),
    logo: z.string(),
  }),
  country: z.object({
    name: z.string(),
    code: z.string().nullable(),
    flag: z.string().nullable(),
  }),
});
export type ApiLeague = z.infer<typeof apiLeagueSchema>;
export const apiLeaguesResponseSchema = apiFootballEnvelope(z.array(apiLeagueSchema));

// --- /teams ---------------------------------------------------------------

export const apiTeamSchema = z.object({
  team: z.object({
    id: z.number(),
    name: z.string(),
    code: z.string().nullable(),
    country: z.string().nullable(),
    logo: z.string(),
  }),
});
export type ApiTeam = z.infer<typeof apiTeamSchema>;
export const apiTeamsResponseSchema = apiFootballEnvelope(z.array(apiTeamSchema));

// --- /fixtures --------------------------------------------------------------

const apiFixtureStatusSchema = z.object({
  long: z.string(),
  short: z.string(),
  elapsed: z.number().nullable(),
});

export const apiFixtureSchema = z.object({
  fixture: z.object({
    id: z.number(),
    date: z.string(),
    timestamp: z.number(),
    venue: z.object({
      id: z.number().nullable(),
      name: z.string().nullable(),
      city: z.string().nullable(),
    }),
    status: apiFixtureStatusSchema,
  }),
  league: z.object({
    id: z.number(),
    name: z.string(),
    country: z.string(),
    season: z.number(),
    round: z.string(),
  }),
  teams: z.object({
    home: z.object({ id: z.number(), name: z.string(), logo: z.string(), winner: z.boolean().nullable() }),
    away: z.object({ id: z.number(), name: z.string(), logo: z.string(), winner: z.boolean().nullable() }),
  }),
  goals: z.object({ home: nullableNumber, away: nullableNumber }),
  score: z.object({
    halftime: z.object({ home: nullableNumber, away: nullableNumber }),
    fulltime: z.object({ home: nullableNumber, away: nullableNumber }),
  }),
});
export type ApiFixture = z.infer<typeof apiFixtureSchema>;
export const apiFixturesResponseSchema = apiFootballEnvelope(z.array(apiFixtureSchema));

// --- /teams/statistics --------------------------------------------------

const apiSplitTotal = z.object({
  home: z.number().nullable(),
  away: z.number().nullable(),
  total: z.number().nullable(),
});

export const apiTeamStatisticsSchema = z.object({
  form: z.string().nullable(),
  fixtures: z.object({
    played: apiSplitTotal,
    wins: apiSplitTotal,
    draws: apiSplitTotal,
    loses: apiSplitTotal,
  }),
  goals: z.object({
    for: z.object({ total: apiSplitTotal }),
    against: z.object({ total: apiSplitTotal }),
  }),
  clean_sheet: apiSplitTotal,
  failed_to_score: apiSplitTotal,
});
export type ApiTeamStatistics = z.infer<typeof apiTeamStatisticsSchema>;
// API-Football returns `response: []` instead of `{}` when a team has no
// statistics for the requested league/season, rather than an empty object.
export const apiTeamStatisticsResponseSchema = apiFootballEnvelope(
  z.union([apiTeamStatisticsSchema, z.array(z.unknown()).max(0)]),
);

// --- /standings -----------------------------------------------------------

const apiStandingRowSchema = z.object({
  rank: z.number(),
  team: z.object({ id: z.number(), name: z.string(), logo: z.string() }),
  // API-Football occasionally returns null here for placeholder/incomplete rows
  // (e.g. a group not yet underway) rather than omitting the row entirely.
  points: z.number().nullable(),
  goalsDiff: z.number().nullable(),
  all: z.object({ played: z.number() }),
});

export const apiStandingsSchema = z.object({
  league: z.object({
    id: z.number(),
    season: z.number(),
    standings: z.array(z.array(apiStandingRowSchema)),
  }),
});
export type ApiStandings = z.infer<typeof apiStandingsSchema>;
export const apiStandingsResponseSchema = apiFootballEnvelope(z.array(apiStandingsSchema));

// --- /players/topscorers -----------------------------------------------

export const apiTopScorerSchema = z.object({
  player: z.object({ id: z.number(), name: z.string() }),
  statistics: z.array(
    z.object({
      team: z.object({ id: z.number(), name: z.string(), logo: z.string() }),
      games: z.object({ appearences: z.number().nullable() }),
      goals: z.object({ total: z.number().nullable() }),
    }),
  ),
});
export type ApiTopScorer = z.infer<typeof apiTopScorerSchema>;
export const apiTopScorersResponseSchema = apiFootballEnvelope(z.array(apiTopScorerSchema));

// --- /injuries ------------------------------------------------------------

export const apiInjurySchema = z.object({
  player: z.object({ id: z.number(), name: z.string() }),
  team: z.object({ id: z.number(), name: z.string() }),
});
export type ApiInjury = z.infer<typeof apiInjurySchema>;
export const apiInjuriesResponseSchema = apiFootballEnvelope(z.array(apiInjurySchema));
