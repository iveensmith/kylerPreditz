import { prisma } from "@/lib/db/prisma";
import { getFixturesByDateRange } from "@/lib/api-football/endpoints";
import { getCurrentSeason } from "@/lib/api-football/season";
import { mapApiFixtureStatus } from "@/lib/api-football/status";
import { ApiFootballQuotaExceededError } from "@/lib/api-football/client";
import { apiTeamLogoUrl, seasonCalendarForApiId } from "@/lib/leagues.config";

// 21, not 7: one /fixtures call covers the whole window regardless of width, and
// cup competitions (UCL, UEL) run on a ~3-week matchday cycle - a 7-day window
// left them invisible until days before kickoff, and even 14 missed the first
// Europa League round. Predictions still only generate 48h out, so this is just
// schedule visibility on the date strip.
const SYNC_WINDOW_DAYS = 21;

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export type SyncFixturesResult = {
  leaguesProcessed: number;
  fixturesUpserted: number;
  errors: string[];
};

/** Pulls the next 7 days of fixtures for every actively-synced league. */
export async function syncFixtures(): Promise<SyncFixturesResult> {
  const leagues = await prisma.league.findMany({ where: { isFeatured: true } });
  const from = toDateParam(new Date());
  const to = toDateParam(new Date(Date.now() + SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000));

  const result: SyncFixturesResult = { leaguesProcessed: 0, fixturesUpserted: 0, errors: [] };

  for (const league of leagues) {
    try {
      const season = getCurrentSeason(new Date(), seasonCalendarForApiId(league.apiId));
      const fixtures = await getFixturesByDateRange(league.apiId, season, from, to);

      for (const f of fixtures) {
        const homeTeam = await prisma.team.upsert({
          where: { apiId: f.teams.home.id },
          create: {
            apiId: f.teams.home.id,
            name: f.teams.home.name,
            logoUrl: f.teams.home.logo || apiTeamLogoUrl(f.teams.home.id),
            leagueId: league.id,
          },
          update: { name: f.teams.home.name, logoUrl: f.teams.home.logo },
        });

        const awayTeam = await prisma.team.upsert({
          where: { apiId: f.teams.away.id },
          create: {
            apiId: f.teams.away.id,
            name: f.teams.away.name,
            logoUrl: f.teams.away.logo || apiTeamLogoUrl(f.teams.away.id),
            leagueId: league.id,
          },
          update: { name: f.teams.away.name, logoUrl: f.teams.away.logo },
        });

        await prisma.fixture.upsert({
          where: { apiId: f.fixture.id },
          create: {
            apiId: f.fixture.id,
            leagueId: league.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            kickoffUtc: new Date(f.fixture.date),
            status: mapApiFixtureStatus(f.fixture.status.short),
            homeScore: f.goals.home,
            awayScore: f.goals.away,
            htHomeScore: f.score.halftime.home,
            htAwayScore: f.score.halftime.away,
            elapsedMinutes: f.fixture.status.elapsed,
            venue: f.fixture.venue.name,
          },
          update: {
            kickoffUtc: new Date(f.fixture.date),
            status: mapApiFixtureStatus(f.fixture.status.short),
            homeScore: f.goals.home,
            awayScore: f.goals.away,
            htHomeScore: f.score.halftime.home,
            htAwayScore: f.score.halftime.away,
            elapsedMinutes: f.fixture.status.elapsed,
            venue: f.fixture.venue.name,
          },
        });
        result.fixturesUpserted++;
      }
      result.leaguesProcessed++;
    } catch (err) {
      if (err instanceof ApiFootballQuotaExceededError) {
        result.errors.push(`${league.name}: quota exhausted, stopping sync for this run`);
        break;
      }
      result.errors.push(`${league.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
