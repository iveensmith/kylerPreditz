import type { Metadata } from "next";
import Link from "next/link";
import { PredictionMarket, SettledStatus } from "@/generated/prisma/enums";
import { formatKickoffTime, formatMarketLabel } from "@/lib/format";
import { parseDateParam, toDateParam } from "@/lib/format";
import { getSettledCounts, getSettledPredictions, isValidMarket } from "@/lib/queries/results-archive";
import { absoluteUrl } from "@/lib/seo";
import { TeamBadge } from "@/components/ui/TeamBadge";

export const revalidate = 900;

const DESCRIPTION = "Every settled prediction, win or lose. Nothing is ever removed or edited.";

export const metadata: Metadata = {
  title: "Results Archive",
  description: DESCRIPTION,
  // Canonical points at the unfiltered archive - filter combinations (?date=&market=) aren't
  // separate indexable pages, they'd just create duplicate-content variants of the same page.
  alternates: { canonical: absoluteUrl("/results") },
  openGraph: { title: "Results Archive | kylerPredictz", description: DESCRIPTION, url: absoluteUrl("/results") },
};

const SETTLED_BADGE: Record<Exclude<SettledStatus, "PENDING">, string> = {
  WON: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  VOID: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
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
    <main className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">Results Archive</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Every settled prediction we&apos;ve published, win or lose. Nothing is ever removed or edited.
        </p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-emerald-700 dark:text-emerald-400 font-medium">{counts.won} Won</span>
        <span className="text-red-700 dark:text-red-400 font-medium">{counts.lost} Lost</span>
        <span className="text-zinc-500 dark:text-zinc-400">{counts.void} Void</span>
        {hitRate !== null && <span className="text-zinc-500 dark:text-zinc-400">- {hitRate}% hit rate</span>}
      </div>

      <form className="flex flex-wrap items-end gap-3 text-sm" method="get">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={date ? toDateParam(date) : ""}
            className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Market</span>
          <select
            name="market"
            defaultValue={market ?? ""}
            className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1.5"
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
          className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-1.5 font-medium"
        >
          Filter
        </button>
        {(date || market) && (
          <Link href="/results" className="text-zinc-500 dark:text-zinc-400 underline">
            Clear
          </Link>
        )}
      </form>

      {predictions.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">No settled predictions match this filter yet.</p>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {predictions.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 px-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-0.5">
                  <TeamBadge name={p.fixture.homeTeam.name} logoUrl={p.fixture.homeTeam.logoUrl} size={16} />
                  <TeamBadge name={p.fixture.awayTeam.name} logoUrl={p.fixture.awayTeam.logoUrl} size={16} />
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {formatKickoffTime(p.fixture.kickoffUtc)} - {formatMarketLabel(p.market)} - {p.selection}
                </div>
              </div>
              <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${SETTLED_BADGE[p.settledAs as Exclude<SettledStatus, "PENDING">]}`}>
                {p.settledAs}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
