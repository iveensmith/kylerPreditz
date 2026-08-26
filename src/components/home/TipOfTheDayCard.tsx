import { FixtureStatus } from "@/generated/prisma/enums";
import { formatMarketLabel } from "@/lib/format";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { MatchStatus } from "@/components/ui/MatchStatus";
import { CountdownTimer } from "./CountdownTimer";
import type { getBankerOfTheDay } from "@/lib/queries/homepage";

type Banker = NonNullable<Awaited<ReturnType<typeof getBankerOfTheDay>>>;

export function TipOfTheDayCard({ banker }: { banker: Banker }) {
  const { fixture } = banker;

  return (
    <section className="md:sticky md:top-20 w-full md:w-72 shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 text-white p-4 flex flex-col gap-4">
      <h2 className="font-semibold text-brand-light">Tip of the Day</h2>

      <div className="text-xs text-zinc-400 flex flex-col gap-1">
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

      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <TeamBadge name={fixture.homeTeam.name} logoUrl={fixture.homeTeam.logoUrl} size={28} />
        </div>
        <span className="text-xs text-zinc-500 shrink-0">vs</span>
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <TeamBadge name={fixture.awayTeam.name} logoUrl={fixture.awayTeam.logoUrl} size={28} />
        </div>
      </div>

      {fixture.status === FixtureStatus.SCHEDULED && <CountdownTimer targetIso={fixture.kickoffUtc.toISOString()} />}

      <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{formatMarketLabel(banker.market)}</div>
          <div className="text-xs text-zinc-400">{banker.selection}</div>
        </div>
        <span className="inline-flex items-center rounded-full bg-brand text-white px-2.5 py-1 text-xs font-semibold tabular-nums">
          {banker.confidence}%
        </span>
      </div>
    </section>
  );
}
