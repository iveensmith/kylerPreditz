import { TeamBadge } from "@/components/ui/TeamBadge";

type StandingRow = {
  id: string;
  rank: number;
  played: number;
  points: number;
  goalDiff: number;
  team: {
    id: string;
    name: string;
    logoUrl: string | null;
    stats: { wins: number; draws: number; losses: number; form: string | null }[];
  };
};

export function StandingsTable({
  rows,
  highlightTeamIds = [],
}: {
  rows: StandingRow[];
  highlightTeamIds?: string[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No table available for this competition yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Team</th>
            <th className="px-2 py-2 text-right font-medium">P</th>
            <th className="px-2 py-2 text-right font-medium">W</th>
            <th className="px-2 py-2 text-right font-medium">D</th>
            <th className="px-2 py-2 text-right font-medium">L</th>
            <th className="px-2 py-2 text-right font-medium">GD</th>
            <th className="px-3 py-2 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const s = row.team.stats[0];
            const highlighted = highlightTeamIds.includes(row.team.id);
            return (
              <tr
                key={row.id}
                className={`border-t border-line ${highlighted ? "bg-brand/[0.07]" : ""}`}
              >
                <td className="px-3 py-2 font-mono text-muted tabular-nums">{row.rank}</td>
                <td className="px-3 py-2">
                  <span className={highlighted ? "font-semibold" : ""}>
                    <TeamBadge name={row.team.name} logoUrl={row.team.logoUrl} size={16} />
                  </span>
                </td>
                <td className="px-2 py-2 text-right font-mono tabular-nums">{row.played}</td>
                <td className="px-2 py-2 text-right font-mono tabular-nums">{s?.wins ?? "—"}</td>
                <td className="px-2 py-2 text-right font-mono tabular-nums">{s?.draws ?? "—"}</td>
                <td className="px-2 py-2 text-right font-mono tabular-nums">{s?.losses ?? "—"}</td>
                <td className="px-2 py-2 text-right font-mono tabular-nums">
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
