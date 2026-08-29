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
    <div className="flex items-stretch gap-px overflow-hidden rounded-[var(--radius-control)] border border-white/10 bg-white/5 text-center font-mono">
      {[
        { label: "Hrs", value: hours },
        { label: "Min", value: minutes },
        { label: "Sec", value: seconds },
      ].map((unit) => (
        <div key={unit.label} className="flex-1 px-2 py-2.5">
          <div className="text-2xl font-semibold tabular-nums text-white">{pad(unit.value)}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-white/40">{unit.label}</div>
        </div>
      ))}
    </div>
  );
}
