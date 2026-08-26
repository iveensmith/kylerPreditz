import { describe, expect, it } from "vitest";
import { selectTopPick } from "./select";
import type { MarketProbability } from "./types";

const MARKETS: MarketProbability[] = [
  { market: "HOME_WIN", selection: "Home", probability: 0.55 },
  { market: "OVER_1_5", selection: "Over 1.5", probability: 0.7 },
  { market: "DOUBLE_CHANCE_1X", selection: "Home or Draw", probability: 0.8 },
  { market: "BTTS_NO", selection: "No", probability: 0.6 },
];

describe("selectTopPick", () => {
  it("picks the highest-probability market that clears the floor", () => {
    const pick = selectTopPick(MARKETS, 0.65);
    expect(pick?.market).toBe("DOUBLE_CHANCE_1X");
  });

  it("returns null when nothing clears the floor", () => {
    expect(selectTopPick(MARKETS, 0.95)).toBeNull();
  });

  it("returns null for an empty market list", () => {
    expect(selectTopPick([], 0.5)).toBeNull();
  });
});
