import { formatMarketLabel } from "@/lib/format";
import { TeamBadge } from "@/components/ui/TeamBadge";
import type { getRecentWinningTips } from "@/lib/queries/homepage";

type Tips = Awaited<ReturnType<typeof getRecentWinningTips>>;

export function RecentWinners({ tips }: { tips: Tips }) {
  if (tips.length === 0) return null;

  return (
    <section>
      <h2 className="font-semibold mb-3">Recent Winning Tips</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tips.map((tip) => (
          <div key={tip.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 text-sm">
            <div className="flex flex-col gap-1 mb-2">
              <TeamBadge name={tip.fixture.homeTeam.name} logoUrl={tip.fixture.homeTeam.logoUrl} size={16} />
              <TeamBadge name={tip.fixture.awayTeam.name} logoUrl={tip.fixture.awayTeam.logoUrl} size={16} />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>{formatMarketLabel(tip.market)}</span>
              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 font-medium">
                WON
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
