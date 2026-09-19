"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SignOutButton } from "@/components/admin/SignOutButton";

type Item = { href: string; label: string };
type Group = { label: string; icon: ReactNode; items: Item[] };

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const TOP: Item = { href: "/admin", label: "Dashboard" };
const GROUPS: Group[] = [
  {
    label: "Predictions",
    icon: svg("M3 17l6-6 4 4 8-8M15 7h6v6"),
    items: [
      { href: "/admin/tips", label: "All tips" },
      { href: "/admin/tips/new", label: "New manual tip" },
    ],
  },
  {
    label: "Membership",
    icon: svg("M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8zM21 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"),
    items: [
      { href: "/admin/members", label: "Members" },
      { href: "/admin/subscribers", label: "Subscribers" },
    ],
  },
  {
    label: "Blog",
    icon: svg("M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"),
    items: [
      { href: "/admin/blog", label: "All posts" },
      { href: "/admin/blog/new", label: "New post" },
    ],
  },
  {
    label: "Payments",
    icon: svg("M3 6h18v12H3zM3 10h18M7 15h3"),
    items: [{ href: "/admin/payments", label: "Payments & prices" }],
  },
  {
    label: "Ads",
    icon: svg("M4 5h16v10H4zM8 19h8M12 15v4"),
    items: [{ href: "/admin/ads", label: "AdSense" }],
  },
  {
    label: "SEO",
    icon: svg("M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3"),
    items: [{ href: "/admin/seo", label: "Titles & sitemap" }],
  },
  {
    label: "Leagues",
    icon: svg("M12 21a9 9 0 100-18 9 9 0 000 18zM12 7l4 3-1.5 5h-5L8 10z"),
    items: [{ href: "/admin/leagues", label: "League manager" }],
  },
];

const ALL_HREFS = [TOP.href, ...GROUPS.flatMap((g) => g.items.map((i) => i.href))];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (pathname === href) return true;
  // Prefix match, unless a more specific sibling link owns this path (e.g. /admin/blog/new).
  const owned = ALL_HREFS.some(
    (o) => o.length > href.length && o.startsWith(href + "/") && (pathname === o || pathname.startsWith(o + "/")),
  );
  return pathname.startsWith(href + "/") && !owned;
}

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const link = (item: Item, nested = false) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`block rounded-md py-2 text-sm font-medium transition-colors ${nested ? "pl-10 pr-3" : "px-3"} ${
          active ? "bg-white/12 text-white" : "text-white/60 hover:bg-white/6 hover:text-white"
        }`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-[#0B1730] px-4 py-3 text-white lg:hidden">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Admin</span>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="rounded-md px-2 py-1 text-sm text-white/80 hover:bg-white/10"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        className={`${open ? "flex" : "hidden"} w-full shrink-0 flex-col bg-[#0B1730] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:overflow-y-auto`}
      >
        <div className="hidden px-5 pb-2 pt-6 lg:block">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">Admin</div>
          <div className="mt-2 truncate text-sm text-white/80" title={email}>
            {email}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {link(TOP)}
          {GROUPS.map((g) => {
            const groupActive = g.items.some((i) => isActive(pathname, i.href));
            return (
              <details key={g.label} open={groupActive} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 hover:bg-white/6 [&::-webkit-details-marker]:hidden">
                  {g.icon}
                  <span className="flex-1">{g.label}</span>
                  <svg viewBox="0 0 20 20" className="size-4 transition-transform group-open:rotate-180" fill="currentColor" aria-hidden>
                    <path d="M5 8l5 5 5-5z" />
                  </svg>
                </summary>
                <div className="mt-0.5 flex flex-col gap-0.5">{g.items.map((i) => link(i, true))}</div>
              </details>
            );
          })}
        </nav>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4 text-sm">
          <Link href="/" target="_blank" className="text-white/60 hover:text-white">
            View site ↗
          </Link>
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
