import type { Metadata } from "next";
import { getListedPosts } from "@/lib/queries/blog";
import { absoluteUrl } from "@/lib/seo";
import { PostCard } from "@/components/blog/PostCard";

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

export default async function BlogIndexPage() {
  const posts = await getListedPosts();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{TITLE}</h1>
        <p className="mt-1 text-sm text-muted">{DESCRIPTION}</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted">No articles published yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
