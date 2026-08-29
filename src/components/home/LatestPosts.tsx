import Link from "next/link";
import { formatArticleDate } from "@/lib/format";
import { SectionHeading } from "@/components/ui/SectionHeading";

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
      <SectionHeading
        eyebrow="Reading"
        title="Latest from the blog"
        action={
          <Link href="/blog" className="text-brand hover:underline">
            View all
          </Link>
        }
      />
      <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="block px-4 py-3.5 transition-colors hover:bg-surface-2">
              <div className="font-medium">{post.title}</div>
              {post.excerpt && <p className="line-clamp-1 text-sm text-muted">{post.excerpt}</p>}
              {post.publishedAt && (
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-faint">
                  {formatArticleDate(post.publishedAt)}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
