import { formatMarketLabel } from "@/lib/format";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { MatchStatus } from "@/components/ui/MatchStatus";
import type { getBankerOfTheDay } from "@/lib/queries/homepage";

type Banker = NonNullable<Awaited<ReturnType<typeof getBankerOfTheDay>>>;

export function BankerCard({ banker }: { banker: Banker }) {
  const { fixture } = banker;
  return (
    <section className="rounded-[var(--radius-card)] border border-brand/30 bg-brand/[0.06] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="eyebrow !text-brand">Banker of the day</h2>
        <span className="font-mono text-xs text-muted">
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
        <div className="flex flex-col gap-1.5 text-sm">
          <TeamBadge name={fixture.homeTeam.name} logoUrl={fixture.homeTeam.logoUrl} />
          <TeamBadge name={fixture.awayTeam.name} logoUrl={fixture.awayTeam.logoUrl} />
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{formatMarketLabel(banker.market)}</div>
          <div className="mb-1.5 text-xs text-muted">{banker.selection}</div>
          <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-white">
            {banker.confidence}%
          </span>
        </div>
      </div>
    </section>
  );
}
