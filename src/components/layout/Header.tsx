import Link from "next/link";
import { MARKET_PAGES } from "@/lib/markets.config";
import { SITE_NAME } from "@/lib/seo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { HeaderAuthLink } from "./HeaderAuthLink";
import { Logo } from "./Logo";

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

const navLink = "text-[13px] font-medium text-white/65 transition-colors hover:text-white";

function NavDropdown({
  label,
  viewAllHref,
  viewAllLabel,
  items,
}: {
  label: string;
  viewAllHref: string;
  viewAllLabel: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div className="group relative">
      <button className={`${navLink} flex items-center gap-1`}>
        {label}
        <ChevronDown />
      </button>
      <div className="absolute left-0 top-full hidden pt-3 group-hover:block">
        <div className="w-56 overflow-hidden rounded-[var(--radius-control)] border border-white/10 bg-[#0d1310] py-1.5 shadow-2xl shadow-black/40">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-[13px] text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-1 border-t border-white/10 pt-1">
            <Link href={viewAllHref} className="block px-4 py-2 text-[13px] font-medium text-brand-light hover:bg-white/5">
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08110D] text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label={`${SITE_NAME} home`}>
          <Logo className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/" className={navLink}>
            Today&apos;s tips
          </Link>

          <NavDropdown
            label="Markets"
            viewAllHref="/single-bets"
            viewAllLabel="View all markets"
            items={FEATURED_MARKETS.map((m) => ({ href: `/${m.slug}`, label: m.h1 }))}
          />

          <NavDropdown
            label="By day"
            viewAllHref="/monday-predictions"
            viewAllLabel="View all days"
            items={DAYS.map((d) => ({ href: `/${d.slug}`, label: `${d.label} Predictions` }))}
          />

          <Link href="/leagues" className={navLink}>
            Leagues
          </Link>
          <Link href="/results" className={navLink}>
            Results
          </Link>
          <Link href="/blog" className={navLink}>
            Blog
          </Link>
          <Link href="/vip" className="text-[13px] font-semibold text-brand-light transition-colors hover:text-white">
            Premium
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 text-sm">
          <ThemeToggle className="text-white/65 hover:text-white hover:!bg-white/8" />
          <HeaderAuthLink />
        </div>
      </div>
    </header>
  );
}
