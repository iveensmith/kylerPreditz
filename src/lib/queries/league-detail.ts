import { cache } from "react";
import { getCurrentSeason } from "@/lib/api-football/season";
import { seasonCalendarForSlug } from "@/lib/leagues.config";
import { prisma } from "@/lib/db/prisma";
import { shouldLockPick } from "@/lib/premium";
import { fixtureListInclude } from "./types";

export async function getLeagueIndex() {
  return prisma.league.findMany({ where: { isFeatured: true }, orderBy: { priority: "asc" } });
}

export type LeagueIndexEntry = Awaited<ReturnType<typeof getLeagueIndex>>[number];

/**
 * Every league that has a public detail page. Wider than getLeagueIndex():
 * the [country]/[league] route renders for any league (dynamicParams), not
 * just featured ones, so the sitemap lists them all.
 */
export async function getSitemapLeagues() {
  return prisma.league.findMany({
    select: { country: true, slug: true, updatedAt: true },
    orderBy: { priority: "asc" },
  });
}

/** cache()'d - both generateMetadata and the page component need this per request/render pass. */
export const getLeagueBySlug = cache(async (slug: string) => {
  const season = getCurrentSeason(new Date(), seasonCalendarForSlug(slug));
  const league = await prisma.league.findUnique({
    where: { slug },
    include: {
      fixtures: {
        where: { kickoffUtc: { gte: new Date() } },
        orderBy: { kickoffUtc: "asc" },
        take: 20,
        include: fixtureListInclude,
      },
      standings: {
        where: { season },
        orderBy: { rank: "asc" },
        include: { team: { include: { stats: { where: { season }, take: 1 } } } },
      },
      topScorers: {
        where: { season },
        orderBy: { goals: "desc" },
        take: 10,
        include: { team: true },
      },
    },
  });
  if (!league) return null;
  return {
    ...league,
    // The league page is a fixtures list, so a premium-pick fixture still shows
    // as a row - but with the pick stripped to null (rendered like a match with
    // no tip). Pending premium picks never surface on the public site.
    fixtures: league.fixtures.map((f) => ({
      ...f,
      prediction: f.prediction && shouldLockPick(f.prediction) ? null : f.prediction,
    })),
  };
});

export type LeagueDetail = NonNullable<Awaited<ReturnType<typeof getLeagueBySlug>>>;
