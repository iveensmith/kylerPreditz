import { cache } from "react";
import { FixtureStatus } from "@/generated/prisma/enums";
import { getCurrentSeason } from "@/lib/api-football/season";
import { seasonCalendarForSlug } from "@/lib/leagues.config";
import { prisma } from "@/lib/db/prisma";
import { buildTeamContextStats } from "@/lib/predictions/context-input";
import { redactPickForFreeView, shouldLockPick } from "@/lib/premium";
import { slugify } from "@/lib/slugs";
import { buildH2hFixtures, buildRecentFixtures } from "./match-detail-extras";
import type { H2hFixture, RecentFixture } from "./match-detail-extras";

export type RelatedMatch = {
  id: string;
  slug: string;
  homeName: string;
  awayName: string;
  leagueName: string;
  kickoffUtc: Date;
};

/**
 * Up to 6 other upcoming fixtures that carry a visible tip, same-league first
 * then filling with the next fixtures from any league. Feeds the "More
 * predictions" links on a match page - internal links into the deep pages so
 * crawlers (and readers) can move between them.
 */
async function getRelatedMatches(leagueId: string, excludeId: string): Promise<RelatedMatch[]> {
  const pool = await prisma.fixture.findMany({
    where: {
      id: { not: excludeId },
      status: FixtureStatus.SCHEDULED,
      kickoffUtc: { gte: new Date() },
      prediction: { isNot: null },
    },
    orderBy: { kickoffUtc: "asc" },
    take: 24,
    select: {
      id: true,
      kickoffUtc: true,
      leagueId: true,
      league: { select: { name: true } },
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      prediction: { select: { premium: true, confidence: true, settledAs: true } },
    },
  });

  return pool
    .filter((f) => f.prediction && !shouldLockPick(f.prediction))
    // V8 sort is stable and the pool is already kickoff-ordered, so same-league
    // fixtures float to the top without losing the chronological order.
    .sort((a, b) => Number(b.leagueId === leagueId) - Number(a.leagueId === leagueId))
    .slice(0, 6)
    .map((f) => ({
      id: f.id,
      slug: matchSlug(f.homeTeam.name, f.awayTeam.name),
      homeName: f.homeTeam.name,
      awayName: f.awayTeam.name,
      leagueName: f.league.name,
      kickoffUtc: f.kickoffUtc,
    }));
}

// The H2H / recent-form panels each make an API-Football call. During `next build`
// we prerender a rolling window of ~130 match pages, and that burst - stacked on
// top of the cron syncs sharing the same account quota - reliably trips the
// per-minute rate limit, so every page retries for ~45s and still ships empty.
// Skip the calls at build time: the page already falls back to DB form data, and
// the panels fill in on the first request after deploy (revalidate=120, and
// sync-results revalidates this route within minutes anyway).
const SKIP_LIVE_LOOKUPS = process.env.NEXT_PHASE === "phase-production-build";

/** cache()'d - both generateMetadata and the page component need this per request/render pass. */
export const getMatchDetail = cache(async (fixtureId: string) => {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { league: true, homeTeam: true, awayTeam: true, prediction: true },
  });
  if (!fixture) return null;

  const season = getCurrentSeason(fixture.kickoffUtc, seasonCalendarForSlug(fixture.league.slug));
  const noH2h: Promise<H2hFixture[]> = Promise.resolve([]);
  const noRecent: Promise<RecentFixture[]> = Promise.resolve([]);
  const [homeStats, awayStats, h2hFixtures, homeRecent, awayRecent, standings, relatedMatches] = await Promise.all([
    buildTeamContextStats({ teamDbId: fixture.homeTeamId, leagueDbId: fixture.leagueId, season, kickoffUtc: fixture.kickoffUtc }),
    buildTeamContextStats({ teamDbId: fixture.awayTeamId, leagueDbId: fixture.leagueId, season, kickoffUtc: fixture.kickoffUtc }),
    SKIP_LIVE_LOOKUPS ? noH2h : buildH2hFixtures(fixture.homeTeam.apiId, fixture.awayTeam.apiId),
    SKIP_LIVE_LOOKUPS ? noRecent : buildRecentFixtures(fixture.homeTeam.apiId),
    SKIP_LIVE_LOOKUPS ? noRecent : buildRecentFixtures(fixture.awayTeam.apiId),
    prisma.standing.findMany({
      where: { leagueId: fixture.leagueId, season },
      orderBy: { rank: "asc" },
      include: { team: { include: { stats: { where: { season }, take: 1 } } } },
    }),
    getRelatedMatches(fixture.leagueId, fixture.id),
  ]);

  return {
    fixture: { ...fixture, prediction: fixture.prediction ? redactPickForFreeView(fixture.prediction) : null },
    homeStats,
    awayStats,
    h2hFixtures,
    homeRecent,
    awayRecent,
    standings,
    relatedMatches,
  };
});

export type MatchDetail = NonNullable<Awaited<ReturnType<typeof getMatchDetail>>>;

/** Slug for the canonical match-detail URL, e.g. "arsenal-vs-chelsea". */
export function matchSlug(homeName: string, awayName: string): string {
  return `${slugify(homeName)}-vs-${slugify(awayName)}`;
}
