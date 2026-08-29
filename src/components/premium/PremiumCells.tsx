"use client";

import Link from "next/link";
import { formatMarketLabel } from "@/lib/format";
import { useRevealedPick } from "./useRevealedPicks";

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/**
 * The Tip / Odds / Confidence cells of a fixture row when the pick is premium.
 * Renders locked (a padlock + "Unlock" link) for non-members; swaps in the real
 * values once /api/premium/reveal answers for a member.
 */
export function PremiumCells({ fixtureId }: { fixtureId: string }) {
  const pick = useRevealedPick(fixtureId);

  if (!pick) {
    return (
      <>
        <td className="px-4 py-3.5 align-top">
          <Link
            href="/vip"
            className="inline-flex items-center gap-1.5 rounded border border-brand/35 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-brand transition-colors hover:bg-brand/5"
          >
            <LockIcon />
            Premium
          </Link>
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-sm text-faint">••</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-right align-top">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 font-mono text-xs text-faint">
            <LockIcon />
          </span>
        </td>
      </>
    );
  }

  return (
    <>
      <td className="px-4 py-3.5 align-top">
        <span className="w-fit rounded border border-brand/35 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-brand">
          {formatMarketLabel(pick.market as Parameters<typeof formatMarketLabel>[0])}
        </span>
        <span className="mt-1 block text-xs text-muted">{pick.selection}</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 align-top">
        <span className="font-mono text-sm tabular-nums text-ink">{pick.odds}</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right align-top">
        <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-white">
          {pick.confidence}%
        </span>
      </td>
    </>
  );
}
