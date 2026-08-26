import { DEFAULT_CONFIDENCE_FLOOR } from "./constants";
import type { MarketProbability } from "./types";

/** Highest-probability market that clears the floor, or null if none does. */
export function selectTopPick(
  markets: MarketProbability[],
  floor: number = DEFAULT_CONFIDENCE_FLOOR,
): MarketProbability | null {
  const eligible = markets.filter((m) => m.probability >= floor);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, m) => (m.probability > best.probability ? m : best));
}
