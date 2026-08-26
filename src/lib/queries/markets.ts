import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { MarketFilter } from "@/lib/markets.config";
import { fixtureListInclude } from "./types";

const UPCOMING_WINDOW_DAYS = 7;

function predictionWhereForFilter(filter: MarketFilter): Prisma.PredictionWhereInput {
  switch (filter.type) {
    case "market":
      return { market: { in: filter.markets } };
    case "topConfidence":
      return { confidence: { gte: filter.minConfidence } };
    case "banker":
      return { isBanker: true };
    case "oddsRange":
      return { odds: { gte: filter.min, lte: filter.max } };
    case "all":
      return {};
  }
}

/** League-grouped upcoming fixtures matching a market page's filter - same shape as the homepage query. */
export async function getFixturesForMarketFilter(filter: MarketFilter) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const predictionWhere = predictionWhereForFilter(filter);

  const leagues = await prisma.league.findMany({
    where: {
      isFeatured: true,
      fixtures: { some: { kickoffUtc: { gte: now, lte: windowEnd }, prediction: predictionWhere } },
    },
    orderBy: { priority: "asc" },
    include: {
      fixtures: {
        where: { kickoffUtc: { gte: now, lte: windowEnd }, prediction: predictionWhere },
        orderBy: { kickoffUtc: "asc" },
        include: fixtureListInclude,
      },
    },
  });
  return leagues;
}

/**
 * The banker-of-the-day market page needs one highlighted pick, not a list.
 * Prefers a manually-flagged banker (admin feature, Phase 6); falls back to
 * the highest-confidence upcoming pick, same convention as the homepage card.
 */
export async function getBankerPagePick() {
  return prisma.prediction.findFirst({
    where: { fixture: { kickoffUtc: { gte: new Date() } } },
    orderBy: [{ isBanker: "desc" }, { confidence: "desc" }],
    include: { fixture: { include: fixtureListInclude } },
  });
}

export type { LeagueWithFixtures as MarketFixturesByLeague } from "./types";
