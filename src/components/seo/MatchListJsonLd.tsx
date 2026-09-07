import { absoluteUrl } from "@/lib/seo";
import { matchSlug } from "@/lib/queries/match-detail";
import { buildItemListJsonLd } from "@/lib/structured-data";
import { JsonLd } from "./JsonLd";
import type { LeagueWithFixtures } from "@/lib/queries/types";

/**
 * ItemList JSON-LD for a tip board (homepage, market pages, day pages): every
 * fixture that has a visible prediction, in render order, linking to its match
 * page. Renders nothing when the board is empty.
 */
export function MatchListJsonLd({ leagues }: { leagues: LeagueWithFixtures[] }) {
  const urls = leagues.flatMap((league) =>
    league.fixtures
      .filter((f) => f.prediction && !f.prediction.locked)
      .map((f) => absoluteUrl(`/predictions/${f.id}/${matchSlug(f.homeTeam.name, f.awayTeam.name)}`)),
  );

  if (urls.length === 0) return null;
  return <JsonLd data={buildItemListJsonLd(urls)} />;
}
