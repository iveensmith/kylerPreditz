import type { Market, MatchOutcome } from "./types";

export type MatchScore = {
  homeGoals: number;
  awayGoals: number;
  htHomeGoals?: number;
  htAwayGoals?: number;
};

const won = (): MatchOutcome => "WON";
const lost = (): MatchOutcome => "LOST";

/** Settles a published pick against the final (or half-time) score. */
export function evaluateOutcome(market: Market, selection: string, score: MatchScore): MatchOutcome {
  const { homeGoals, awayGoals } = score;
  const total = homeGoals + awayGoals;
  const isDraw = homeGoals === awayGoals;

  switch (market) {
    case "HOME_WIN":
      return homeGoals > awayGoals ? won() : lost();
    case "AWAY_WIN":
      return awayGoals > homeGoals ? won() : lost();
    case "DRAW":
      return isDraw ? won() : lost();
    case "DOUBLE_CHANCE_1X":
      return homeGoals >= awayGoals ? won() : lost();
    case "DOUBLE_CHANCE_X2":
      return awayGoals >= homeGoals ? won() : lost();
    case "DOUBLE_CHANCE_12":
      return !isDraw ? won() : lost();
    case "DRAW_NO_BET_HOME":
      if (isDraw) return "VOID";
      return homeGoals > awayGoals ? won() : lost();
    case "DRAW_NO_BET_AWAY":
      if (isDraw) return "VOID";
      return awayGoals > homeGoals ? won() : lost();
    case "OVER_1_5":
      return total >= 2 ? won() : lost();
    case "UNDER_1_5":
      return total <= 1 ? won() : lost();
    case "OVER_2_5":
      return total >= 3 ? won() : lost();
    case "UNDER_2_5":
      return total <= 2 ? won() : lost();
    case "OVER_3_5":
      return total >= 4 ? won() : lost();
    case "UNDER_3_5":
      return total <= 3 ? won() : lost();
    case "BTTS_YES":
      return homeGoals >= 1 && awayGoals >= 1 ? won() : lost();
    case "BTTS_NO":
      return homeGoals === 0 || awayGoals === 0 ? won() : lost();
    case "CORRECT_SCORE": {
      const [selHome, selAway] = selection.split("-").map(Number);
      return selHome === homeGoals && selAway === awayGoals ? won() : lost();
    }
    case "HT_OVER_0_5": {
      if (score.htHomeGoals === undefined || score.htAwayGoals === undefined) return "VOID";
      return score.htHomeGoals + score.htAwayGoals >= 1 ? won() : lost();
    }
  }
}
