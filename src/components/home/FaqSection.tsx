import type { FaqEntry } from "@/lib/structured-data";

/** Visible FAQ content - required alongside FAQPage JSON-LD, Google won't credit hidden/JS-only FAQ markup. */
export function FaqSection({ entries }: { entries: FaqEntry[] }) {
  return (
    <section>
      <h2 className="font-semibold mb-3 text-sm">Frequently Asked Questions</h2>
      <dl className="flex flex-col gap-4">
        {entries.map((entry) => (
          <div key={entry.question}>
            <dt className="font-medium text-sm mb-1">{entry.question}</dt>
            <dd className="text-sm text-zinc-600 dark:text-zinc-300">{entry.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
