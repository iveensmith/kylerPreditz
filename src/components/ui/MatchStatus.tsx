import { FixtureStatus } from "@/generated/prisma/enums";
import { formatKickoffTime } from "@/lib/format";

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
      <span className="flex flex-col items-start gap-0.5">
        {hasScore && (
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {homeScore}-{awayScore}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400 animate-pulse" aria-hidden />
          {status === FixtureStatus.HALFTIME ? "HT" : elapsedMinutes !== null ? `${elapsedMinutes}'` : "LIVE"}
        </span>
      </span>
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
