import { describe, expect, it } from "vitest";
import { assignCoverageFills, type CoverageCandidate } from "./market-coverage";
import type { MarketPageConfig } from "@/lib/markets.config";
import type { PredictionMarket } from "@/generated/prisma/enums";

function page(slug: string, markets: PredictionMarket[]): MarketPageConfig {
  return {
    slug,
    h1: slug,
    metaTitle: slug,
    metaDescription: slug,
    intro: slug,
    filter: { type: "market", markets },
  };
}

function candidate(fixtureId: string, markets: CoverageCandidate["markets"]): CoverageCandidate {
  return { fixtureId, markets };
}

describe("assignCoverageFills", () => {
  it("returns nothing when there are no uncovered pages", () => {
    const fills = assignCoverageFills([candidate("f1", [{ market: "OVER_1_5", selection: "Over 1.5", probability: 0.7 }])], []);
    expect(fills).toEqual([]);
  });

  it("fills a page from the single candidate that has that market", () => {
    const fills = assignCoverageFills(
      [
        candidate("f1", [{ market: "DRAW", selection: "Draw", probability: 0.35 }]),
        candidate("f2", [{ market: "OVER_1_5", selection: "Over 1.5", probability: 0.8 }]),
      ],
      [page("draws", ["DRAW"])],
    );
    expect(fills).toEqual([{ fixtureId: "f1", market: { market: "DRAW", selection: "Draw", probability: 0.35 } }]);
  });

  it("picks the highest-probability real candidate across fixtures for a page", () => {
    const fills = assignCoverageFills(
      [
        candidate("f1", [{ market: "AWAY_WIN", selection: "Away", probability: 0.22 }]),
        candidate("f2", [{ market: "AWAY_WIN", selection: "Away", probability: 0.41 }]),
        candidate("f3", [{ market: "AWAY_WIN", selection: "Away", probability: 0.3 }]),
      ],
      [page("away-wins", ["AWAY_WIN"])],
    );
    expect(fills).toHaveLength(1);
    expect(fills[0].fixtureId).toBe("f2");
    expect(fills[0].market.probability).toBe(0.41);
  });

  it("never reuses a fixture already consumed by an earlier page", () => {
    const fills = assignCoverageFills(
      [
        candidate("f1", [
          { market: "DRAW", selection: "Draw", probability: 0.5 },
          { market: "CORRECT_SCORE", selection: "1-1", probability: 0.18 },
        ]),
      ],
      [page("draws", ["DRAW"]), page("correct-score", ["CORRECT_SCORE"])],
    );
    // f1 fills "draws" (first page processed) and is unavailable for "correct-score",
    // even though it's the only candidate that could otherwise serve it.
    expect(fills).toHaveLength(1);
    expect(fills[0].fixtureId).toBe("f1");
    expect(fills[0].market.market).toBe("DRAW");
  });

  it("leaves a page unfilled when no candidate has a matching market", () => {
    const fills = assignCoverageFills(
      [candidate("f1", [{ market: "OVER_1_5", selection: "Over 1.5", probability: 0.7 }])],
      [page("correct-score", ["CORRECT_SCORE"])],
    );
    expect(fills).toEqual([]);
  });

  it("falls back to the best available value even when it's below a typical confidence floor", () => {
    const fills = assignCoverageFills(
      [candidate("f1", [{ market: "CORRECT_SCORE", selection: "1-1", probability: 0.14 }])],
      [page("correct-score", ["CORRECT_SCORE"])],
    );
    expect(fills).toEqual([{ fixtureId: "f1", market: { market: "CORRECT_SCORE", selection: "1-1", probability: 0.14 } }]);
  });

  it("covers a multi-market page (e.g. BTTS) from either of its constituent markets", () => {
    const fills = assignCoverageFills(
      [candidate("f1", [{ market: "BTTS_NO", selection: "No", probability: 0.55 }])],
      [page("both-teams-to-score", ["BTTS_YES", "BTTS_NO"])],
    );
    expect(fills[0].market.market).toBe("BTTS_NO");
  });
});
