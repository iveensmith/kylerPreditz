import { NextResponse } from "next/server";
import { countListedPosts, getLatestListedPosts } from "@/lib/queries/blog";
import { formatArticleDate } from "@/lib/format";

// "More" button on the homepage sidebar. Public data only (listed, published posts).
const PAGE_SIZE = 3;

export async function GET(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get("offset"));
  const offset = Number.isInteger(raw) && raw >= 0 ? Math.min(raw, 10_000) : 0;

  const [posts, total] = await Promise.all([getLatestListedPosts(PAGE_SIZE, offset), countListedPosts()]);

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      coverImage: p.coverImage,
      date: p.publishedAt ? formatArticleDate(p.publishedAt) : null,
    })),
    hasMore: offset + posts.length < total,
  });
}
