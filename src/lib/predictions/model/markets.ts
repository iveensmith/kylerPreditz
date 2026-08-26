import { poissonPmf } from "./poisson";
import { HALF_TIME_GOAL_SCALE } from "./constants";
import type { ExpectedGoals, MarketProbability } from "./types";

function sumWhere(matrix: number[][], predicate: (home: number, away: number) => boolean): number {
  let sum = 0;
  for (let x = 0; x < matrix.length; x++) {
    for (let y = 0; y < matrix[x].length; y++) {
      if (predicate(x, y)) sum += matrix[x][y];
    }
  }
  return sum;
}

/** Derives every published market's probability from a score matrix. */
export function deriveMarkets(matrix: number[][], expectedGoals: ExpectedGoals): MarketProbability[] {
  const pHome = sumWhere(matrix, (x, y) => x > y);
  const pDraw = sumWhere(matrix, (x, y) => x === y);
  const pAway = sumWhere(matrix, (x, y) => x < y);
  const pDecisive = pHome + pAway;

  const over1_5 = sumWhere(matrix, (x, y) => x + y >= 2);
  const over2_5 = sumWhere(matrix, (x, y) => x + y >= 3);
  const over3_5 = sumWhere(matrix, (x, y) => x + y >= 4);
  const bttsYes = sumWhere(matrix, (x, y) => x >= 1 && y >= 1);

  let bestX = 0;
  let bestY = 0;
  let bestP = -1;
  for (let x = 0; x < matrix.length; x++) {
    for (let y = 0; y < matrix[x].length; y++) {
      if (matrix[x][y] > bestP) {
        bestP = matrix[x][y];
        bestX = x;
        bestY = y;
      }
    }
  }

  const htHome = expectedGoals.home * HALF_TIME_GOAL_SCALE;
  const htAway = expectedGoals.away * HALF_TIME_GOAL_SCALE;
  const htOver0_5 = 1 - poissonPmf(0, htHome) * poissonPmf(0, htAway);

  return [
    { market: "HOME_WIN", selection: "Home", probability: pHome },
    { market: "AWAY_WIN", selection: "Away", probability: pAway },
    { market: "DRAW", selection: "Draw", probability: pDraw },
    { market: "DOUBLE_CHANCE_1X", selection: "Home or Draw", probability: pHome + pDraw },
    { market: "DOUBLE_CHANCE_X2", selection: "Draw or Away", probability: pDraw + pAway },
    { market: "DOUBLE_CHANCE_12", selection: "Home or Away", probability: pHome + pAway },
    {
      market: "DRAW_NO_BET_HOME",
      selection: "Home (DNB)",
      probability: pDecisive > 0 ? pHome / pDecisive : 0,
    },
    {
      market: "DRAW_NO_BET_AWAY",
      selection: "Away (DNB)",
      probability: pDecisive > 0 ? pAway / pDecisive : 0,
    },
    { market: "OVER_1_5", selection: "Over 1.5", probability: over1_5 },
    { market: "UNDER_1_5", selection: "Under 1.5", probability: 1 - over1_5 },
    { market: "OVER_2_5", selection: "Over 2.5", probability: over2_5 },
    { market: "UNDER_2_5", selection: "Under 2.5", probability: 1 - over2_5 },
    { market: "OVER_3_5", selection: "Over 3.5", probability: over3_5 },
    { market: "UNDER_3_5", selection: "Under 3.5", probability: 1 - over3_5 },
    { market: "BTTS_YES", selection: "Yes", probability: bttsYes },
    { market: "BTTS_NO", selection: "No", probability: 1 - bttsYes },
    { market: "CORRECT_SCORE", selection: `${bestX}-${bestY}`, probability: bestP },
    { market: "HT_OVER_0_5", selection: "Over 0.5 (HT)", probability: htOver0_5 },
  ];
}
