import { HALF_LIFE_MATCHES } from "./constants";
import type { LeagueAverages, TeamHistory } from "./types";

/** Exponential decay by match recency rank (0 = most recent). Half-life in matches, not calendar time. */
export function computeDecayWeight(rank: number): number {
  return Math.pow(0.5, rank / HALF_LIFE_MATCHES);
}

export function weightedAverage(items: { value: number; weight: number }[]): number {
  const weightSum = items.reduce((sum, i) => sum + i.weight, 0);
  if (weightSum === 0) return 0;
  const valueSum = items.reduce((sum, i) => sum + i.value * i.weight, 0);
  return valueSum / weightSum;
}

export type TeamStrength = {
  homeAttack: number;
  homeDefence: number;
  awayAttack: number;
  awayDefence: number;
  totalMatches: number;
};

/**
 * Attack/defence strength relative to league averages, weighted toward recent
 * form. Computed separately for home and away fixtures, per spec.
 */
export function computeTeamStrength(history: TeamHistory, league: LeagueAverages): TeamStrength {
  const ranked = [...history.matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((match, rank) => ({ match, weight: computeDecayWeight(rank) }));

  const homeMatches = ranked.filter((r) => r.match.venue === "home");
  const awayMatches = ranked.filter((r) => r.match.venue === "away");

  const overallFor = weightedAverage(ranked.map((r) => ({ value: r.match.goalsFor, weight: r.weight })));
  const overallAgainst = weightedAverage(ranked.map((r) => ({ value: r.match.goalsAgainst, weight: r.weight })));

  const homeFor =
    homeMatches.length > 0
      ? weightedAverage(homeMatches.map((r) => ({ value: r.match.goalsFor, weight: r.weight })))
      : overallFor;
  const homeAgainst =
    homeMatches.length > 0
      ? weightedAverage(homeMatches.map((r) => ({ value: r.match.goalsAgainst, weight: r.weight })))
      : overallAgainst;
  const awayFor =
    awayMatches.length > 0
      ? weightedAverage(awayMatches.map((r) => ({ value: r.match.goalsFor, weight: r.weight })))
      : overallFor;
  const awayAgainst =
    awayMatches.length > 0
      ? weightedAverage(awayMatches.map((r) => ({ value: r.match.goalsAgainst, weight: r.weight })))
      : overallAgainst;

  return {
    homeAttack: homeFor / league.avgHomeGoals,
    homeDefence: homeAgainst / league.avgAwayGoals,
    awayAttack: awayFor / league.avgAwayGoals,
    awayDefence: awayAgainst / league.avgHomeGoals,
    totalMatches: history.matches.length,
  };
}

/** lambda_home = homeAttack(H) x awayDefence(A) x leagueAvgHomeGoals, and the mirror for away. */
export function computeExpectedGoals(home: TeamHistory, away: TeamHistory, league: LeagueAverages) {
  const homeStrength = computeTeamStrength(home, league);
  const awayStrength = computeTeamStrength(away, league);

  return {
    home: homeStrength.homeAttack * awayStrength.awayDefence * league.avgHomeGoals,
    away: awayStrength.awayAttack * homeStrength.homeDefence * league.avgAwayGoals,
  };
}
