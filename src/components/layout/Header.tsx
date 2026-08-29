import Link from "next/link";
import { MARKET_PAGES } from "@/lib/markets.config";
import { SITE_NAME_PREFIX, SITE_NAME_SUFFIX } from "@/lib/seo";
import { HeaderAuthLink } from "./HeaderAuthLink";

const FEATURED_MARKETS = MARKET_PAGES.slice(0, 6);

const DAYS = [
  { label: "Monday", slug: "monday-predictions" },
  { label: "Tuesday", slug: "tuesday-predictions" },
  { label: "Wednesday", slug: "wednesday-predictions" },
  { label: "Thursday", slug: "thursday-predictions" },
  { label: "Friday", slug: "friday-predictions" },
  { label: "Saturday", slug: "saturday-predictions" },
  { label: "Sunday", slug: "sunday-predictions" },
];

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavDropdown({ label, viewAllHref, viewAllLabel, items }: { label: string; viewAllHref: string; viewAllLabel: string; items: { href: string; label: string }[] }) {
  return (
    <div className="relative group">
      <button className="hover:text-white transition-colors flex items-center gap-1">
        {label}
        <ChevronDown />
      </button>
      <div className="absolute left-0 top-full pt-2 hidden group-hover:block">
        <div className="w-56 rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl py-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white">
              {item.label}
            </Link>
          ))}
          <div className="border-t border-zinc-800 mt-1 pt-1">
            <Link href={viewAllHref} className="block px-4 py-2 text-sm text-brand-light hover:bg-zinc-900">
              {viewAllLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950 text-zinc-100 border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-lg shrink-0">
          {SITE_NAME_PREFIX}<span className="text-secondary">{SITE_NAME_SUFFIX}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
          <Link href="/" className="hover:text-white transition-colors">
            Today&apos;s Predictions
          </Link>

          <NavDropdown
            label="Markets"
            viewAllHref="/single-bets"
            viewAllLabel="View all markets"
            items={FEATURED_MARKETS.map((m) => ({ href: `/${m.slug}`, label: m.h1 }))}
          />

          <NavDropdown
            label="Predictions by Day"
            viewAllHref="/monday-predictions"
            viewAllLabel="View all days"
            items={DAYS.map((d) => ({ href: `/${d.slug}`, label: `${d.label} Predictions` }))}
          />

          <Link href="/leagues" className="hover:text-white transition-colors">
            Leagues
          </Link>
          <Link href="/results" className="hover:text-white transition-colors">
            Results
          </Link>
          <Link href="/blog" className="hover:text-white transition-colors">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <HeaderAuthLink />
        </div>
      </div>
    </header>
  );
}
