import { PostType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { pageArgs, pageMeta } from "@/lib/pagination";

// Single source of truth for "shows in the /blog index, homepage latest, and
// counts as a listed entry". Unlisted posts (guest / sponsored) still resolve at
// their own URL - they're just absent from navigation and feeds.
const LISTED_WHERE = {
  publishedAt: { not: null },
  listed: true,
  noindex: false,
  type: PostType.ARTICLE,
} as const;

export async function getListedPosts(page = 1) {
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where: LISTED_WHERE,
      orderBy: { publishedAt: "desc" },
      ...pageArgs(page),
    }),
    prisma.post.count({ where: LISTED_WHERE }),
  ]);
  return { items, meta: pageMeta(total, page) };
}

export async function getLatestListedPosts(n: number) {
  return prisma.post.findMany({
    where: LISTED_WHERE,
    orderBy: { publishedAt: "desc" },
    take: n,
  });
}

/** Any published post, listed or not. Drafts (publishedAt === null) return null. */
export async function getPostBySlug(slug: string) {
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.publishedAt) return null;
  return post;
}

/** Slugs for generateStaticParams - every published post, listed or not. */
export async function getPublishedPostSlugs() {
  const posts = await prisma.post.findMany({
    where: { publishedAt: { not: null } },
    select: { slug: true },
  });
  return posts.map((p) => p.slug);
}

/** Published posts eligible for sitemap.xml (unlisted included, noindex excluded). */
export async function getSitemapPosts() {
  return prisma.post.findMany({
    where: { publishedAt: { not: null }, noindex: false },
    select: { slug: true, updatedAt: true },
  });
}

/** Every post (drafts included), newest first - the admin blog list. */
export async function getAllPostsForAdmin(page = 1) {
  const [items, total] = await Promise.all([
    prisma.post.findMany({ orderBy: { createdAt: "desc" }, ...pageArgs(page) }),
    prisma.post.count(),
  ]);
  return { items, meta: pageMeta(total, page) };
}
