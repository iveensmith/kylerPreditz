import type { Metadata } from "next";
import Link from "next/link";
import { PredictionMarket, SettledStatus } from "@/generated/prisma/enums";
import { formatKickoffTime, formatMarketLabel } from "@/lib/format";
import { parseDateParam, toDateParam } from "@/lib/format";
import { getSettledCounts, getSettledPredictions, isValidMarket } from "@/lib/queries/results-archive";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { TeamBadge } from "@/components/ui/TeamBadge";

export const revalidate = 900;

const DESCRIPTION = "Every settled prediction, win or lose. Nothing is ever removed or edited.";

export const metadata: Metadata = {
  title: "Results Archive",
  description: DESCRIPTION,
  // Canonical points at the unfiltered archive - filter combinations (?date=&market=) aren't
  // separate indexable pages, they'd just create duplicate-content variants of the same page.
  alternates: { canonical: absoluteUrl("/results") },
  openGraph: { title: `Results Archive | ${SITE_NAME}`, description: DESCRIPTION, url: absoluteUrl("/results") },
};

const SETTLED_BADGE: Record<Exclude<SettledStatus, "PENDING">, string> = {
  WON: "bg-win/12 text-win",
  LOST: "bg-loss/12 text-loss",
  VOID: "bg-surface-2 text-muted",
};

type Props = { searchParams: Promise<{ date?: string; market?: string }> };

export default async function ResultsPage({ searchParams }: Props) {
  const params = await searchParams;
  const date = params.date ? parseDateParam(params.date) : undefined;
  const market = params.market && isValidMarket(params.market) ? params.market : undefined;

  const [predictions, counts] = await Promise.all([
    getSettledPredictions({ date, market }),
    getSettledCounts({ date, market }),
  ]);

  const total = counts.won + counts.lost + counts.void;
  const hitRate = total > 0 ? Math.round((counts.won / (counts.won + counts.lost || 1)) * 100) : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="border-b border-line pb-5">
        <div className="eyebrow mb-2">Every settled tip</div>
        <h1 className="text-[2rem] leading-[1.05] sm:text-4xl">Results archive</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Every prediction we&apos;ve published, win or lose. Nothing is ever removed or edited.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-4">
        {[
          { label: "Won", value: counts.won, tone: "text-win" },
          { label: "Lost", value: counts.lost, tone: "text-loss" },
          { label: "Void", value: counts.void, tone: "text-muted" },
          { label: "Hit rate", value: hitRate !== null ? `${hitRate}%` : "—", tone: "text-ink" },
        ].map((s) => (
          <div key={s.label} className="bg-surface px-4 py-3.5">
            <div className={`font-mono text-2xl font-semibold tabular-nums ${s.tone}`}>{s.value}</div>
            <div className="eyebrow mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-3 text-sm" method="get">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={date ? toDateParam(date) : ""}
            className="rounded-md border border-line bg-transparent px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Market</span>
          <select
            name="market"
            defaultValue={market ?? ""}
            className="rounded-md border border-line bg-transparent px-2 py-1.5"
          >
            <option value="">All markets</option>
            {Object.values(PredictionMarket).map((m) => (
              <option key={m} value={m}>
                {formatMarketLabel(m)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-[var(--radius-control)] bg-brand px-4 py-2 font-medium text-white transition-colors hover:bg-brand-hover"
        >
          Filter
        </button>
        {(date || market) && (
          <Link href="/results" className="text-muted underline">
            Clear
          </Link>
        )}
      </form>

      {predictions.length === 0 ? (
        <p className="text-muted text-sm">No settled predictions match this filter yet.</p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
          {predictions.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 text-sm last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-0.5">
                  <TeamBadge name={p.fixture.homeTeam.name} logoUrl={p.fixture.homeTeam.logoUrl} size={16} />
                  <TeamBadge name={p.fixture.awayTeam.name} logoUrl={p.fixture.awayTeam.logoUrl} size={16} />
                </div>
                <div className="mt-1.5 font-mono text-[11px] uppercase tracking-wide text-faint">
                  {formatKickoffTime(p.fixture.kickoffUtc)} &middot; {formatMarketLabel(p.market)} &middot; {p.selection}
                </div>
              </div>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${SETTLED_BADGE[p.settledAs as Exclude<SettledStatus, "PENDING">]}`}
              >
                {p.settledAs}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
