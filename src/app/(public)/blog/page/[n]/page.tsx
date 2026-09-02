import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getListedPostPageCount, getListedPosts } from "@/lib/queries/blog";
import { absoluteUrl } from "@/lib/seo";
import { BlogIndexView } from "@/components/blog/BlogIndexView";

const TITLE = "Football Blog & Analysis";
const DESCRIPTION =
  "Football match analysis, betting-market explainers, and prediction insight from our statistical model.";

export const revalidate = 3600;

// Page 1 lives at /blog, so this route only covers pages 2..N.
export async function generateStaticParams() {
  const pageCount = await getListedPostPageCount();
  return Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => ({ n: String(i + 2) }));
}

type Props = { params: Promise<{ n: string }> };

function parsePage(n: string): number | null {
  return /^\d+$/.test(n) ? Number(n) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = parsePage((await params).n);
  if (!page || page < 2) return {};
  const url = absoluteUrl(`/blog/page/${page}`);
  const title = `${TITLE} - Page ${page}`;
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { title, description: DESCRIPTION, url },
  };
}

export default async function BlogIndexPageN({ params }: Props) {
  const page = parsePage((await params).n);
  if (!page || page < 2) redirect("/blog"); // /blog/page/1 and junk -> canonical index

  const { items: posts, meta } = await getListedPosts(page);
  if (posts.length === 0) notFound(); // page past the end

  return <BlogIndexView posts={posts} meta={meta} />;
}
