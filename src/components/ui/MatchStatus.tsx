import { FixtureStatus } from "@/generated/prisma/enums";
import { formatKickoffTime } from "@/lib/format";
import { LiveMatchStatus } from "@/components/ui/LiveMatchStatus";

type MatchStatusProps = {
  status: FixtureStatus;
  elapsedMinutes: number | null;
  kickoffUtc: Date;
  homeScore: number | null;
  awayScore: number | null;
};

const NON_LIVE_LABEL: Partial<Record<FixtureStatus, string>> = {
  POSTPONED: "Postponed",
  CANCELLED: "Cancelled",
  ABANDONED: "Abandoned",
};

/** Kickoff time for a scheduled fixture, or its live/final state once underway. */
export function MatchStatus({ status, elapsedMinutes, kickoffUtc, homeScore, awayScore }: MatchStatusProps) {
  const hasScore = homeScore !== null && awayScore !== null;

  if (status === FixtureStatus.LIVE || status === FixtureStatus.HALFTIME) {
    return (
      <LiveMatchStatus
        isHalftime={status === FixtureStatus.HALFTIME}
        elapsedMinutes={elapsedMinutes}
        kickoffUtc={kickoffUtc}
        homeScore={homeScore}
        awayScore={awayScore}
      />
    );
  }

  if (status === FixtureStatus.FINISHED && hasScore) {
    return (
      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
        {homeScore}-{awayScore}
      </span>
    );
  }

  const nonLiveLabel = NON_LIVE_LABEL[status];
  if (nonLiveLabel) {
    return <span className="text-xs text-zinc-400">{nonLiveLabel}</span>;
  }

  return <>{formatKickoffTime(kickoffUtc)}</>;
}
