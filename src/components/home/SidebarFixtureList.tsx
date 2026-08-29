import Link from "next/link";
import { formatKickoffTime } from "@/lib/format";
import { matchSlug } from "@/lib/queries/match-detail";
import type { FixtureWithTipInfo } from "@/lib/queries/types";

/** Fills the space below the sticky Tip of the Day card on desktop with more of today's fixtures. */
export function SidebarFixtureList({ fixtures }: { fixtures: FixtureWithTipInfo[] }) {
  if (fixtures.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-white/10 bg-[#0c1310] p-4 text-white">
      <h2 className="eyebrow !text-white/45">More today&rsquo;s fixtures</h2>
      <ul className="flex flex-col divide-y divide-white/8">
        {fixtures.map((fixture) => (
          <li key={fixture.id}>
            <Link
              href={`/predictions/${fixture.id}/${matchSlug(fixture.homeTeam.name, fixture.awayTeam.name)}`}
              className="flex items-center justify-between gap-2 py-2.5 text-xs transition-colors hover:text-brand-light"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase tracking-wide text-white/35">
                  {fixture.league.name}
                </span>
                <span className="truncate text-[13px]">
                  {fixture.homeTeam.name} <span className="text-white/35">v</span> {fixture.awayTeam.name}
                </span>
              </div>
              <span className="shrink-0 font-mono text-white/55 tabular-nums">
                {formatKickoffTime(fixture.kickoffUtc)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
