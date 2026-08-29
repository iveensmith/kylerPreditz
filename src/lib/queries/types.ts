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

type BaseFixtureWithTipInfo = Prisma.FixtureGetPayload<{ include: typeof fixtureListInclude }>;

/**
 * `locked` is tacked on by `redactFixtureListForFreeView` (see lib/premium.ts):
 * when true the pick is premium and its market/selection/odds/confidence have
 * been blanked before reaching this viewer.
 */
export type FixtureWithTipInfo = Omit<BaseFixtureWithTipInfo, "prediction"> & {
  prediction: (NonNullable<BaseFixtureWithTipInfo["prediction"]> & { locked?: boolean }) | null;
};

type BaseLeagueWithFixtures = Prisma.LeagueGetPayload<{
  include: { fixtures: { include: typeof fixtureListInclude } };
}>;

export type LeagueWithFixtures = Omit<BaseLeagueWithFixtures, "fixtures"> & {
  fixtures: FixtureWithTipInfo[];
};
