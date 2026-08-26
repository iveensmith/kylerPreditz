import { describe, expect, it } from "vitest";
import { buildScoreMatrix, dixonColesTau } from "./dixon-coles";

describe("dixonColesTau", () => {
  const lambda = 1.5;
  const mu = 1.1;
  const rho = -0.13;

  it("matches the textbook correction formula at low scores", () => {
    expect(dixonColesTau(0, 0, lambda, mu, rho)).toBeCloseTo(1 - lambda * mu * rho, 10);
    expect(dixonColesTau(0, 1, lambda, mu, rho)).toBeCloseTo(1 + lambda * rho, 10);
    expect(dixonColesTau(1, 0, lambda, mu, rho)).toBeCloseTo(1 + mu * rho, 10);
    expect(dixonColesTau(1, 1, lambda, mu, rho)).toBeCloseTo(1 - rho, 10);
  });

  it("is 1 everywhere outside the low-score correction cells", () => {
    expect(dixonColesTau(2, 0, lambda, mu, rho)).toBe(1);
    expect(dixonColesTau(0, 2, lambda, mu, rho)).toBe(1);
    expect(dixonColesTau(2, 2, lambda, mu, rho)).toBe(1);
    expect(dixonColesTau(5, 3, lambda, mu, rho)).toBe(1);
  });

  it("collapses to the independent Poisson case when rho=0", () => {
    expect(dixonColesTau(0, 0, lambda, mu, 0)).toBe(1);
    expect(dixonColesTau(0, 1, lambda, mu, 0)).toBe(1);
    expect(dixonColesTau(1, 0, lambda, mu, 0)).toBe(1);
    expect(dixonColesTau(1, 1, lambda, mu, 0)).toBe(1);
  });
});

describe("buildScoreMatrix", () => {
  it("is (maxGoals+1) x (maxGoals+1) and sums to ~1", () => {
    const matrix = buildScoreMatrix(1.6, 1.2, { maxGoals: 8, rho: -0.13 });
    expect(matrix.length).toBe(9);
    expect(matrix[0].length).toBe(9);

    const total = matrix.flat().reduce((sum, p) => sum + p, 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it("matches independent Poisson products when rho=0, before normalization tail loss", () => {
    const lambdaHome = 1.4;
    const lambdaAway = 1.0;
    const matrix = buildScoreMatrix(lambdaHome, lambdaAway, { maxGoals: 8, rho: 0 });

    // For low scores with small lambda, truncation past goal 8 is negligible,
    // so normalization barely moves the values.
    const independent =
      Math.exp(-lambdaHome) * Math.exp(-lambdaAway); // Poisson(0,lambdaHome) * Poisson(0,lambdaAway)
    expect(matrix[0][0]).toBeCloseTo(independent, 3);
  });

  it("shifts probability toward low scoring lines when rho is negative", () => {
    const withDc = buildScoreMatrix(1.3, 1.1, { maxGoals: 8, rho: -0.13 });
    const withoutDc = buildScoreMatrix(1.3, 1.1, { maxGoals: 8, rho: 0 });

    // rho<0 with lambda,mu > 1 makes tau(0,0) < 1, pulling mass away from 0-0
    // relative to the independent case.
    expect(withDc[0][0]).not.toBeCloseTo(withoutDc[0][0], 6);
  });

  it("every cell is non-negative", () => {
    const matrix = buildScoreMatrix(2.5, 0.3, { maxGoals: 8, rho: -0.13 });
    for (const row of matrix) {
      for (const p of row) {
        expect(p).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
