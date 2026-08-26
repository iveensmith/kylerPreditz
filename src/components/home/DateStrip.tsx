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
            className={`shrink-0 rounded-full px-4 py-2 text-sm text-center min-w-[76px] border font-medium transition-colors ${
              isSelected
                ? "bg-brand text-white border-brand"
                : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="font-medium">{formatDateStripLabel(date, offset)}</div>
            <div className="text-xs opacity-70">{formatDayMonth(date)}</div>
          </Link>
        );
      })}
    </nav>
  );
}
