import Link from "next/link";
import { MARKET_PAGES } from "@/lib/markets.config";

export function MarketSidebar({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav aria-label="Prediction markets" className="flex gap-2 overflow-x-auto pb-2">
      {MARKET_PAGES.map((m) => (
        <Link
          key={m.slug}
          href={`/${m.slug}`}
          className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium border transition-colors ${
            m.slug === activeSlug
              ? "bg-brand text-white border-brand"
              : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-brand-light hover:text-brand-hover dark:hover:text-brand-light"
          }`}
        >
          {m.h1.replace(" Predictions", "")}
        </Link>
      ))}
    </nav>
  );
}
