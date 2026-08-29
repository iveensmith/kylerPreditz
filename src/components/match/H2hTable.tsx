import type { H2hEntry } from "@/lib/predictions/ai/types";

export function H2hTable({ entries }: { entries: H2hEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-xs italic text-faint">No recent head-to-head meetings on record.</p>;
  }

  return (
    <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line text-sm">
      {entries.map((h, i) => (
        <li key={i} className="flex items-center justify-between border-b border-line px-4 py-2.5 last:border-b-0">
          <span className="font-mono text-[13px] text-muted">
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(h.date))}
          </span>
          <span className="font-mono font-semibold tabular-nums">{h.score}</span>
        </li>
      ))}
    </ul>
  );
}
