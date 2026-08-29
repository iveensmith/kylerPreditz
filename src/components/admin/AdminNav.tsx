"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tips", label: "Tips" },
  { href: "/admin/leagues", label: "Leagues" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/subscribers", label: "Subscribers" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 text-sm">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-[var(--radius-control)] px-2.5 py-1.5 font-medium transition-colors ${
              active ? "bg-white/10 text-white" : "text-white/55 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
