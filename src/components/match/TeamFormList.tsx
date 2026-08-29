import type { TeamContextStats } from "@/lib/predictions/ai/types";

const RESULT_LETTER: Record<"W" | "D" | "L", string> = {
  W: "bg-win/15 text-win",
  D: "bg-surface-2 text-muted",
  L: "bg-loss/15 text-loss",
};

function resultLetter(teamScore: number, opponentScore: number): "W" | "D" | "L" {
  if (teamScore > opponentScore) return "W";
  if (teamScore < opponentScore) return "L";
  return "D";
}

export function TeamFormList({ teamName, stats }: { teamName: string; stats: TeamContextStats }) {
  return (
    <div>
      <div className="eyebrow mb-2.5">
        {teamName} &middot; last {stats.last6Results.length}
      </div>
      {stats.last6Results.length === 0 ? (
        <p className="text-xs italic text-faint">No recent results tracked yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {stats.last6Results.map((r, i) => {
            // r.score is always "homeScore-awayScore" for the actual fixture, regardless of which side this team was on.
            const [homeGoals, awayGoals] = r.score.split("-").map(Number);
            const letter =
              r.venue === "home" ? resultLetter(homeGoals, awayGoals) : resultLetter(awayGoals, homeGoals);
            return (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] font-mono text-[10px] font-bold ${RESULT_LETTER[letter]}`}
                >
                  {letter}
                </span>
                <span className="font-mono text-faint">{r.venue === "home" ? "v" : "@"}</span>
                <span className="flex-1 truncate">{r.opponent}</span>
                <span className="shrink-0 font-mono tabular-nums text-muted">{r.score}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
