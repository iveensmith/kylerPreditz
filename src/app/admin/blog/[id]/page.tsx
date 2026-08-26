import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { updatePost } from "@/lib/actions/blog";

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  const updatePostWithId = updatePost.bind(null, id);

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <h1 className="text-xl font-semibold">Edit Post</h1>
      <form action={updatePostWithId} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Title</span>
          <input name="title" defaultValue={post.title} required className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Author</span>
          <input name="author" defaultValue={post.author} required className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Cover Image URL (optional)</span>
          <input name="coverImage" type="url" defaultValue={post.coverImage ?? ""} className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Body</span>
          <textarea name="body" defaultValue={post.body} required rows={10} className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="publish" defaultChecked={!!post.publishedAt} />
          Published
        </label>
        <button type="submit" className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-2 font-medium self-start">
          Save Changes
        </button>
      </form>
    </div>
  );
}
