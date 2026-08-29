import Link from "next/link";
import { formatMarketLabel } from "@/lib/format";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { getRecentWinningTips } from "@/lib/queries/homepage";

type Tips = Awaited<ReturnType<typeof getRecentWinningTips>>;

export function RecentWinners({ tips }: { tips: Tips }) {
  if (tips.length === 0) return null;

  return (
    <section>
      <SectionHeading
        eyebrow="Settled"
        title="Recent winning tips"
        action={
          <Link href="/results" className="text-brand hover:underline">
            Full archive
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-sm"
          >
            <div className="mb-3 flex flex-col gap-1">
              <TeamBadge name={tip.fixture.homeTeam.name} logoUrl={tip.fixture.homeTeam.logoUrl} size={16} />
              <TeamBadge name={tip.fixture.awayTeam.name} logoUrl={tip.fixture.awayTeam.logoUrl} size={16} />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted">{formatMarketLabel(tip.market)}</span>
              <span className="inline-flex items-center rounded-full bg-win/12 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-win">
                Won
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
