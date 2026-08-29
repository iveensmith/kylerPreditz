import Link from "next/link";
import { MARKET_PAGES } from "@/lib/markets.config";

export function MarketSidebar({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav aria-label="Prediction markets" className="flex gap-2 overflow-x-auto pb-2">
      {MARKET_PAGES.map((m) => (
        <Link
          key={m.slug}
          href={`/${m.slug}`}
          aria-current={m.slug === activeSlug ? "page" : undefined}
          className={`shrink-0 rounded-[var(--radius-control)] border px-3.5 py-2 text-sm font-medium transition-colors ${
            m.slug === activeSlug
              ? "border-brand bg-brand text-white"
              : "border-line text-muted hover:border-brand hover:text-brand"
          }`}
        >
          {m.h1.replace(" Predictions", "")}
        </Link>
      ))}
    </nav>
  );
}
