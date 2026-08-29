import { SectionHeading } from "@/components/ui/SectionHeading";
import type { FaqEntry } from "@/lib/structured-data";

/** Visible FAQ content - required alongside FAQPage JSON-LD, Google won't credit hidden/JS-only FAQ markup. */
export function FaqSection({ entries }: { entries: FaqEntry[] }) {
  return (
    <section>
      <SectionHeading eyebrow="FAQ" title="Common questions" />
      <dl className="divide-y divide-line border-t border-line">
        {entries.map((entry) => (
          <div key={entry.question} className="py-4">
            <dt className="font-medium">{entry.question}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">{entry.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
