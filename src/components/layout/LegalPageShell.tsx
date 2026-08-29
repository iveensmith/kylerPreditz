import type { ReactNode } from "react";

/** Shared wrapper for the static about / VIP / legal pages so they read consistently. */
export function LegalPageShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6">
      <header className="border-b border-line pb-6">
        {updated && <div className="eyebrow mb-3">Updated {updated}</div>}
        <h1 className="text-[2rem] leading-[1.05] sm:text-[2.5rem]">{title}</h1>
        {intro && <p className="mt-4 text-[15px] leading-relaxed text-muted">{intro}</p>}
      </header>
      <div className="mt-8 flex flex-col gap-8 text-[15px] leading-relaxed text-ink/85">{children}</div>
    </main>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-lg font-semibold text-ink">{heading}</h2>
      {children}
    </section>
  );
}
