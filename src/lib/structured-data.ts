export type FaqEntry = { question: string; answer: string };

/**
 * Organization + WebSite schema for the homepage, emitted as a single @graph so
 * the two nodes can cross-reference by @id. Tells Google that uniquepredict.com
 * and the "Unique Predict" brand are one entity, and links out to the channels
 * we control (`sameAs`) - the signal behind a branded result with sitelinks.
 */
export function buildSiteIdentityJsonLd(params: {
  siteUrl: string;
  siteName: string;
  description: string;
  logoUrl: string;
  sameAs: string[];
}) {
  const orgId = `${params.siteUrl}/#organization`;
  const siteId = `${params.siteUrl}/#website`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: params.siteName,
        url: params.siteUrl,
        logo: { "@type": "ImageObject", url: params.logoUrl },
        ...(params.sameAs.length > 0 ? { sameAs: params.sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": siteId,
        name: params.siteName,
        url: params.siteUrl,
        description: params.description,
        publisher: { "@id": orgId },
        inLanguage: "en",
      },
    ],
  };
}

export function buildFaqPageJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
}

/** BreadcrumbList for a page's trail. `items` must be in order, root first,
 *  current page last; every `url` absolute. */
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildArticleJsonLd(params: {
  title: string;
  description: string;
  url: string;
  image: string | null;
  author: string;
  datePublished: Date;
  dateModified: Date;
  siteName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.description,
    ...(params.image ? { image: [params.image] } : {}),
    datePublished: params.datePublished.toISOString(),
    dateModified: params.dateModified.toISOString(),
    author: { "@type": "Person", name: params.author },
    publisher: { "@type": "Organization", name: params.siteName },
    mainEntityOfPage: { "@type": "WebPage", "@id": params.url },
    url: params.url,
  };
}

export function buildSportsEventJsonLd(params: {
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffUtc: Date;
  venue: string | null;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${params.homeTeam} vs ${params.awayTeam}`,
    startDate: params.kickoffUtc.toISOString(),
    sport: "https://en.wikipedia.org/wiki/Association_football",
    competitor: [
      { "@type": "SportsTeam", name: params.homeTeam },
      { "@type": "SportsTeam", name: params.awayTeam },
    ],
    ...(params.venue ? { location: { "@type": "Place", name: params.venue } } : {}),
    superEvent: { "@type": "SportsEvent", name: params.league },
    url: params.url,
  };
}
