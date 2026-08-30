import { HOMEPAGE_INTRO, HOW_IT_WORKS } from "@/lib/homepage-content";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function HowItWorks() {
  return (
    <section className="text-sm leading-relaxed text-muted">
      <SectionHeading eyebrow="How it works" title="A prediction site built on a real model" />
      <div className="space-y-6">
        {HOMEPAGE_INTRO.map((p, i) => (
          <p key={i}>{p}</p>
        ))}

        {HOW_IT_WORKS.map((section) => (
          <div key={section.heading}>
            <h3 className="mb-2 text-[0.95rem] font-semibold text-ink">{section.heading}</h3>
            <div className="space-y-3">
              {section.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc space-y-1 pl-5">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
