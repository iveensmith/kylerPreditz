import { createPost } from "@/lib/actions/blog";

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <h1 className="text-xl font-semibold">New Post</h1>
      <form action={createPost} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Title</span>
          <input name="title" required className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Author</span>
          <input name="author" required className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Cover Image URL (optional)</span>
          <input name="coverImage" type="url" className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Body</span>
          <textarea name="body" required rows={10} className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="publish" />
          Publish now
        </label>
        <button type="submit" className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-2 font-medium self-start">
          Create Post
        </button>
      </form>
    </div>
  );
}
