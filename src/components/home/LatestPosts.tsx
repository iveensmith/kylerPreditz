import Link from "next/link";
import { formatArticleDate } from "@/lib/format";

type LatestPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
};

export function LatestPosts({ posts }: { posts: LatestPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Latest from the Blog</h2>
        <Link href="/blog" className="text-sm text-brand hover:underline">
          View all
        </Link>
      </div>
      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="block px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <div className="font-medium">{post.title}</div>
              {post.excerpt && (
                <p className="line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">{post.excerpt}</p>
              )}
              {post.publishedAt && (
                <p className="mt-0.5 text-xs text-zinc-400">{formatArticleDate(post.publishedAt)}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
