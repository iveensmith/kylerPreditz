import type { ReactNode } from "react";

/** Standard page masthead: mono eyebrow, display title, optional lead, hairline rule. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line pb-5">
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h1 className="text-[2rem] leading-[1.05] sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{subtitle}</p>}
      {children}
    </header>
  );
}
