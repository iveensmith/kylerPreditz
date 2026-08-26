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
