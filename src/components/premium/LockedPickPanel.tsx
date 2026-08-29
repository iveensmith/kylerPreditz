"use client";

import Link from "next/link";
import { formatMarketLabel } from "@/lib/format";
import { useRevealedPick } from "./useRevealedPicks";

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** The "Our pick" panel on the match page when the pick is premium. */
export function LockedPickPanel({ fixtureId }: { fixtureId: string }) {
  const pick = useRevealedPick(fixtureId);

  if (!pick) {
    return (
      <section className="rounded-[var(--radius-card)] border border-brand/30 bg-brand/[0.06] p-5">
        <div className="eyebrow !text-brand">Our pick</div>
        <div className="mt-3 flex items-start gap-3">
          <LockIcon />
          <div>
            <div className="text-lg font-semibold">This is a Premium pick</div>
            <p className="mt-0.5 text-sm text-muted">
              Our highest-confidence selections are members-only. The form, head-to-head and stats
              below stay free.
            </p>
          </div>
        </div>
        <Link
          href="/vip"
          className="mt-4 inline-flex items-center rounded-[var(--radius-control)] bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Go Premium
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-brand/30 bg-brand/[0.06] p-5">
      <div className="eyebrow !text-brand">Our pick</div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold">
            {formatMarketLabel(pick.market as Parameters<typeof formatMarketLabel>[0])}
          </div>
          <div className="text-sm text-muted">{pick.selection}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-3xl font-semibold leading-none tabular-nums text-brand">
            {pick.confidence}%
          </div>
          <div className="eyebrow mt-1.5">
            Odds <span className="text-ink">{pick.odds}</span>
          </div>
        </div>
      </div>
      <p className="mt-4 border-t border-brand/20 pt-4 text-xs text-faint">
        Full write-up and the complete market grid are on your{" "}
        <Link href="/dashboard" className="text-brand underline">
          dashboard
        </Link>
        .
      </p>
    </section>
  );
}
