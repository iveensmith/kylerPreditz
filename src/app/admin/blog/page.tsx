import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { DeletePostButton } from "@/components/admin/DeletePostButton";

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
              <div>
                <div className="font-medium">{post.title}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {post.publishedAt ? `Published ${post.publishedAt.toISOString().slice(0, 10)}` : "Draft"} - {post.author}
                </div>
              </div>
              <div className="flex items-center gap-3">
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
