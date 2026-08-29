import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { DeletePostButton } from "@/components/admin/DeletePostButton";

function Badge({ children, tone }: { children: React.ReactNode; tone: "zinc" | "amber" | "red" | "blue" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tones[tone]}`}>{children}</span>;
}

export default async function AdminBlogPage() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Blog</h1>
        <Link href="/admin/blog/new" className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-1.5 text-sm font-medium">
          New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No posts yet.</p>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 text-sm"
            >
              <div className="flex flex-col gap-1">
                <div className="font-medium flex items-center gap-1.5 flex-wrap">
                  {post.title}
                  {post.type === "GUEST" && <Badge tone="blue">Guest</Badge>}
                  {!post.listed && <Badge tone="zinc">Unlisted</Badge>}
                  {post.sponsored && <Badge tone="amber">Sponsored</Badge>}
                  {post.noindex && <Badge tone="red">noindex</Badge>}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {post.publishedAt ? `Published ${post.publishedAt.toISOString().slice(0, 10)}` : "Draft"} - {post.author} - /{post.slug}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {post.publishedAt && (
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener" className="underline">
                    View
                  </a>
                )}
                <Link href={`/admin/blog/${post.id}`} className="underline">
                  Edit
                </Link>
                <DeletePostButton id={post.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
