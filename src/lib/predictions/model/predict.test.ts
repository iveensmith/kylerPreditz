import { describe, expect, it } from "vitest";
import { predictFixture } from "./predict";
import type { LeagueAverages, MatchResult, TeamHistory } from "./types";

const LEAGUE: LeagueAverages = { avgHomeGoals: 1.5, avgAwayGoals: 1.2 };

function history(count: number, venue: "home" | "away", goalsFor: number, goalsAgainst: number): TeamHistory {
  const matches: MatchResult[] = Array.from({ length: count }, (_, i) => ({
    date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    venue: i % 2 === 0 ? venue : venue === "home" ? "away" : "home",
    goalsFor,
    goalsAgainst,
  }));
  return { matches };
}

describe("predictFixture", () => {
  it("skips when either team has fewer than the minimum required matches", () => {
    const result = predictFixture({
      home: history(5, "home", 2, 1),
      away: history(6, "away", 1, 1),
      league: LEAGUE,
    });
    expect(result.skip).toBe(true);
    if (result.skip) expect(result.reason).toMatch(/insufficient/);
  });

  it("skips when nothing clears an unreasonably high floor", () => {
    const result = predictFixture(
      { home: history(6, "home", 1, 1), away: history(6, "away", 1, 1), league: LEAGUE },
      0.99,
    );
    expect(result.skip).toBe(true);
    if (result.skip) expect(result.markets?.length).toBe(18);
  });

  it("publishes a pick with a sane confidence/odds relationship for a lopsided fixture", () => {
    const home: TeamHistory = { matches: Array.from({ length: 8 }, (_, i) => ({
      date: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      venue: "home",
      goalsFor: 4,
      goalsAgainst: 0,
    })) };
    const away: TeamHistory = { matches: Array.from({ length: 8 }, (_, i) => ({
      date: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      venue: "away",
      goalsFor: 0,
      goalsAgainst: 4,
    })) };

    const result = predictFixture({ home, away, league: LEAGUE }, 0.5);
    expect(result.skip).toBe(false);
    if (!result.skip) {
      expect(result.confidence).toBeGreaterThanOrEqual(50);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(result.odds).toBeCloseTo(1 / (result.confidence / 100), 1);
      expect(result.markets.length).toBe(18);
      expect(result.expectedGoals.home).toBeGreaterThan(result.expectedGoals.away);
    }
  });
});
