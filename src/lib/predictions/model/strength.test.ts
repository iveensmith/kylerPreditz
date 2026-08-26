import { describe, expect, it } from "vitest";
import { computeDecayWeight, computeExpectedGoals, computeTeamStrength, weightedAverage } from "./strength";
import type { LeagueAverages, MatchResult, TeamHistory } from "./types";
import { HALF_LIFE_MATCHES } from "./constants";

describe("computeDecayWeight", () => {
  it("is 1 for the most recent match (rank 0)", () => {
    expect(computeDecayWeight(0)).toBe(1);
  });

  it("is exactly 0.5 at the half-life rank", () => {
    expect(computeDecayWeight(HALF_LIFE_MATCHES)).toBeCloseTo(0.5, 10);
  });

  it("is 0.25 at twice the half-life", () => {
    expect(computeDecayWeight(HALF_LIFE_MATCHES * 2)).toBeCloseTo(0.25, 10);
  });
});

describe("weightedAverage", () => {
  it("matches hand-computed weighted mean", () => {
    expect(weightedAverage([{ value: 1, weight: 1 }, { value: 3, weight: 3 }])).toBeCloseTo(2.5, 10);
  });

  it("returns 0 for an empty list", () => {
    expect(weightedAverage([])).toBe(0);
  });
});

function match(daysAgo: number, venue: "home" | "away", goalsFor: number, goalsAgainst: number): MatchResult {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return { date, venue, goalsFor, goalsAgainst };
}

const LEAGUE: LeagueAverages = { avgHomeGoals: 1.5, avgAwayGoals: 1.2 };

describe("computeTeamStrength", () => {
  it("returns the constant value when every home match has the same scoreline", () => {
    const history: TeamHistory = {
      matches: [
        match(1, "home", 3, 1),
        match(3, "home", 3, 1),
        match(5, "home", 3, 1),
        match(2, "away", 1, 2),
        match(4, "away", 1, 2),
        match(6, "away", 1, 2),
      ],
    };
    const strength = computeTeamStrength(history, LEAGUE);
    expect(strength.homeAttack).toBeCloseTo(3 / LEAGUE.avgHomeGoals, 10);
    expect(strength.homeDefence).toBeCloseTo(1 / LEAGUE.avgAwayGoals, 10);
    expect(strength.awayAttack).toBeCloseTo(1 / LEAGUE.avgAwayGoals, 10);
    expect(strength.awayDefence).toBeCloseTo(2 / LEAGUE.avgHomeGoals, 10);
    expect(strength.totalMatches).toBe(6);
  });

  it("falls back to the overall average when a team has no matches in one venue", () => {
    const history: TeamHistory = {
      matches: [
        match(1, "away", 2, 0),
        match(2, "away", 2, 0),
        match(3, "away", 2, 0),
        match(4, "away", 2, 0),
        match(5, "away", 2, 0),
        match(6, "away", 2, 0),
      ],
    };
    const strength = computeTeamStrength(history, LEAGUE);
    // No home matches at all -> home figures fall back to the away-derived overall average.
    expect(strength.homeAttack).toBeCloseTo(2 / LEAGUE.avgHomeGoals, 10);
    expect(strength.homeDefence).toBeCloseTo(0 / LEAGUE.avgAwayGoals, 10);
  });
});

describe("computeExpectedGoals", () => {
  it("produces higher expected goals for the stronger attacking side", () => {
    const strongAttack: TeamHistory = {
      matches: Array.from({ length: 6 }, (_, i) => match(i + 1, i % 2 === 0 ? "home" : "away", 3, 0)),
    };
    const weakAttack: TeamHistory = {
      matches: Array.from({ length: 6 }, (_, i) => match(i + 1, i % 2 === 0 ? "home" : "away", 0, 3)),
    };

    const goals = computeExpectedGoals(strongAttack, weakAttack, LEAGUE);
    expect(goals.home).toBeGreaterThan(goals.away);
    expect(goals.home).toBeGreaterThan(0);
    expect(goals.away).toBeGreaterThanOrEqual(0);
  });
});
