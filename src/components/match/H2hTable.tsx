import type { H2hEntry } from "@/lib/predictions/ai/types";

export function H2hTable({ entries }: { entries: H2hEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-xs text-faint italic">No recent head-to-head meetings on record.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="text-muted text-xs">
        <tr>
          <th className="text-left font-medium py-1">Date</th>
          <th className="text-right font-medium py-1">Score</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((h, i) => (
          <tr key={i} className="border-t border-line">
            <td className="py-1.5 text-muted">
              {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
                new Date(h.date),
              )}
            </td>
            <td className="py-1.5 text-right tabular-nums font-medium">{h.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
