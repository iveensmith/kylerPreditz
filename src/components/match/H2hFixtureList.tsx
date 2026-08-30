import Image from "next/image";
import type { H2hFixture } from "@/lib/queries/match-detail-extras";

const BADGE: Record<"W" | "D" | "L", string> = {
  W: "bg-win/15 text-win",
  D: "bg-surface-2 text-muted",
  L: "bg-loss/15 text-loss",
};

function outcome(a: number, b: number): "W" | "D" | "L" {
  if (a > b) return "W";
  if (a < b) return "L";
  return "D";
}

function Badge({ r }: { r: "W" | "D" | "L" }) {
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] font-mono text-[10px] font-bold ${BADGE[r]}`}
    >
      {r}
    </span>
  );
}

function Crest({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return logoUrl ? (
    <Image src={logoUrl} alt={`${name} logo`} width={18} height={18} className="shrink-0" />
  ) : (
    <span className="h-[18px] w-[18px] shrink-0 rounded-full bg-surface-2" aria-hidden />
  );
}

export function H2hFixtureList({ fixtures }: { fixtures: H2hFixture[] }) {
  if (fixtures.length === 0) {
    return <p className="text-xs italic text-faint">No recent head-to-head meetings on record.</p>;
  }

  return (
    <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line text-sm">
      {fixtures.map((f, i) => {
        const homeR = outcome(f.home.goals, f.away.goals);
        const awayR = outcome(f.away.goals, f.home.goals);
        return (
          <li
            key={i}
            className="flex items-center gap-2 border-b border-line px-3 py-2.5 last:border-b-0"
          >
            <Badge r={homeR} />
            <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right">
              <span className="truncate">{f.home.name}</span>
              <Crest name={f.home.name} logoUrl={f.home.logoUrl} />
            </span>
            <span className="flex shrink-0 flex-col items-center px-1">
              <span className="font-mono font-semibold tabular-nums">
                {f.home.goals} - {f.away.goals}
              </span>
              <span className="font-mono text-[10px] text-faint">
                {new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(f.date))}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <Crest name={f.away.name} logoUrl={f.away.logoUrl} />
              <span className="truncate">{f.away.name}</span>
            </span>
            <Badge r={awayR} />
          </li>
        );
      })}
    </ul>
  );
}
