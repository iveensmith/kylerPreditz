import type { Prisma } from "@/generated/prisma/client";

type MarketRow = { market: string; selection: string; probability: number };

function parse(json: Prisma.JsonValue | null): MarketRow[] {
  return Array.isArray(json) ? (json as unknown as MarketRow[]) : [];
}

function pick(rows: MarketRow[], market: string): number | null {
  const row = rows.find((r) => r.market === market);
  return row && row.probability > 0 ? row.probability : null;
}

/** 1X2 line: home / draw / away, each as the model's probability and derived decimal odds. */
export function MatchOddsBox({
  allMarkets,
  homeName,
  awayName,
}: {
  allMarkets: Prisma.JsonValue | null;
  homeName: string;
  awayName: string;
}) {
  const rows = parse(allMarkets);
  const cols = [
    { label: homeName, sub: "Home", p: pick(rows, "HOME_WIN") },
    { label: "Draw", sub: "X", p: pick(rows, "DRAW") },
    { label: awayName, sub: "Away", p: pick(rows, "AWAY_WIN") },
  ];
  if (cols.every((c) => c.p === null)) return null;

  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-[var(--radius-card)] border border-line">
      {cols.map((c, i) => (
        <div key={c.sub} className={`px-3 py-3 text-center ${i < 2 ? "border-r border-line" : ""}`}>
          <div className="eyebrow truncate" title={c.label}>{c.sub === "X" ? "Draw" : c.label}</div>
          <div className="mt-1.5 font-mono text-lg font-semibold tabular-nums">
            {c.p ? (1 / c.p).toFixed(2) : "—"}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-muted tabular-nums">
            {c.p ? `${Math.round(c.p * 100)}%` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
