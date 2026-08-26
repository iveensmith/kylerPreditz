import { buildScoreMatrix } from "./dixon-coles";
import { deriveMarkets } from "./markets";
import { selectTopPick } from "./select";
import { computeExpectedGoals } from "./strength";
import { DEFAULT_CONFIDENCE_FLOOR, MIN_MATCHES_REQUIRED } from "./constants";
import type { FixtureInput, PredictionResult } from "./types";

/**
 * Stage 1 of the prediction engine: pure statistical model, no DB/network/LLM.
 * Poisson + Dixon-Coles over recency-weighted attack/defence strength.
 */
export function predictFixture(input: FixtureInput, floor: number = DEFAULT_CONFIDENCE_FLOOR): PredictionResult {
  const homeCount = input.home.matches.length;
  const awayCount = input.away.matches.length;
  if (homeCount < MIN_MATCHES_REQUIRED || awayCount < MIN_MATCHES_REQUIRED) {
    return {
      skip: true,
      reason: `insufficient match history (home=${homeCount}, away=${awayCount}, need >= ${MIN_MATCHES_REQUIRED})`,
    };
  }

  const expectedGoals = computeExpectedGoals(input.home, input.away, input.league);
  const matrix = buildScoreMatrix(expectedGoals.home, expectedGoals.away);
  const markets = deriveMarkets(matrix, expectedGoals);
  const topPick = selectTopPick(markets, floor);

  if (!topPick) {
    return {
      skip: true,
      reason: `no market cleared the ${Math.round(floor * 100)}% confidence floor`,
      markets,
    };
  }

  return {
    skip: false,
    expectedGoals,
    markets,
    topPick,
    confidence: Math.round(topPick.probability * 100),
    odds: Math.round((1 / topPick.probability) * 100) / 100,
  };
}
