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
    return <p className="text-xs text-faint italic">No market breakdown available for this fixture.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="text-muted text-xs">
        <tr>
          <th className="text-left font-medium py-1">Market</th>
          <th className="text-right font-medium py-1">Probability</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.market}
            className={`border-t border-line ${row.market === publishedMarket ? "bg-surface-2" : ""}`}
          >
            <td className="py-1.5">
              <span className={row.market === publishedMarket ? "font-medium" : ""}>{formatMarketLabel(row.market)}</span>
              <span className="text-muted"> - {row.selection}</span>
            </td>
            <td className="py-1.5 text-right tabular-nums font-medium">{Math.round(row.probability * 100)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
