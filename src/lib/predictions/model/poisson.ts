/** P(X = k) for X ~ Poisson(lambda). */
export function poissonPmf(k: number, lambda: number): number {
  if (k < 0 || !Number.isInteger(k)) return 0;
  if (lambda === 0) return k === 0 ? 1 : 0;

  // log-space to avoid overflow from k! / lambda^k at larger k.
  let logPmf = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) {
    logPmf -= Math.log(i);
  }
  return Math.exp(logPmf);
}
