// Falls back to localhost in dev; set NEXT_PUBLIC_SITE_URL before deploying so
// canonical URLs, OG tags, and the sitemap point at the real domain.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export const SITE_NAME = "kylerPredictz";

/** Shared metadata shape for the 7 static day-predictions pages - only the day name/slug differ. */
export function dayPageMetadata(dayName: string, slug: string) {
  const title = `${dayName} Football Predictions`;
  const description = `${dayName}'s football predictions, odds, and confidence ratings from our statistical model.`;
  const url = absoluteUrl(`/${slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}
