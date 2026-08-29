import { prisma } from "@/lib/db/prisma";
import {
  getStandings,
  getTeamsByLeague,
  getTeamStatistics,
  getTopScorers,
} from "@/lib/api-football/endpoints";
import { getCurrentSeason } from "@/lib/api-football/season";
import { ApiFootballQuotaExceededError } from "@/lib/api-football/client";
import { seasonCalendarForApiId } from "@/lib/leagues.config";

export type SyncStatsResult = {
  leaguesProcessed: number;
  teamsUpdated: number;
  standingsUpdated: number;
  topScorersUpdated: number;
  errors: string[];
};

/** Refreshes team stats, standings, and top scorers for every actively-synced league. */
export async function syncStats(): Promise<SyncStatsResult> {
  const leagues = await prisma.league.findMany({ where: { isFeatured: true } });

  const result: SyncStatsResult = {
    leaguesProcessed: 0,
    teamsUpdated: 0,
    standingsUpdated: 0,
    topScorersUpdated: 0,
    errors: [],
  };

  outer: for (const league of leagues) {
    try {
      const season = getCurrentSeason(new Date(), seasonCalendarForApiId(league.apiId));
      const apiTeams = await getTeamsByLeague(league.apiId, season);
      const teamIdByApiId = new Map<number, string>();

      for (const t of apiTeams) {
        const team = await prisma.team.upsert({
          where: { apiId: t.team.id },
          create: {
            apiId: t.team.id,
            name: t.team.name,
            shortName: t.team.code,
            logoUrl: t.team.logo,
            leagueId: league.id,
          },
          update: { name: t.team.name, shortName: t.team.code, logoUrl: t.team.logo },
        });
        teamIdByApiId.set(t.team.id, team.id);
      }

      for (const [apiTeamId, teamId] of teamIdByApiId) {
        try {
          const stats = await getTeamStatistics(league.apiId, season, apiTeamId);
          if (!stats) continue; // no stats published for this team/league/season

          await prisma.teamStats.upsert({
            where: { teamId_season: { teamId, season } },
            create: {
              teamId,
              season,
              played: stats.fixtures.played.total ?? 0,
              wins: stats.fixtures.wins.total ?? 0,
              draws: stats.fixtures.draws.total ?? 0,
              losses: stats.fixtures.loses.total ?? 0,
              goalsFor: stats.goals.for.total.total ?? 0,
              goalsAgainst: stats.goals.against.total.total ?? 0,
              homeGoalsFor: stats.goals.for.total.home ?? 0,
              homeGoalsAgainst: stats.goals.against.total.home ?? 0,
              awayGoalsFor: stats.goals.for.total.away ?? 0,
              awayGoalsAgainst: stats.goals.against.total.away ?? 0,
              cleanSheets: stats.clean_sheet.total ?? 0,
              failedToScore: stats.failed_to_score.total ?? 0,
              form: stats.form,
            },
            update: {
              played: stats.fixtures.played.total ?? 0,
              wins: stats.fixtures.wins.total ?? 0,
              draws: stats.fixtures.draws.total ?? 0,
              losses: stats.fixtures.loses.total ?? 0,
              goalsFor: stats.goals.for.total.total ?? 0,
              goalsAgainst: stats.goals.against.total.total ?? 0,
              homeGoalsFor: stats.goals.for.total.home ?? 0,
              homeGoalsAgainst: stats.goals.against.total.home ?? 0,
              awayGoalsFor: stats.goals.for.total.away ?? 0,
              awayGoalsAgainst: stats.goals.against.total.away ?? 0,
              cleanSheets: stats.clean_sheet.total ?? 0,
              failedToScore: stats.failed_to_score.total ?? 0,
              form: stats.form,
            },
          });
          result.teamsUpdated++;
        } catch (err) {
          if (err instanceof ApiFootballQuotaExceededError) {
            result.errors.push(`${league.name}: quota exhausted mid-sync, stopping`);
            break outer;
          }
          result.errors.push(
            `${league.name} team ${apiTeamId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      const standings = await getStandings(league.apiId, season);
      for (const row of standings) {
        const teamId = teamIdByApiId.get(row.team.id);
        if (!teamId) continue;
        await prisma.standing.upsert({
          where: { leagueId_teamId_season: { leagueId: league.id, teamId, season } },
          create: {
            leagueId: league.id,
            teamId,
            season,
            rank: row.rank,
            played: row.all.played,
            points: row.points ?? 0,
            goalDiff: row.goalsDiff ?? 0,
          },
          update: {
            rank: row.rank,
            played: row.all.played,
            points: row.points ?? 0,
            goalDiff: row.goalsDiff ?? 0,
          },
        });
        result.standingsUpdated++;
      }

      const topScorers = await getTopScorers(league.apiId, season);
      for (const entry of topScorers) {
        const stat = entry.statistics[0];
        if (!stat) continue;
        const teamId = teamIdByApiId.get(stat.team.id);
        if (!teamId) continue;
        await prisma.topScorer.upsert({
          where: {
            leagueId_teamId_playerName_season: {
              leagueId: league.id,
              teamId,
              playerName: entry.player.name,
              season,
            },
          },
          create: {
            leagueId: league.id,
            teamId,
            playerName: entry.player.name,
            playerApiId: entry.player.id,
            photoUrl: entry.player.photo ?? null,
            goals: stat.goals.total ?? 0,
            appearances: stat.games.appearences ?? 0,
            season,
          },
          update: {
            playerApiId: entry.player.id,
            photoUrl: entry.player.photo ?? null,
            goals: stat.goals.total ?? 0,
            appearances: stat.games.appearences ?? 0,
          },
        });
        result.topScorersUpdated++;
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
