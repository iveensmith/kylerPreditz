import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { updatePost } from "@/lib/actions/blog";
import { PostForm } from "@/components/admin/PostForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  const updatePostWithId = updatePost.bind(null, id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Edit Post</h1>
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
