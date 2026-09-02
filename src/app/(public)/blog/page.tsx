import type { Metadata } from "next";
import { getListedPosts } from "@/lib/queries/blog";
import { parsePageParam } from "@/lib/pagination";
import { absoluteUrl } from "@/lib/seo";
import { PostCard } from "@/components/blog/PostCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";

const TITLE = "Football Blog & Analysis";
const DESCRIPTION =
  "Football match analysis, betting-market explainers, and prediction insight from our statistical model.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/blog") },
};

export const revalidate = 3600;

type Props = { searchParams: Promise<{ page?: string }> };

export default async function BlogIndexPage({ searchParams }: Props) {
  const page = parsePageParam((await searchParams).page);
  const { items: posts, meta } = await getListedPosts(page);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <PageHeader eyebrow="Blog" title="Analysis & explainers" subtitle={DESCRIPTION} />

      {posts.length === 0 ? (
        <p className="text-sm text-muted">
          {meta.total === 0 ? "No articles published yet." : "No articles on this page."}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination meta={meta} basePath="/blog" />
    </main>
  );
}
