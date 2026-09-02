import { prisma } from "@/lib/db/prisma";
import { MARKET_PAGES, type MarketPageConfig } from "@/lib/markets.config";
import type { MarketProbability } from "./model";

const UPCOMING_WINDOW_DAYS = 7;

/** Market-type pages with zero live predictions in the window market pages actually query. */
export async function getUncoveredMarketPages(): Promise<MarketPageConfig[]> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const marketPages = MARKET_PAGES.filter((p) => p.filter.type === "market");
  const trackedMarkets = [
    ...new Set(marketPages.flatMap((p) => (p.filter.type === "market" ? p.filter.markets : []))),
  ];

  // One grouped count for every market a market-type page cares about, instead
  // of one count() per page.
  const grouped = await prisma.prediction.groupBy({
    by: ["market"],
    where: {
      market: { in: trackedMarkets },
      fixture: { kickoffUtc: { gte: now, lte: windowEnd } },
    },
    _count: { _all: true },
  });
  const coveredMarkets = new Set(grouped.filter((g) => g._count._all > 0).map((g) => g.market));

  return marketPages.filter((page) =>
    page.filter.type === "market" ? !page.filter.markets.some((m) => coveredMarkets.has(m)) : false,
  );
}

export type CoverageCandidate = { fixtureId: string; markets: MarketProbability[] };
export type CoverageFill = { fixtureId: string; market: MarketProbability };

/**
 * Greedily assigns fixtures to fill market pages that currently have no live
 * prediction. Never invents a number - every fill is a candidate fixture's
 * own real, already-computed probability for that market. Picks whichever
 * real candidate is highest for each page (naturally prefers one that clears
 * the normal confidence floor when one exists; falls back to the best
 * available real value, however low, when none does). Each fixture fills at
 * most one page, so pages later in `uncoveredPages` may go unfilled if
 * earlier pages already consumed every fixture that could serve them.
 */
export function assignCoverageFills(candidates: CoverageCandidate[], uncoveredPages: MarketPageConfig[]): CoverageFill[] {
  const fills: CoverageFill[] = [];
  const consumed = new Set<string>();

  for (const page of uncoveredPages) {
    if (page.filter.type !== "market") continue;
    const targetMarkets = new Set<string>(page.filter.markets);

    let best: CoverageFill | null = null;
    for (const candidate of candidates) {
      if (consumed.has(candidate.fixtureId)) continue;
      for (const m of candidate.markets) {
        if (!targetMarkets.has(m.market)) continue;
        if (!best || m.probability > best.market.probability) {
          best = { fixtureId: candidate.fixtureId, market: m };
        }
      }
    }

    if (best) {
      fills.push(best);
      consumed.add(best.fixtureId);
    }
  }

  return fills;
}
