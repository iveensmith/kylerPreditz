import { formatMarketLabel } from "@/lib/format";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { MatchStatus } from "@/components/ui/MatchStatus";
import type { getBankerOfTheDay } from "@/lib/queries/homepage";

type Banker = NonNullable<Awaited<ReturnType<typeof getBankerOfTheDay>>>;

export function BankerCard({ banker }: { banker: Banker }) {
  const { fixture } = banker;
  return (
    <section className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-amber-900 dark:text-amber-200">Banker of the Day</h2>
        <span className="text-xs text-amber-700 dark:text-amber-400">
          <MatchStatus
            status={fixture.status}
            elapsedMinutes={fixture.elapsedMinutes}
            kickoffUtc={fixture.kickoffUtc}
            homeScore={fixture.homeScore}
            awayScore={fixture.awayScore}
          />
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-sm">
          <TeamBadge name={fixture.homeTeam.name} logoUrl={fixture.homeTeam.logoUrl} />
          <TeamBadge name={fixture.awayTeam.name} logoUrl={fixture.awayTeam.logoUrl} />
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">{formatMarketLabel(banker.market)}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{banker.selection}</div>
          <span className="inline-flex items-center rounded-full bg-amber-600 text-white px-2 py-1 text-xs font-medium tabular-nums">
            {banker.confidence}%
          </span>
        </div>
      </div>
    </section>
  );
}
