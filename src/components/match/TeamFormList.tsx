import type { TeamContextStats } from "@/lib/predictions/ai/types";

const RESULT_LETTER: Record<"W" | "D" | "L", string> = { W: "bg-emerald-500", D: "bg-zinc-400", L: "bg-red-500" };

function resultLetter(teamScore: number, opponentScore: number): "W" | "D" | "L" {
  if (teamScore > opponentScore) return "W";
  if (teamScore < opponentScore) return "L";
  return "D";
}

export function TeamFormList({ teamName, stats }: { teamName: string; stats: TeamContextStats }) {
  return (
    <div>
      <h3 className="font-medium text-sm mb-2">{teamName} - Last {stats.last6Results.length} Results</h3>
      {stats.last6Results.length === 0 ? (
        <p className="text-xs text-zinc-400 italic">No recent results tracked yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {stats.last6Results.map((r, i) => {
            // r.score is always "homeScore-awayScore" for the actual fixture, regardless of which side this team was on.
            const [homeGoals, awayGoals] = r.score.split("-").map(Number);
            const letter = r.venue === "home" ? resultLetter(homeGoals, awayGoals) : resultLetter(awayGoals, homeGoals);
            return (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white font-medium shrink-0 ${RESULT_LETTER[letter]}`}
                >
                  {letter}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">{r.venue === "home" ? "vs" : "@"}</span>
                <span className="truncate flex-1">{r.opponent}</span>
                <span className="tabular-nums shrink-0">{r.score}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
