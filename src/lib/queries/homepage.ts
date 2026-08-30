import { SettledStatus } from "@/generated/prisma/enums";
import { getCurrentSeason } from "@/lib/api-football/season";
import { prisma } from "@/lib/db/prisma";
import { dropLockedFixturesFromList, shouldLockPick } from "@/lib/premium";
import { fixtureListInclude } from "./types";

export function dayRangeUtc(date: Date): { gte: Date; lt: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { gte: start, lt: end };
}

/**
 * Fixtures for one calendar day (UTC) that have a published tip, grouped by
 * league in priority order. Fixtures without a prediction are left off these
 * public day views entirely rather than shown as an empty "No tip" row - the
 * admin can still see and manually pick them via the dedicated admin query
 * (getSkippedFixtures in queries/admin.ts).
 */
export async function getFixturesForDate(date: Date) {
  const { gte, lt } = dayRangeUtc(date);
  const leagues = await prisma.league.findMany({
    where: { isFeatured: true, fixtures: { some: { kickoffUtc: { gte, lt }, prediction: { isNot: null } } } },
    orderBy: { priority: "asc" },
    include: {
      fixtures: {
        where: { kickoffUtc: { gte, lt }, prediction: { isNot: null } },
        orderBy: { kickoffUtc: "asc" },
        include: fixtureListInclude,
      },
    },
  });
  return dropLockedFixturesFromList(leagues);
}

export type { LeagueWithFixtures as FixturesByLeague } from "./types";

/**
 * The single highest-confidence pick for the day - a manually-flagged banker
 * wins if one exists. Pending premium picks are skipped: the public banker
 * slot only ever shows a free pick (the strongest premium pick lives on
 * /premium). Falls back through the top few candidates.
 */
export async function getBankerOfTheDay(date: Date) {
  const { gte, lt } = dayRangeUtc(date);
  const candidates = await prisma.prediction.findMany({
    where: { fixture: { kickoffUtc: { gte, lt } } },
    orderBy: [{ isBanker: "desc" }, { confidence: "desc" }],
    take: 10,
    include: { fixture: { include: fixtureListInclude } },
  });
  return candidates.find((p) => !shouldLockPick(p)) ?? null;
}

export async function getRecentWinningTips(limit = 6) {
  return prisma.prediction.findMany({
    where: { settledAs: SettledStatus.WON },
    orderBy: { fixture: { kickoffUtc: "desc" } },
    take: limit,
    include: { fixture: { include: fixtureListInclude } },
  });
}

// These two queries share one season value across every featured league in a
// single nested-include query, so calendar-year leagues (Brazil, MLS, etc. -
// see leagues.config.ts) can briefly resolve to the wrong season around the
// Jan-Jun window when the shared heuristic and their actual calendar diverge.
// Effect is graceful: that league's table/scorers list just doesn't show
// (filtered out below) until it lines back up - never wrong data. Fixing this
// properly needs a per-league query; not worth it for a decorative homepage
// section. Sync and prediction generation resolve season per-league correctly.
export async function getStandingsForFeaturedLeagues() {
  const season = getCurrentSeason();
  const leagues = await prisma.league.findMany({
    where: { isFeatured: true },
    orderBy: { priority: "asc" },
    include: {
      standings: {
        where: { season },
        orderBy: { rank: "asc" },
        include: { team: true },
      },
    },
  });
  return leagues.filter((l) => l.standings.length > 0);
}

export type StandingsByLeague = Awaited<ReturnType<typeof getStandingsForFeaturedLeagues>>;

export async function getTopScorersForFeaturedLeagues(limit = 5, leagueLimit = 6) {
  const season = getCurrentSeason();
  const leagues = await prisma.league.findMany({
    where: { isFeatured: true },
    orderBy: { priority: "asc" },
    take: leagueLimit,
    include: {
      topScorers: {
        where: { season },
        orderBy: { goals: "desc" },
        take: limit,
        include: { team: true },
      },
    },
  });
  return leagues.filter((l) => l.topScorers.length > 0);
}

export type TopScorersByLeague = Awaited<ReturnType<typeof getTopScorersForFeaturedLeagues>>;
