import Image from "next/image";
import type { RecentFixture } from "@/lib/queries/match-detail-extras";

const BADGE: Record<"W" | "D" | "L", string> = {
  W: "bg-win/15 text-win",
  D: "bg-surface-2 text-muted",
  L: "bg-loss/15 text-loss",
};

export function TeamRecentFixtures({
  teamName,
  fixtures,
}: {
  teamName: string;
  fixtures: RecentFixture[];
}) {
  return (
    <div>
      <div className="eyebrow mb-2.5">
        {teamName} &middot; last {fixtures.length}
      </div>
      {fixtures.length === 0 ? (
        <p className="text-xs italic text-faint">No recent results available.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {fixtures.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] font-mono text-[10px] font-bold ${BADGE[f.result]}`}
              >
                {f.result}
              </span>
              <span className="font-mono text-faint">{f.homeAway === "H" ? "v" : "@"}</span>
              {f.opponent.logoUrl ? (
                <Image
                  src={f.opponent.logoUrl}
                  alt={`${f.opponent.name} logo`}
                  width={16}
                  height={16}
                  className="shrink-0"
                />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full bg-surface-2" aria-hidden />
              )}
              <span className="flex-1 truncate">{f.opponent.name}</span>
              <span className="shrink-0 font-mono tabular-nums text-muted">
                {f.goalsFor} - {f.goalsAgainst}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
