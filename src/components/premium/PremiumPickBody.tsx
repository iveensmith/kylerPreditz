"use client";

import Link from "next/link";
import { formatMarketLabel } from "@/lib/format";
import { useRevealedPick } from "./useRevealedPicks";

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`} aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/**
 * The market / selection / confidence block of a highlighted pick card
 * (Tip of the Day, Banker, match detail). Locked → an "Unlock with Premium"
 * link; a member's browser swaps in the real pick via /api/premium/reveal.
 */
export function PremiumPickBody({
  fixtureId,
  tone = "dark",
}: {
  fixtureId: string;
  tone?: "dark" | "light";
}) {
  const pick = useRevealedPick(fixtureId);
  const sub = tone === "dark" ? "text-white/55" : "text-muted";
  const chip =
    tone === "dark"
      ? "bg-white/10 text-white"
      : "bg-brand text-white";

  if (!pick) {
    return (
      <Link
        href="/vip"
        className={`inline-flex items-center gap-2 text-sm font-semibold ${
          tone === "dark" ? "text-brand-light hover:text-white" : "text-brand hover:text-brand-hover"
        } transition-colors`}
      >
        <LockIcon />
        Unlock this pick with Premium
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold">
          {formatMarketLabel(pick.market as Parameters<typeof formatMarketLabel>[0])}
        </div>
        <div className={`text-xs ${sub}`}>{pick.selection}</div>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-semibold tabular-nums ${chip}`}
      >
        {pick.confidence}%
      </span>
    </div>
  );
}
