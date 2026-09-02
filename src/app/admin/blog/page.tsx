import Link from "next/link";
import { getAllPostsForAdmin } from "@/lib/queries/blog";
import { parsePageParam } from "@/lib/pagination";
import { DeletePostButton } from "@/components/admin/DeletePostButton";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/ui/Pagination";
import { adminBtnLink } from "@/lib/admin-ui";

function Badge({ children, tone }: { children: React.ReactNode; tone: "zinc" | "amber" | "red" | "blue" }) {
  const tones = {
    zinc: "bg-surface-2 text-muted",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    red: "bg-loss/12 text-loss",
    blue: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminBlogPage({ searchParams }: Props) {
  const page = parsePageParam((await searchParams).page);
  const { items: posts, meta } = await getAllPostsForAdmin(page);

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Blog"
        action={
          <Link href="/admin/blog/new" className={adminBtnLink}>
            New post
          </Link>
        }
      />

      {posts.length === 0 ? (
        <p className="text-sm text-muted">No posts yet.</p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between gap-4 border-b border-line px-4 py-3.5 text-sm last:border-b-0"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-1.5 font-medium">
                  {post.title}
                  {post.type === "GUEST" && <Badge tone="blue">Guest</Badge>}
                  {!post.listed && <Badge tone="zinc">Unlisted</Badge>}
                  {post.sponsored && <Badge tone="amber">Sponsored</Badge>}
                  {post.noindex && <Badge tone="red">noindex</Badge>}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wide text-faint">
                  {post.publishedAt ? `Published ${post.publishedAt.toISOString().slice(0, 10)}` : "Draft"} &middot;{" "}
                  {post.author} &middot; /{post.slug}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {post.publishedAt && (
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener" className="text-brand underline">
                    View
                  </a>
                )}
                <Link href={`/admin/blog/${post.id}`} className="text-brand underline">
                  Edit
                </Link>
                <DeletePostButton id={post.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination meta={meta} basePath="/admin/blog" />
    </div>
  );
}
