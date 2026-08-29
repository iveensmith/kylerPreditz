import type { ReactNode } from "react";

/**
 * The recurring section device: a short mono eyebrow that names the kind of
 * content, the title in the display face, and a hairline rule under both. An
 * optional action (a "view all" link, a filter) sits on the right.
 */
export function SectionHeading({
  eyebrow,
  title,
  action,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 flex items-end justify-between gap-4 border-b border-line pb-3 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h2 className="text-xl leading-tight sm:text-[1.375rem]">{title}</h2>
      </div>
      {action && <div className="shrink-0 pb-0.5 text-sm">{action}</div>}
    </div>
  );
}
