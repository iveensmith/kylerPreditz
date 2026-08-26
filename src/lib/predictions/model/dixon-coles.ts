import { poissonPmf } from "./poisson";
import { DIXON_COLES_RHO, MAX_GOALS } from "./constants";

/**
 * Dixon-Coles low-score correction factor. Raw independent Poisson
 * underestimates 0-0, 1-0, 0-1 and 1-1; this reweights exactly those four
 * cells. All other (x,y) are unaffected (tau = 1).
 */
export function dixonColesTau(x: number, y: number, lambdaHome: number, lambdaAway: number, rho: number): number {
  if (x === 0 && y === 0) return 1 - lambdaHome * lambdaAway * rho;
  if (x === 0 && y === 1) return 1 + lambdaHome * rho;
  if (x === 1 && y === 0) return 1 + lambdaAway * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}

/**
 * Builds a normalized (homeGoals x awayGoals) score probability matrix,
 * combining independent Poisson distributions with the Dixon-Coles low-score
 * correction. matrix[x][y] = P(home scores x, away scores y).
 */
export function buildScoreMatrix(
  lambdaHome: number,
  lambdaAway: number,
  opts: { maxGoals?: number; rho?: number } = {},
): number[][] {
  const maxGoals = opts.maxGoals ?? MAX_GOALS;
  const rho = opts.rho ?? DIXON_COLES_RHO;

  const matrix: number[][] = [];
  let total = 0;

  for (let x = 0; x <= maxGoals; x++) {
    const row: number[] = [];
    for (let y = 0; y <= maxGoals; y++) {
      const raw =
        dixonColesTau(x, y, lambdaHome, lambdaAway, rho) * poissonPmf(x, lambdaHome) * poissonPmf(y, lambdaAway);
      row.push(Math.max(raw, 0));
      total += Math.max(raw, 0);
    }
    matrix.push(row);
  }

  if (total > 0) {
    for (let x = 0; x <= maxGoals; x++) {
      for (let y = 0; y <= maxGoals; y++) {
        matrix[x][y] /= total;
      }
    }
  }

  return matrix;
}
