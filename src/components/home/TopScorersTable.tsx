import { TeamBadge } from "@/components/ui/TeamBadge";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { TopScorersByLeague } from "@/lib/queries/homepage";

export function TopScorersTable({ leagues }: { leagues: TopScorersByLeague }) {
  if (leagues.length === 0) return null;

  return (
    <section>
      <SectionHeading eyebrow="This season" title="Top scorers" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leagues.map((league) => (
          <div key={league.slug} className="overflow-hidden rounded-[var(--radius-card)] border border-line">
            <header className="border-b border-line bg-surface-2 px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-muted">
              {league.name}
            </header>
            <ul className="text-sm">
              {league.topScorers.map((scorer, i) => (
                <li
                  key={scorer.id}
                  className="flex items-center gap-2.5 border-b border-line px-3 py-2 last:border-b-0"
                >
                  <span className="w-4 shrink-0 text-right font-mono text-xs text-faint">{i + 1}</span>
                  <PlayerAvatar name={scorer.playerName} photoUrl={scorer.photoUrl} size={28} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{scorer.playerName}</span>
                    <TeamBadge name={scorer.team.name} logoUrl={scorer.team.logoUrl} size={14} />
                  </div>
                  <span className="ml-auto shrink-0 font-mono font-semibold tabular-nums">{scorer.goals}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
