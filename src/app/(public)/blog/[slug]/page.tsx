import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPostSlugs } from "@/lib/queries/blog";
import { formatArticleDate } from "@/lib/format";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { buildArticleJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { PostBody } from "@/components/blog/PostBody";
import { SponsoredNotice } from "@/components/blog/SponsoredNotice";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

function metaDescriptionFor(post: { metaDescription: string | null; excerpt: string | null; body: string }) {
  return (
    post.metaDescription ||
    post.excerpt ||
    post.body.replace(/[#*_>`[\]()!-]/g, "").replace(/\s+/g, " ").trim().slice(0, 155)
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const url = absoluteUrl(`/blog/${post.slug}`);
  const title = post.metaTitle || post.title;
  const description = metaDescriptionFor(post);

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(post.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const url = absoluteUrl(`/blog/${post.slug}`);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-14 sm:px-6">
      <JsonLd
        data={buildArticleJsonLd({
          title: post.metaTitle || post.title,
          description: metaDescriptionFor(post),
          url,
          image: post.coverImage,
          author: post.author,
          datePublished: post.publishedAt ?? post.createdAt,
          dateModified: post.updatedAt,
          siteName: SITE_NAME,
        })}
      />

      <header className="flex flex-col gap-4 border-b border-line pb-6">
        <div className="eyebrow">
          {post.author}
          {post.publishedAt ? ` · ${formatArticleDate(post.publishedAt)}` : ""}
        </div>
        <h1 className="text-[2.25rem] leading-[1.08] sm:text-[2.75rem]">{post.title}</h1>
        {post.sponsored && <SponsoredNotice />}
      </header>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt=""
          fetchPriority="high"
          className="w-full rounded-[var(--radius-card)] border border-line object-cover"
        />
      )}

      <PostBody body={post.body} sponsored={post.sponsored} />

      <p className="border-t border-line pt-5 text-xs leading-relaxed text-faint">
        Predictions referenced on this site are statistical estimates, capped at 92% confidence, never
        guaranteed. 18+ &middot; Gamble responsibly.
      </p>
    </main>
  );
}
