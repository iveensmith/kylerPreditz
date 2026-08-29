import Link from "next/link";
import { formatArticleDate } from "@/lib/format";

type PostCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string;
  publishedAt: Date | null;
};

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-colors hover:border-brand"
    >
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {post.publishedAt && (
          <div className="eyebrow">{formatArticleDate(post.publishedAt)}</div>
        )}
        <h2 className="text-base leading-snug transition-colors group-hover:text-brand">{post.title}</h2>
        {post.excerpt && <p className="line-clamp-3 text-sm text-muted">{post.excerpt}</p>}
        <p className="mt-auto pt-2 font-mono text-[11px] uppercase tracking-wide text-faint">{post.author}</p>
      </div>
    </Link>
  );
}
