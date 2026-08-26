import { cache } from "react";
import { getCurrentSeason } from "@/lib/api-football/season";
import { prisma } from "@/lib/db/prisma";
import { buildH2hEntries, buildTeamContextStats } from "@/lib/predictions/context-input";
import { slugify } from "@/lib/slugs";

/** cache()'d - both generateMetadata and the page component need this per request/render pass. */
export const getMatchDetail = cache(async (fixtureId: string) => {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { league: true, homeTeam: true, awayTeam: true, prediction: true },
  });
  if (!fixture) return null;

  const season = getCurrentSeason(fixture.kickoffUtc);
  const [homeStats, awayStats, h2h] = await Promise.all([
    buildTeamContextStats({ teamDbId: fixture.homeTeamId, leagueDbId: fixture.leagueId, season, kickoffUtc: fixture.kickoffUtc }),
    buildTeamContextStats({ teamDbId: fixture.awayTeamId, leagueDbId: fixture.leagueId, season, kickoffUtc: fixture.kickoffUtc }),
    buildH2hEntries(fixture.homeTeam.apiId, fixture.awayTeam.apiId),
  ]);

  return { fixture, homeStats, awayStats, h2h };
});

export type MatchDetail = NonNullable<Awaited<ReturnType<typeof getMatchDetail>>>;

/** Slug for the canonical match-detail URL, e.g. "arsenal-vs-chelsea". */
export function matchSlug(homeName: string, awayName: string): string {
  return `${slugify(homeName)}-vs-${slugify(awayName)}`;
}
