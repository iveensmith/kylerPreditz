import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";

export const TITLE_MAX = 70;
export const DESCRIPTION_MAX = 200;

const getOverrides = cache(async () => {
  const rows = await prisma.pageSeo.findMany();
  return new Map(rows.map((r) => [r.path, r]));
});

export async function getPageSeo(path: string) {
  return (await getOverrides()).get(path) ?? null;
}

/**
 * Applies an admin override (Admin > SEO) on top of a page's built-in metadata. Falls back to the
 * built-in values if there's no override or the read fails - metadata must never break a page.
 * `absoluteTitle` is for pages whose title already contains the site name (skips the "%s | Site" template).
 */
export async function withPageSeo(base: Metadata, path: string, opts?: { absoluteTitle?: boolean }): Promise<Metadata> {
  let override;
  try {
    override = await getPageSeo(path);
  } catch (e) {
    console.error("[seo] override read failed", path, e);
    return base;
  }
  const title = override?.title || undefined;
  const description = override?.description || undefined;
  if (!title && !description) return base;

  return {
    ...base,
    ...(title ? { title: opts?.absoluteTitle ? { absolute: title } : title } : {}),
    ...(description ? { description } : {}),
    openGraph: {
      ...base.openGraph,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    },
  };
}
