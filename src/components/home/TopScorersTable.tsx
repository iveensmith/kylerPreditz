import { TeamBadge } from "@/components/ui/TeamBadge";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { TopScorersByLeague } from "@/lib/queries/homepage";

export function TopScorersTable({ leagues }: { leagues: TopScorersByLeague }) {
  if (leagues.length === 0) return null;

  return (
    <section>
      <h2 className="font-semibold mb-3">Top Scorers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {leagues.map((league) => (
          <div key={league.slug} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <header className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-xs font-medium">
              {league.name}
            </header>
            <ul className="text-sm">
              {league.topScorers.map((scorer) => (
                <li
                  key={scorer.id}
                  className="flex items-center gap-2.5 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                >
                  <PlayerAvatar name={scorer.playerName} photoUrl={scorer.photoUrl} size={28} />
                  <div className="min-w-0 flex flex-col">
                    <span className="truncate">{scorer.playerName}</span>
                    <TeamBadge name={scorer.team.name} logoUrl={scorer.team.logoUrl} size={14} />
                  </div>
                  <span className="tabular-nums font-medium shrink-0 ml-auto">{scorer.goals}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
