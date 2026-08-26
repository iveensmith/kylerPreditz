"use client";

import { useSyncExternalStore } from "react";

function getRemainingSeconds(target: number): number {
  return Math.max(0, Math.floor((target - Date.now()) / 1000));
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function subscribe(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}

/**
 * useSyncExternalStore, not useState+useEffect: the countdown is a value driven by an
 * external clock that legitimately differs between server-render and the client - the
 * textbook case that hook exists for. getServerSnapshot returns 0 so hydration never
 * mismatches; the real ticking value only appears once mounted client-side.
 *
 * getSnapshot returns a plain number (total seconds), not an object - useSyncExternalStore
 * requires a snapshot that's reference-stable when nothing changed, and a fresh `{...}`
 * literal on every call never satisfies that, which manifests as "Maximum update depth
 * exceeded" (an infinite re-render loop), not just a lint warning.
 */
export function CountdownTimer({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime();
  const totalSeconds = useSyncExternalStore(subscribe, () => getRemainingSeconds(target), () => 0);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="flex gap-2">
      {[
        { label: "Hours", value: hours },
        { label: "Minutes", value: minutes },
        { label: "Seconds", value: seconds },
      ].map((unit) => (
        <div key={unit.label} className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-center">
          <div className="text-xl font-bold tabular-nums text-white">{pad(unit.value)}</div>
          <div className="text-[10px] uppercase tracking-wide text-zinc-400">{unit.label}</div>
        </div>
      ))}
    </div>
  );
}
