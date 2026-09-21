"use client";

import Link from "next/link";
import { useState } from "react";

export type SidebarPost = { id: string; slug: string; title: string; date: string | null };

/** Homepage sidebar: first posts are server-rendered, "More" fetches the next batch. */
export function SidebarBlogList({ initialPosts, initialHasMore }: { initialPosts: SidebarPost[]; initialHasMore: boolean }) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function loadMore() {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/blog/latest?offset=${posts.length}`);
      if (!res.ok) throw new Error("bad response");
      const data: { posts: SidebarPost[]; hasMore: boolean } = await res.json();
      setPosts((prev) => [...prev, ...data.posts.filter((p) => !prev.some((q) => q.id === p.id))]);
      setHasMore(data.hasMore);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  if (posts.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-white/10 bg-[#0c1310] p-4 text-white">
      <h2 className="eyebrow !text-white/45">Articles</h2>
      <ul className="flex flex-col divide-y divide-white/8">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="flex flex-col gap-1 py-2.5 transition-colors hover:text-brand-light">
              <span className="text-[13px] font-medium leading-snug">{post.title}</span>
              {post.date && (
                <span className="font-mono text-[10px] uppercase tracking-wide text-white/35">{post.date}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {failed && <p className="text-xs text-white/55">Couldn&rsquo;t load more posts. Try again.</p>}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="rounded-md border border-white/15 px-3 py-2 text-xs font-medium transition-colors hover:border-brand-light hover:text-brand-light disabled:opacity-50"
        >
          {loading ? "Loading..." : "More"}
        </button>
      )}
    </section>
  );
}
