import Link from "next/link";
import { formatDayMonthYear, formatKickoffTime } from "@/lib/format";
import type { RelatedMatch } from "@/lib/queries/match-detail";

/** Internal links to other upcoming predicted fixtures - keeps readers and
 *  crawlers moving through the deep match pages. */
export function RelatedMatches({ matches }: { matches: RelatedMatch[] }) {
  if (matches.length === 0) return null;

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line">
      {matches.map((m) => (
        <li key={m.id}>
          <Link
            href={`/predictions/${m.id}/${m.slug}`}
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-surface-2"
          >
            <span className="min-w-0">
              <span className="block truncate">
                {m.homeName} <span className="text-faint">v</span> {m.awayName}
              </span>
              <span className="block truncate font-mono text-[11px] uppercase tracking-wide text-faint">
                {m.leagueName}
              </span>
            </span>
            <span className="shrink-0 text-right font-mono text-[11px] text-muted">
              <span className="block">{formatDayMonthYear(m.kickoffUtc)}</span>
              <span className="block">{formatKickoffTime(m.kickoffUtc)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
