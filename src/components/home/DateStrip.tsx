import Link from "next/link";
import { formatDateStripLabel, formatDayMonth, toDateParam } from "@/lib/format";

const OFFSETS = [-1, 0, 1, 2, 3];

export function DateStrip({ selectedDate }: { selectedDate: Date }) {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
  const selectedParam = toDateParam(selectedDate);

  return (
    <nav aria-label="Select date" className="flex gap-2 overflow-x-auto pb-1">
      {OFFSETS.map((offset) => {
        const date = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
        const param = toDateParam(date);
        const isSelected = param === selectedParam;
        return (
          <Link
            key={offset}
            href={offset === 0 ? "/" : `/?date=${param}`}
            aria-current={isSelected ? "page" : undefined}
            className={`min-w-[80px] shrink-0 rounded-[var(--radius-control)] border px-4 py-2 text-center text-sm transition-colors ${
              isSelected
                ? "border-brand bg-brand text-white"
                : "border-line text-muted hover:border-line-strong hover:text-ink"
            }`}
          >
            <div className="font-semibold">{formatDateStripLabel(date, offset)}</div>
            <div className="font-mono text-[11px] opacity-70">{formatDayMonth(date)}</div>
          </Link>
        );
      })}
    </nav>
  );
}
