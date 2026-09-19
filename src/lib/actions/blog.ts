"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PostType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { slugify } from "@/lib/slugs";
import { assertNoBannedPhrases } from "@/lib/content-rules";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/actions/result";

function parsePostFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const coverImage = String(formData.get("coverImage") ?? "").trim() || null;
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const metaTitle = String(formData.get("metaTitle") ?? "").trim() || null;
  const metaDescription = String(formData.get("metaDescription") ?? "").trim() || null;
  const slugInput = String(formData.get("slug") ?? "").trim();
  const type = formData.get("type") === "GUEST" ? PostType.GUEST : PostType.ARTICLE;
  const publish = formData.get("publish") === "on";
  const sponsored = formData.get("sponsored") === "on";
  const noindex = formData.get("noindex") === "on";
  // "listed" checkbox: default on for ARTICLE, off for GUEST when the field is absent.
  const listedRaw = formData.get("listed");
  const listed = listedRaw === null ? type === PostType.ARTICLE : listedRaw === "on";

  if (!title) throw new UserFacingError("Title is required");
  if (!body) throw new UserFacingError("Body is required");
  if (!author) throw new UserFacingError("Author is required");

  assertNoBannedPhrases(title, body, excerpt, metaTitle, metaDescription);

  const slug = slugInput ? slugify(slugInput) : slugify(title);
  if (!slug) throw new UserFacingError("Could not derive a valid slug - set one explicitly");

  return { title, body, author, coverImage, excerpt, metaTitle, metaDescription, slug, type, publish, sponsored, noindex, listed };
}

/** Cache invalidation must never turn a successful save into an error page. */
function revalidateBlog(slug: string) {
  try {
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
  } catch (e) {
    console.error("[blog] revalidate failed", e);
  }
}

async function assertSlugFree(slug: string, exceptId?: string) {
  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing && existing.id !== exceptId) {
    throw new UserFacingError(`Slug "${slug}" is already used by another post`);
  }
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    const f = parsePostFields(formData);
    await assertSlugFree(f.slug);
    await prisma.post.create({
    data: {
      title: f.title,
      slug: f.slug,
      body: f.body,
      author: f.author,
      coverImage: f.coverImage,
      excerpt: f.excerpt,
      metaTitle: f.metaTitle,
      metaDescription: f.metaDescription,
      type: f.type,
      listed: f.listed,
      sponsored: f.sponsored,
      noindex: f.noindex,
      publishedAt: f.publish ? new Date() : null,
    },
    });
    revalidateBlog(f.slug);
  } catch (e) {
    return toActionError(e);
  }
  redirect("/admin/blog");
}

export async function updatePost(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    const f = parsePostFields(formData);
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) throw new UserFacingError("Post not found");
    await assertSlugFree(f.slug, id);

    await prisma.post.update({
    where: { id },
    data: {
      title: f.title,
      slug: f.slug,
      body: f.body,
      author: f.author,
      coverImage: f.coverImage,
      excerpt: f.excerpt,
      metaTitle: f.metaTitle,
      metaDescription: f.metaDescription,
      type: f.type,
      listed: f.listed,
      sponsored: f.sponsored,
      noindex: f.noindex,
      publishedAt: f.publish ? (existing.publishedAt ?? new Date()) : null,
    },
    });
    revalidateBlog(existing.slug);
    if (f.slug !== existing.slug) revalidateBlog(f.slug);
  } catch (e) {
    return toActionError(e);
  }
  redirect("/admin/blog");
}

export async function deletePost(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const post = await prisma.post.delete({ where: { id } });
    revalidateBlog(post.slug);
  } catch (e) {
    return toActionError(e, "Could not delete this post.");
  }
}
