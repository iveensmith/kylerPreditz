import { describe, expect, it } from "vitest";
import { poissonPmf } from "./poisson";

describe("poissonPmf", () => {
  it("matches known values for lambda=2", () => {
    // Textbook Poisson(lambda=2) values.
    expect(poissonPmf(0, 2)).toBeCloseTo(0.135335, 5);
    expect(poissonPmf(1, 2)).toBeCloseTo(0.270671, 5);
    expect(poissonPmf(2, 2)).toBeCloseTo(0.270671, 5);
    expect(poissonPmf(3, 2)).toBeCloseTo(0.180447, 5);
    expect(poissonPmf(4, 2)).toBeCloseTo(0.090224, 5);
  });

  it("matches known values for lambda=1.5", () => {
    expect(poissonPmf(0, 1.5)).toBeCloseTo(0.223130, 5);
    expect(poissonPmf(1, 1.5)).toBeCloseTo(0.334695, 5);
    expect(poissonPmf(2, 1.5)).toBeCloseTo(0.251021, 5);
  });

  it("sums to ~1 across a wide enough range", () => {
    const lambda = 1.8;
    let total = 0;
    for (let k = 0; k <= 30; k++) total += poissonPmf(k, lambda);
    expect(total).toBeCloseTo(1, 6);
  });

  it("returns 0 for negative k", () => {
    expect(poissonPmf(-1, 2)).toBe(0);
  });

  it("handles lambda=0 as a point mass at 0", () => {
    expect(poissonPmf(0, 0)).toBe(1);
    expect(poissonPmf(1, 0)).toBe(0);
  });
});
