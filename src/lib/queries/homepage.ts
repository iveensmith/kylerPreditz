import { SettledStatus } from "@/generated/prisma/enums";
import { getCurrentSeason } from "@/lib/api-football/season";
import { prisma } from "@/lib/db/prisma";
import { dropLockedFixturesFromList, shouldLockPick } from "@/lib/premium";
import { gamesTodayQuery } from "@/lib/site-settings";
import { latestListedPostsQuery, listedPostsCountQuery } from "./blog";
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
 *
 * `*Query` variants below return the raw, unawaited query - callers that need
 * several of these at once (e.g. getHomepageData) batch them into one
 * prisma.$transaction([...]) instead of each opening its own connection
 * (each Prisma call does on Workers - see src/lib/db/prisma.ts's `maxUses: 1`).
 */
export function fixturesForDateQuery(date: Date) {
  const { gte, lt } = dayRangeUtc(date);
  return prisma.league.findMany({
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
}

export async function getFixturesForDate(date: Date) {
  return dropLockedFixturesFromList(await fixturesForDateQuery(date));
}

export type { LeagueWithFixtures as FixturesByLeague } from "./types";

/**
 * The single highest-confidence pick for the day - a manually-flagged banker
 * wins if one exists. Pending premium picks are skipped: the public banker
 * slot only ever shows a free pick (the strongest premium pick lives on
 * /premium). Falls back through the top few candidates.
 */
export function bankerCandidatesQuery(date: Date) {
  const { gte, lt } = dayRangeUtc(date);
  return prisma.prediction.findMany({
    where: { fixture: { kickoffUtc: { gte, lt } } },
    orderBy: [{ isBanker: "desc" }, { confidence: "desc" }],
    take: 10,
    include: { fixture: { include: fixtureListInclude } },
  });
}

export async function getBankerOfTheDay(date: Date) {
  const candidates = await bankerCandidatesQuery(date);
  return candidates.find((p) => !shouldLockPick(p)) ?? null;
}

export function recentWinningTipsQuery(limit = 6) {
  return prisma.prediction.findMany({
    where: { settledAs: SettledStatus.WON },
    orderBy: { fixture: { kickoffUtc: "desc" } },
    take: limit,
    include: { fixture: { include: fixtureListInclude } },
  });
}

export async function getRecentWinningTips(limit = 6) {
  return recentWinningTipsQuery(limit);
}

// These two queries share one season value across every featured league in a
// single nested-include query, so calendar-year leagues (Brazil, MLS, etc. -
// see leagues.config.ts) can briefly resolve to the wrong season around the
// Jan-Jun window when the shared heuristic and their actual calendar diverge.
// Effect is graceful: that league's table/scorers list just doesn't show
// (filtered out below) until it lines back up - never wrong data. Fixing this
// properly needs a per-league query; not worth it for a decorative homepage
// section. Sync and prediction generation resolve season per-league correctly.
export function standingsForFeaturedLeaguesQuery() {
  const season = getCurrentSeason();
  return prisma.league.findMany({
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
}

export async function getStandingsForFeaturedLeagues() {
  const leagues = await standingsForFeaturedLeaguesQuery();
  return leagues.filter((l) => l.standings.length > 0);
}

export type StandingsByLeague = Awaited<ReturnType<typeof getStandingsForFeaturedLeagues>>;

export function topScorersForFeaturedLeaguesQuery(limit = 5, leagueLimit = 6) {
  const season = getCurrentSeason();
  return prisma.league.findMany({
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
}

export async function getTopScorersForFeaturedLeagues(limit = 5, leagueLimit = 6) {
  const leagues = await topScorersForFeaturedLeaguesQuery(limit, leagueLimit);
  return leagues.filter((l) => l.topScorers.length > 0);
}

export type TopScorersByLeague = Awaited<ReturnType<typeof getTopScorersForFeaturedLeagues>>;

/**
 * Everything the homepage needs, in one round-trip. The page previously ran
 * `getGamesToday()` plus 8 more independent queries via `Promise.all`, which
 * doesn't reduce the number of connections opened (each still opens its own
 * under Workers' `maxUses: 1` - see src/lib/db/prisma.ts) - only overlaps
 * their wait time, and real production pages were measured at 6-8s, the
 * slowest page on the site. One `$transaction([...])` sends all 9 as a
 * single connection; the same post-processing each individual getter does is
 * applied here afterward.
 */
export async function getHomepageData(date: Date) {
  const [
    gamesTodayRow,
    fixtureLeagues,
    bankerCandidates,
    recentWinners,
    standingsLeagues,
    topScorerLeagues,
    latestPosts4,
    latestPosts3,
    listedPostTotal,
  ] = await prisma.$transaction([
    gamesTodayQuery(),
    fixturesForDateQuery(date),
    bankerCandidatesQuery(date),
    recentWinningTipsQuery(6),
    standingsForFeaturedLeaguesQuery(),
    topScorersForFeaturedLeaguesQuery(),
    latestListedPostsQuery(4),
    latestListedPostsQuery(3),
    listedPostsCountQuery(),
  ]);

  return {
    gamesToday: gamesTodayRow?.value !== "no",
    fixtureLeagues: dropLockedFixturesFromList(fixtureLeagues),
    banker: bankerCandidates.find((p) => !shouldLockPick(p)) ?? null,
    recentWinners,
    standings: standingsLeagues.filter((l) => l.standings.length > 0),
    topScorers: topScorerLeagues.filter((l) => l.topScorers.length > 0),
    latestPosts4,
    latestPosts3,
    listedPostTotal,
  };
}
