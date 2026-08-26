import type { Prisma } from "@/generated/prisma/client";
import { getCurrentSeason } from "@/lib/api-football/season";

// Evaluated once per server process - only turns over once a year, so this is fine.
// Shared across every league in fixtureListInclude, so calendar-year leagues
// (Brazil, MLS, etc.) can briefly show an empty "form" badge around Jan-Jun
// when the shared heuristic and their actual calendar diverge - see the note
// in queries/homepage.ts. Cosmetic only; sync/predictions resolve season
// per-league correctly via seasonCalendarForApiId().
const CURRENT_SEASON = getCurrentSeason();

const teamWithForm = {
  include: { stats: { where: { season: CURRENT_SEASON }, take: 1 } },
} as const;

export const fixtureListInclude = {
  homeTeam: teamWithForm,
  awayTeam: teamWithForm,
  prediction: true,
  league: true,
} as const satisfies Prisma.FixtureInclude;

export type FixtureWithTipInfo = Prisma.FixtureGetPayload<{ include: typeof fixtureListInclude }>;

export type LeagueWithFixtures = Prisma.LeagueGetPayload<{
  include: { fixtures: { include: typeof fixtureListInclude } };
}>;
