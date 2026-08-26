"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { slugify } from "@/lib/slugs";

function parsePostFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const coverImage = String(formData.get("coverImage") ?? "").trim() || null;
  const publish = formData.get("publish") === "on";

  if (!title) throw new Error("Title is required");
  if (!body) throw new Error("Body is required");
  if (!author) throw new Error("Author is required");

  return { title, body, author, coverImage, publish };
}

export async function createPost(formData: FormData) {
  await requireAdmin();
  const fields = parsePostFields(formData);

  await prisma.post.create({
    data: {
      title: fields.title,
      slug: slugify(fields.title),
      body: fields.body,
      author: fields.author,
      coverImage: fields.coverImage,
      publishedAt: fields.publish ? new Date() : null,
    },
  });

  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function updatePost(id: string, formData: FormData) {
  await requireAdmin();
  const fields = parsePostFields(formData);
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw new Error("Post not found");

  await prisma.post.update({
    where: { id },
    data: {
      title: fields.title,
      body: fields.body,
      author: fields.author,
      coverImage: fields.coverImage,
      publishedAt: fields.publish ? (existing.publishedAt ?? new Date()) : null,
    },
  });

  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function deletePost(id: string) {
  await requireAdmin();
  await prisma.post.delete({ where: { id } });
  revalidatePath("/admin/blog");
}
