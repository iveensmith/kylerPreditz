import { describe, expect, it } from "vitest";
import { evaluateOutcome } from "./evaluate";

describe("evaluateOutcome", () => {
  it("settles 1X2 markets", () => {
    expect(evaluateOutcome("HOME_WIN", "Home", { homeGoals: 2, awayGoals: 1 })).toBe("WON");
    expect(evaluateOutcome("HOME_WIN", "Home", { homeGoals: 1, awayGoals: 1 })).toBe("LOST");
    expect(evaluateOutcome("AWAY_WIN", "Away", { homeGoals: 0, awayGoals: 2 })).toBe("WON");
    expect(evaluateOutcome("DRAW", "Draw", { homeGoals: 1, awayGoals: 1 })).toBe("WON");
    expect(evaluateOutcome("DRAW", "Draw", { homeGoals: 1, awayGoals: 0 })).toBe("LOST");
  });

  it("settles double chance markets", () => {
    expect(evaluateOutcome("DOUBLE_CHANCE_1X", "Home or Draw", { homeGoals: 1, awayGoals: 1 })).toBe("WON");
    expect(evaluateOutcome("DOUBLE_CHANCE_1X", "Home or Draw", { homeGoals: 0, awayGoals: 1 })).toBe("LOST");
    expect(evaluateOutcome("DOUBLE_CHANCE_12", "Home or Away", { homeGoals: 1, awayGoals: 1 })).toBe("LOST");
  });

  it("voids draw no bet on a draw, otherwise settles normally", () => {
    expect(evaluateOutcome("DRAW_NO_BET_HOME", "Home (DNB)", { homeGoals: 1, awayGoals: 1 })).toBe("VOID");
    expect(evaluateOutcome("DRAW_NO_BET_HOME", "Home (DNB)", { homeGoals: 2, awayGoals: 1 })).toBe("WON");
    expect(evaluateOutcome("DRAW_NO_BET_HOME", "Home (DNB)", { homeGoals: 0, awayGoals: 1 })).toBe("LOST");
  });

  it("settles over/under on total goals", () => {
    expect(evaluateOutcome("OVER_2_5", "Over 2.5", { homeGoals: 2, awayGoals: 1 })).toBe("WON");
    expect(evaluateOutcome("OVER_2_5", "Over 2.5", { homeGoals: 1, awayGoals: 1 })).toBe("LOST");
    expect(evaluateOutcome("UNDER_1_5", "Under 1.5", { homeGoals: 1, awayGoals: 0 })).toBe("WON");
    expect(evaluateOutcome("UNDER_1_5", "Under 1.5", { homeGoals: 1, awayGoals: 1 })).toBe("LOST");
  });

  it("settles BTTS", () => {
    expect(evaluateOutcome("BTTS_YES", "Yes", { homeGoals: 1, awayGoals: 1 })).toBe("WON");
    expect(evaluateOutcome("BTTS_YES", "Yes", { homeGoals: 0, awayGoals: 2 })).toBe("LOST");
    expect(evaluateOutcome("BTTS_NO", "No", { homeGoals: 0, awayGoals: 2 })).toBe("WON");
  });

  it("settles correct score by parsing the selection", () => {
    expect(evaluateOutcome("CORRECT_SCORE", "2-1", { homeGoals: 2, awayGoals: 1 })).toBe("WON");
    expect(evaluateOutcome("CORRECT_SCORE", "2-1", { homeGoals: 1, awayGoals: 2 })).toBe("LOST");
  });

  it("settles HT over 0.5 when HT scores are known, voids otherwise", () => {
    expect(
      evaluateOutcome("HT_OVER_0_5", "Over 0.5 (HT)", {
        homeGoals: 2,
        awayGoals: 1,
        htHomeGoals: 1,
        htAwayGoals: 0,
      }),
    ).toBe("WON");
    expect(
      evaluateOutcome("HT_OVER_0_5", "Over 0.5 (HT)", {
        homeGoals: 2,
        awayGoals: 1,
        htHomeGoals: 0,
        htAwayGoals: 0,
      }),
    ).toBe("LOST");
    expect(evaluateOutcome("HT_OVER_0_5", "Over 0.5 (HT)", { homeGoals: 2, awayGoals: 1 })).toBe("VOID");
  });
});
