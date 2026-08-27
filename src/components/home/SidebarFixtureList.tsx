import Link from "next/link";
import { formatKickoffTime } from "@/lib/format";
import { matchSlug } from "@/lib/queries/match-detail";
import type { FixtureWithTipInfo } from "@/lib/queries/types";

/** Fills the space below the sticky Tip of the Day card on desktop with more of today's fixtures. */
export function SidebarFixtureList({ fixtures }: { fixtures: FixtureWithTipInfo[] }) {
  if (fixtures.length === 0) return null;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950 text-white p-4 flex flex-col gap-3">
      <h2 className="font-semibold text-brand-light">More Today&apos;s Fixtures</h2>
      <ul className="flex flex-col divide-y divide-zinc-800">
        {fixtures.map((fixture) => (
          <li key={fixture.id}>
            <Link
              href={`/predictions/${fixture.id}/${matchSlug(fixture.homeTeam.name, fixture.awayTeam.name)}`}
              className="flex items-center justify-between gap-2 py-2.5 text-xs hover:text-brand-light transition-colors"
            >
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="text-zinc-500">{fixture.league.name}</span>
                <span className="truncate">
                  {fixture.homeTeam.name} <span className="text-zinc-500">vs</span> {fixture.awayTeam.name}
                </span>
              </div>
              <span className="text-zinc-400 shrink-0 tabular-nums">{formatKickoffTime(fixture.kickoffUtc)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
