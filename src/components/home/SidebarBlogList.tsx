"use client";

import Link from "next/link";
import { useState } from "react";

const moreButton =
  "rounded-md border border-white/15 px-3 py-2 text-xs font-medium transition-colors hover:border-brand-light hover:text-brand-light disabled:opacity-50";

export type SidebarPost = { id: string; slug: string; title: string; coverImage: string | null; date: string | null };

/** Homepage sidebar: first posts are server-rendered, "More" fetches the next batch. */
export function SidebarBlogList({ initialPosts, initialHasMore }: { initialPosts: SidebarPost[]; initialHasMore: boolean }) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
        {posts.map((post, i) => (
          // On mobile only the first article shows until "More" is tapped; desktop shows all.
          <li key={post.id} className={i > 0 && !expanded ? "hidden md:block" : undefined}>
            <Link
              href={`/blog/${post.slug}`}
              className="flex items-start gap-3 py-2.5 transition-colors hover:text-brand-light md:flex-col md:items-stretch md:gap-1"
            >
              {post.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImage}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-24 shrink-0 rounded-md object-cover md:mb-1.5 md:aspect-[16/9] md:w-full"
                />
              )}
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[13px] font-medium leading-snug">{post.title}</span>
                {post.date && (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-white/35">{post.date}</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {failed && <p className="text-xs text-white/55">Couldn&rsquo;t load more posts. Try again.</p>}
      {!expanded && (posts.length > 1 || hasMore) && (
        <button type="button" onClick={() => setExpanded(true)} className={`${moreButton} md:hidden`}>
          More
        </button>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className={`${moreButton} ${expanded ? "" : "hidden md:block"}`}
        >
          {loading ? "Loading..." : "More"}
        </button>
      )}
    </section>
  );
}
