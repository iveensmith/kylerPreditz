import type { PageMeta } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { PostCard } from "@/components/blog/PostCard";

const SUBTITLE =
  "Football match analysis, betting-market explainers, and prediction insight from our statistical model.";

type PostCardData = Parameters<typeof PostCard>[0]["post"];

/** Page 1 lives at /blog; every later page at /blog/page/N. */
export function blogPageHref(page: number): string {
  return page <= 1 ? "/blog" : `/blog/page/${page}`;
}

export function BlogIndexView({ posts, meta }: { posts: PostCardData[]; meta: PageMeta }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <PageHeader eyebrow="Blog" title="Analysis & explainers" subtitle={SUBTITLE} />

      {posts.length === 0 ? (
        <p className="text-sm text-muted">
          {meta.total === 0 ? "No articles published yet." : "No articles on this page."}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      <Pagination meta={meta} pageHref={blogPageHref} />
    </main>
  );
}
