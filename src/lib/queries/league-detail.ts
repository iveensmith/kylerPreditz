import { cache } from "react";
import { getCurrentSeason } from "@/lib/api-football/season";
import { seasonCalendarForSlug } from "@/lib/leagues.config";
import { prisma } from "@/lib/db/prisma";
import { fixtureListInclude } from "./types";

export async function getLeagueIndex() {
  return prisma.league.findMany({ where: { isFeatured: true }, orderBy: { priority: "asc" } });
}

export type LeagueIndexEntry = Awaited<ReturnType<typeof getLeagueIndex>>[number];

/** cache()'d - both generateMetadata and the page component need this per request/render pass. */
export const getLeagueBySlug = cache(async (slug: string) => {
  const season = getCurrentSeason(new Date(), seasonCalendarForSlug(slug));
  return prisma.league.findUnique({
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
});

export type LeagueDetail = NonNullable<Awaited<ReturnType<typeof getLeagueBySlug>>>;
