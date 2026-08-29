import type { PredictionMarket } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { formatMarketLabel } from "@/lib/format";

type MarketRow = { market: PredictionMarket; selection: string; probability: number };

function parseAllMarkets(json: Prisma.JsonValue | null): MarketRow[] {
  if (!Array.isArray(json)) return [];
  return json as unknown as MarketRow[];
}

export function MarketProbabilityTable({
  allMarkets,
  publishedMarket,
}: {
  allMarkets: Prisma.JsonValue | null;
  publishedMarket: PredictionMarket | null;
}) {
  const rows = parseAllMarkets(allMarkets).sort((a, b) => b.probability - a.probability);
  if (rows.length === 0) {
    return <p className="text-xs italic text-faint">No market breakdown available for this fixture.</p>;
  }

  return (
    <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line">
      {rows.map((row) => {
        const pct = Math.round(row.probability * 100);
        const isPick = row.market === publishedMarket;
        return (
          <li
            key={row.market}
            className={`relative border-b border-line px-4 py-3 last:border-b-0 ${isPick ? "bg-brand/[0.06]" : ""}`}
          >
            <div
              aria-hidden
              className={`absolute inset-y-0 left-0 ${isPick ? "bg-brand/15" : "bg-surface-2"}`}
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className={isPick ? "font-semibold" : ""}>{formatMarketLabel(row.market)}</span>
                <span className="text-muted"> &middot; {row.selection}</span>
              </span>
              <span className={`shrink-0 font-mono tabular-nums ${isPick ? "font-semibold text-brand" : ""}`}>
                {pct}%
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
