import { MARKET_PAGES } from "@/lib/markets.config";

export type SeoPage = { path: string; label: string; group: "Main" | "Days" | "Markets" };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Pages whose title/description can be edited in Admin > SEO. Detail pages (matches, posts) keep generated metadata. */
export const SEO_PAGES: SeoPage[] = [
  { path: "/", label: "Homepage", group: "Main" },
  { path: "/leagues", label: "Leagues index", group: "Main" },
  { path: "/results", label: "Results archive", group: "Main" },
  { path: "/blog", label: "Blog index", group: "Main" },
  { path: "/vip", label: "Premium plans", group: "Main" },
  { path: "/about", label: "About us", group: "Main" },
  ...DAYS.map((d) => ({ path: `/${d.toLowerCase()}-predictions`, label: `${d} predictions`, group: "Days" as const })),
  ...MARKET_PAGES.map((m) => ({ path: `/${m.slug}`, label: m.h1, group: "Markets" as const })),
];

export const SEO_PAGE_PATHS = new Set(SEO_PAGES.map((p) => p.path));
