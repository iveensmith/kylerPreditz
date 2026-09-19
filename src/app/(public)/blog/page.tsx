import type { Metadata } from "next";
import { withPageSeo } from "@/lib/page-seo";
import { getListedPosts } from "@/lib/queries/blog";
import { absoluteUrl } from "@/lib/seo";
import { BlogIndexView } from "@/components/blog/BlogIndexView";

const TITLE = "Football Blog & Analysis";
const DESCRIPTION =
  "Football match analysis, betting-market explainers, and prediction insight from our statistical model.";

const baseMetadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/blog") },
};

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeo(baseMetadata, "/blog");
}

export const revalidate = 3600;

export default async function BlogIndexPage() {
  const { items: posts, meta } = await getListedPosts(1);
  return <BlogIndexView posts={posts} meta={meta} />;
}
