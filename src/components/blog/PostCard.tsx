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
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 transition-colors hover:border-brand dark:border-zinc-800"
    >
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt=""
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="font-semibold leading-snug group-hover:text-brand">{post.title}</h2>
        {post.excerpt && (
          <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
        )}
        <p className="mt-auto pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {post.author}
          {post.publishedAt ? ` · ${formatArticleDate(post.publishedAt)}` : ""}
        </p>
      </div>
    </Link>
  );
}
