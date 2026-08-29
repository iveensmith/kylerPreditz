import { createPost } from "@/lib/actions/blog";
import { PostForm } from "@/components/admin/PostForm";

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New Post</h1>
      <PostForm action={createPost} submitLabel="Create Post" />
    </div>
  );
}
