import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { MARKET_PAGES } from "@/lib/markets.config";
import { matchSlug } from "@/lib/queries/match-detail";
import { slugify } from "@/lib/slugs";
import { getSitemapPosts } from "@/lib/queries/blog";
import { getSitemapLeagues } from "@/lib/queries/league-detail";
import { absoluteUrl } from "@/lib/seo";

const DAY_SLUGS = [
  "sunday-predictions",
  "monday-predictions",
  "tuesday-predictions",
  "wednesday-predictions",
  "thursday-predictions",
  "friday-predictions",
  "saturday-predictions",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [leagues, fixtures, posts] = await Promise.all([
    getSitemapLeagues(),
    prisma.fixture.findMany({
      where: { prediction: { isNot: null } },
      select: { id: true, updatedAt: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
    }),
    getSitemapPosts(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/leagues"), changeFrequency: "daily", priority: 0.6 },
    { url: absoluteUrl("/results"), changeFrequency: "daily", priority: 0.5 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.5 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/vip"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/disclaimer"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
  ];

  for (const post of posts) {
    entries.push({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const m of MARKET_PAGES) {
    entries.push({ url: absoluteUrl(`/${m.slug}`), changeFrequency: "hourly", priority: 0.8 });
  }

  for (const slug of DAY_SLUGS) {
    entries.push({ url: absoluteUrl(`/${slug}`), changeFrequency: "hourly", priority: 0.7 });
  }

  for (const league of leagues) {
    entries.push({
      url: absoluteUrl(`/leagues/${slugify(league.country)}/${league.slug}`),
      lastModified: league.updatedAt,
      changeFrequency: "daily",
      priority: 0.6,
    });
  }

  for (const fixture of fixtures) {
    entries.push({
      url: absoluteUrl(`/predictions/${fixture.id}/${matchSlug(fixture.homeTeam.name, fixture.awayTeam.name)}`),
      lastModified: fixture.updatedAt,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  return entries;
}
