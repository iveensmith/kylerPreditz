import Link from "next/link";
import { formatKickoffTime, formatMarketLabel } from "@/lib/format";
import { matchSlug } from "@/lib/queries/match-detail";
import { TeamBadge } from "@/components/ui/TeamBadge";
import type { PremiumPick } from "@/lib/queries/premium";

function dayLabel(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Lagos",
  }).format(d);
}

export function PremiumPicksList({ picks }: { picks: PremiumPick[] }) {
  if (picks.length === 0) {
    return (
      <p className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-5 text-sm text-muted">
        No Premium picks live right now. New selections are published each morning &mdash; check back
        before kickoff.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {picks.map((pick) => {
        const { fixture } = pick;
        const href = `/predictions/${fixture.id}/${matchSlug(fixture.homeTeam.name, fixture.awayTeam.name)}`;
        return (
          <li
            key={pick.id}
            className="rounded-[var(--radius-card)] border border-brand/30 bg-brand/[0.05] p-4"
          >
            <div className="eyebrow flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{fixture.league.name}</span>
              <span aria-hidden>&middot;</span>
              <span>
                {dayLabel(fixture.kickoffUtc)} {formatKickoffTime(fixture.kickoffUtc)}
              </span>
            </div>

            <div className="mt-3 flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5 text-sm">
                <TeamBadge name={fixture.homeTeam.name} logoUrl={fixture.homeTeam.logoUrl} />
                <TeamBadge name={fixture.awayTeam.name} logoUrl={fixture.awayTeam.logoUrl} />
              </div>

              <div className="shrink-0 text-right">
                <div className="font-mono text-2xl font-semibold leading-none tabular-nums text-brand">
                  {pick.confidence}%
                </div>
                <div className="eyebrow mt-1">
                  Odds <span className="text-ink">{pick.odds.toString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 border-t border-brand/20 pt-3">
              <div className="text-sm font-semibold">{formatMarketLabel(pick.market)}</div>
              <div className="text-xs text-muted">{pick.selection}</div>
              {pick.reasoning && (
                <p className="mt-2 text-xs leading-relaxed text-ink/70">{pick.reasoning}</p>
              )}
              <Link
                href={href}
                className="mt-2 inline-block font-mono text-[11px] uppercase tracking-wide text-brand hover:underline"
              >
                Full analysis &rarr;
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
