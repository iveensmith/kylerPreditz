"use client";

import { useSyncExternalStore } from "react";
import { formatKickoffTime } from "@/lib/format";

type LiveMatchStatusProps = {
  isHalftime: boolean;
  elapsedMinutes: number | null;
  kickoffUtc: Date;
  homeScore: number | null;
  awayScore: number | null;
};

/**
 * A match that has run this long past kickoff is almost certainly over - 90 min
 * plus a 15 min break plus stoppage plus a generous buffer. If we're still
 * showing it as live past this point, sync-results hasn't run recently, so we
 * stop trusting the frozen elapsed minute rather than imply the match is on.
 */
const STALE_AFTER_MINUTES = 150;

function subscribe(callback: () => void) {
  const id = setInterval(callback, 30_000);
  return () => clearInterval(id);
}

/**
 * The elapsed minute is a static value written by the sync job, not a running
 * clock. This component renders it, but once the match is clearly stale (see
 * STALE_AFTER_MINUTES) it falls back to the score alone so a finished match
 * never keeps displaying a live minute if a sync run is delayed or missed.
 *
 * useSyncExternalStore (not useState+useEffect): "is this stale" depends on the
 * client clock and legitimately differs from the server render. getServerSnapshot
 * returns false so SSR always shows the live minute (correct at render time and
 * good for first paint); the staleness fallback only kicks in client-side.
 */
export function LiveMatchStatus({
  isHalftime,
  elapsedMinutes,
  kickoffUtc,
  homeScore,
  awayScore,
}: LiveMatchStatusProps) {
  const kickoffMs = kickoffUtc.getTime();
  const isStale = useSyncExternalStore(
    subscribe,
    () => (Date.now() - kickoffMs) / 60_000 > STALE_AFTER_MINUTES,
    () => false,
  );

  const hasScore = homeScore !== null && awayScore !== null;

  if (isStale) {
    return hasScore ? (
      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
        {homeScore}-{awayScore}
      </span>
    ) : (
      <>{formatKickoffTime(kickoffUtc)}</>
    );
  }

  return (
    <span className="flex flex-col items-start gap-0.5">
      {hasScore && (
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {homeScore}-{awayScore}
        </span>
      )}
      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-semibold">
        <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400 animate-pulse" aria-hidden />
        {isHalftime ? "HT" : elapsedMinutes !== null ? `${elapsedMinutes}'` : "LIVE"}
      </span>
    </span>
  );
}
