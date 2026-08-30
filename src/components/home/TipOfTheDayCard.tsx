import { FixtureStatus } from "@/generated/prisma/enums";
import { formatMarketLabel } from "@/lib/format";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { MatchStatus } from "@/components/ui/MatchStatus";
import { CountdownTimer } from "./CountdownTimer";
import type { getBankerOfTheDay } from "@/lib/queries/homepage";

// The public banker is always a free pick - pending premium picks are filtered
// out in getBankerOfTheDay, so there is no locked state to handle here.
type Banker = NonNullable<Awaited<ReturnType<typeof getBankerOfTheDay>>>;

export function TipOfTheDayCard({ banker }: { banker: Banker }) {
  const { fixture } = banker;

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-white/10 bg-[#0c1310] p-5 text-white md:sticky md:top-20">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow !text-brand-light">Tip of the day</h2>
        <span className="font-mono text-[11px] font-semibold tabular-nums text-brand-light">
          {banker.confidence}%
        </span>
      </div>

      <div className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-wide text-white/40">
        <span>{fixture.league.name}</span>
        {fixture.status !== FixtureStatus.SCHEDULED && (
          <MatchStatus
            status={fixture.status}
            elapsedMinutes={fixture.elapsedMinutes}
            kickoffUtc={fixture.kickoffUtc}
            homeScore={fixture.homeScore}
            awayScore={fixture.awayScore}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <TeamBadge name={fixture.homeTeam.name} logoUrl={fixture.homeTeam.logoUrl} size={30} />
        <span className="shrink-0 font-mono text-[10px] uppercase text-white/35">v</span>
        <div className="flex min-w-0 flex-1 justify-end">
          <TeamBadge name={fixture.awayTeam.name} logoUrl={fixture.awayTeam.logoUrl} size={30} />
        </div>
      </div>

      {fixture.status === FixtureStatus.SCHEDULED && (
        <CountdownTimer targetIso={fixture.kickoffUtc.toISOString()} />
      )}

      <div className="border-t border-white/10 pt-3">
        <div className="text-sm font-semibold">{formatMarketLabel(banker.market)}</div>
        <div className="text-xs text-white/55">{banker.selection}</div>
      </div>
    </section>
  );
}
