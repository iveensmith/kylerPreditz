import { SectionHeading } from "@/components/ui/SectionHeading";
import type { FaqEntry } from "@/lib/structured-data";

/**
 * Visible FAQ content - required alongside FAQPage JSON-LD. Rendered as native
 * <details> so each answer collapses without any JS; the text stays in the DOM
 * so Google still credits it.
 */
export function FaqSection({ entries }: { entries: FaqEntry[] }) {
  return (
    <section>
      <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
      <div className="divide-y divide-line border-t border-line">
        {entries.map((entry, i) => (
          <details key={entry.question} className="group py-1" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center gap-3 py-3 font-medium [&::-webkit-details-marker]:hidden">
              <span className="font-mono text-xs text-faint tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">{entry.question}</span>
              <svg
                className="shrink-0 text-muted transition-transform group-open:rotate-180"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3.5 5L7 8.5L10.5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <p className="pb-4 pl-[calc(0.75rem+2ch)] text-sm leading-relaxed text-muted">
              {entry.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
