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
    <main className="max-w-3xl mx-auto w-full px-4 py-10 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold border-l-2 border-secondary pl-3">{title}</h1>
        {intro && <p className="text-sm text-zinc-600 dark:text-zinc-400">{intro}</p>}
        {updated && <p className="text-xs text-zinc-500 dark:text-zinc-500">Last updated {updated}</p>}
      </header>
      <div className="flex flex-col gap-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {children}
      </div>
    </main>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{heading}</h2>
      {children}
    </section>
  );
}
