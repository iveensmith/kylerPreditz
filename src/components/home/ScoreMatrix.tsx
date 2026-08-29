/**
 * The signature motif: the score-probability grid the model actually produces.
 * Home goals down the side, away goals across the top, every cell shaded by how
 * likely that exact scoreline is. Every market UniquePredict publishes is read
 * off a grid like this one. Illustrative sample values (home xG 1.7, away 1.1),
 * computed here so the shading is real rather than eyeballed.
 */
const MAX_GOALS = 5;
const HOME_XG = 1.7;
const AWAY_XG = 1.1;

function poisson(k: number, lambda: number): number {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.exp(-lambda) * lambda ** k) / fact;
}

const homeP = Array.from({ length: MAX_GOALS + 1 }, (_, k) => poisson(k, HOME_XG));
const awayP = Array.from({ length: MAX_GOALS + 1 }, (_, k) => poisson(k, AWAY_XG));

const grid = homeP.map((hp, h) =>
  awayP.map((ap, a) => ({ h, a, p: hp * ap })),
);
const maxP = Math.max(...grid.flat().map((c) => c.p));

export function ScoreMatrix({ className = "" }: { className?: string }) {
  return (
    <figure className={`w-full max-w-sm ${className}`}>
      <div className="rounded-[var(--radius-card)] border border-white/12 bg-white/[0.03] p-4 backdrop-blur-sm">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow !text-white/45">Score matrix</span>
          <span className="font-mono text-[10px] text-white/40">xG 1.7 &ndash; 1.1</span>
        </div>

        <div className="mt-3 grid grid-cols-[auto_repeat(6,1fr)] gap-1">
          <div />
          {Array.from({ length: MAX_GOALS + 1 }, (_, a) => (
            <div key={`c${a}`} className="text-center font-mono text-[10px] text-white/40">
              {a}
            </div>
          ))}

          {grid.map((row, h) => (
            <FragmentRow key={`r${h}`} h={h} row={row} />
          ))}
        </div>

        <figcaption className="mt-3 border-t border-white/10 pt-3 text-[13px] leading-snug text-white/55">
          One grid per fixture. Every market &mdash; 1X2, over/under, BTTS, correct
          score &mdash; is added up straight off it.
        </figcaption>
      </div>
    </figure>
  );
}

function FragmentRow({ h, row }: { h: number; row: { h: number; a: number; p: number }[] }) {
  return (
    <>
      <div className="flex items-center justify-end pr-1 font-mono text-[10px] text-white/40">{h}</div>
      {row.map((cell) => {
        const intensity = Math.round((cell.p / maxP) * 100);
        const isModal = cell.p === maxP;
        return (
          <div
            key={`${cell.h}-${cell.a}`}
            className={`relative aspect-square rounded-[3px] ${
              isModal ? "ring-1 ring-inset ring-brand-light" : ""
            }`}
            style={{ backgroundColor: `color-mix(in oklab, var(--color-brand-light) ${intensity}%, transparent)` }}
            title={`${cell.h}-${cell.a}: ${(cell.p * 100).toFixed(1)}%`}
          >
            {isModal && (
              <span className="absolute inset-0 grid place-items-center font-mono text-[10px] font-semibold text-white">
                {cell.h}-{cell.a}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
