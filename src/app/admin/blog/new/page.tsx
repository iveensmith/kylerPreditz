import { createPost } from "@/lib/actions/blog";
import { PostForm } from "@/components/admin/PostForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminHeader eyebrow="Blog" title="New post" />
      <PostForm action={createPost} submitLabel="Create post" />
    </div>
  );
}
