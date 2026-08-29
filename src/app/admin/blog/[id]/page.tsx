import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { updatePost } from "@/lib/actions/blog";
import { PostForm } from "@/components/admin/PostForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  const updatePostWithId = updatePost.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader eyebrow="Blog" title={`Edit · ${post.title}`} />
      <PostForm
        action={updatePostWithId}
        submitLabel="Save Changes"
        post={{
          title: post.title,
          slug: post.slug,
          author: post.author,
          coverImage: post.coverImage,
          excerpt: post.excerpt,
          body: post.body,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          type: post.type,
          listed: post.listed,
          sponsored: post.sponsored,
          noindex: post.noindex,
          published: !!post.publishedAt,
        }}
      />
    </div>
  );
}
