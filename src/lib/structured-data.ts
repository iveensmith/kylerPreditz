export type FaqEntry = { question: string; answer: string };

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
