import { describe, expect, it } from "vitest";
import { deriveMarkets } from "./markets";
import { poissonPmf } from "./poisson";
import { HALF_TIME_GOAL_SCALE } from "./constants";

// Hand-crafted 2x2 matrix (indices = goals 0..1), values sum to exactly 1,
// so every market probability below can be verified by hand.
//        away=0  away=1
// home=0   0.4     0.1
// home=1   0.3     0.2
const MATRIX = [
  [0.4, 0.1],
  [0.3, 0.2],
];
const EXPECTED_GOALS = { home: 2, away: 1 };

function byMarket(markets: ReturnType<typeof deriveMarkets>, market: string) {
  const found = markets.find((m) => m.market === market);
  if (!found) throw new Error(`market ${market} not found`);
  return found;
}

describe("deriveMarkets", () => {
  const markets = deriveMarkets(MATRIX, EXPECTED_GOALS);

  it("computes 1X2 correctly", () => {
    expect(byMarket(markets, "HOME_WIN").probability).toBeCloseTo(0.3, 10);
    expect(byMarket(markets, "DRAW").probability).toBeCloseTo(0.6, 10);
    expect(byMarket(markets, "AWAY_WIN").probability).toBeCloseTo(0.1, 10);
  });

  it("computes double chance as sums of the base outcomes", () => {
    expect(byMarket(markets, "DOUBLE_CHANCE_1X").probability).toBeCloseTo(0.9, 10);
    expect(byMarket(markets, "DOUBLE_CHANCE_X2").probability).toBeCloseTo(0.7, 10);
    expect(byMarket(markets, "DOUBLE_CHANCE_12").probability).toBeCloseTo(0.4, 10);
  });

  it("computes draw no bet as renormalized win probabilities", () => {
    expect(byMarket(markets, "DRAW_NO_BET_HOME").probability).toBeCloseTo(0.75, 10);
    expect(byMarket(markets, "DRAW_NO_BET_AWAY").probability).toBeCloseTo(0.25, 10);
  });

  it("computes over/under 1.5 and 2.5 from total-goal cells", () => {
    expect(byMarket(markets, "OVER_1_5").probability).toBeCloseTo(0.2, 10);
    expect(byMarket(markets, "UNDER_1_5").probability).toBeCloseTo(0.8, 10);
    expect(byMarket(markets, "OVER_2_5").probability).toBeCloseTo(0, 10);
    expect(byMarket(markets, "UNDER_2_5").probability).toBeCloseTo(1, 10);
  });

  it("computes BTTS from the corner cell", () => {
    expect(byMarket(markets, "BTTS_YES").probability).toBeCloseTo(0.2, 10);
    expect(byMarket(markets, "BTTS_NO").probability).toBeCloseTo(0.8, 10);
  });

  it("picks the highest-probability cell for correct score", () => {
    const cs = byMarket(markets, "CORRECT_SCORE");
    expect(cs.selection).toBe("0-0");
    expect(cs.probability).toBeCloseTo(0.4, 10);
  });

  it("computes HT over 0.5 from scaled expected goals", () => {
    const expected =
      1 -
      poissonPmf(0, EXPECTED_GOALS.home * HALF_TIME_GOAL_SCALE) *
        poissonPmf(0, EXPECTED_GOALS.away * HALF_TIME_GOAL_SCALE);
    expect(byMarket(markets, "HT_OVER_0_5").probability).toBeCloseTo(expected, 10);
  });

  it("every probability is within [0,1]", () => {
    for (const m of markets) {
      expect(m.probability).toBeGreaterThanOrEqual(0);
      expect(m.probability).toBeLessThanOrEqual(1);
    }
  });
});
