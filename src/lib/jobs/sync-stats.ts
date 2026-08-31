import { prisma } from "@/lib/db/prisma";
import {
  getStandings,
  getTeamsByLeague,
  getTeamStatistics,
  getTopScorers,
} from "@/lib/api-football/endpoints";
import { getCurrentSeason } from "@/lib/api-football/season";
import { ApiFootballQuotaExceededError } from "@/lib/api-football/client";
import { isCupLeague, seasonCalendarForApiId } from "@/lib/leagues.config";

export type SyncStatsResult = {
  leaguesProcessed: number;
  leaguesDeferred: number;
  teamsUpdated: number;
  standingsUpdated: number;
  topScorersUpdated: number;
  staleRowsPruned: number;
  errors: string[];
};

/**
 * Vercel Hobby kills any function at 60s, and a full 30-league refresh is far
 * more than that (roughly a team-statistics call per team). So each run works
 * through the leagues that were synced least recently and stops when the budget
 * is spent; the hourly schedule means every league still gets refreshed within a
 * few hours. Kept comfortably under the 60s hard limit.
 */
const TIME_BUDGET_MS = 35_000;

/** Refreshes team stats, standings, and top scorers, stalest leagues first, time-boxed per run. */
export async function syncStats(): Promise<SyncStatsResult> {
  const startedAt = Date.now();
  const leagues = await prisma.league.findMany({
    where: { isFeatured: true },
    orderBy: [{ statsSyncedAt: { sort: "asc", nulls: "first" } }, { priority: "asc" }],
  });

  const result: SyncStatsResult = {
    leaguesProcessed: 0,
    leaguesDeferred: 0,
    teamsUpdated: 0,
    standingsUpdated: 0,
    topScorersUpdated: 0,
    staleRowsPruned: 0,
    errors: [],
  };

  let attempted = 0;
  outer: for (const league of leagues) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      result.leaguesDeferred = leagues.length - attempted;
      break;
    }
    attempted++;
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

      // Cup competitions field 40-80 teams from many domestic leagues; each
      // already carries its own league's TeamStats. Skip the per-team loop
      // (its API cost is what the time budget is mostly spent on) and just
      // refresh the competition's standings + scorers below.
      const teamStatsTargets: Array<[number, string]> = isCupLeague(league.apiId)
        ? []
        : [...teamIdByApiId];
      for (const [apiTeamId, teamId] of teamStatsTargets) {
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
      const seenStandingTeamIds: string[] = [];
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
        seenStandingTeamIds.push(teamId);
        result.standingsUpdated++;
      }
      // Drop rows for teams no longer in this season's table (relegated last
      // season, wrong-season data from an earlier sync, etc.). Only when the
      // API actually returned a table - an empty response (pre-season cup)
      // must not wipe an existing one.
      if (seenStandingTeamIds.length > 0) {
        const pruned = await prisma.standing.deleteMany({
          where: { leagueId: league.id, season, teamId: { notIn: seenStandingTeamIds } },
        });
        result.staleRowsPruned += pruned.count;
      }

      const topScorers = await getTopScorers(league.apiId, season);
      const seenScorerIds: string[] = [];
      for (const entry of topScorers) {
        const stat = entry.statistics[0];
        if (!stat) continue;
        const teamId = teamIdByApiId.get(stat.team.id);
        if (!teamId) continue;
        const scorer = await prisma.topScorer.upsert({
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
          select: { id: true },
        });
        seenScorerIds.push(scorer.id);
        result.topScorersUpdated++;
      }
      // The API returns only the current top ~20; a player who has since
      // dropped out keeps a stale row (and stale goal count) that pollutes the
      // "top 10" list. Remove anyone no longer on the list.
      if (seenScorerIds.length > 0) {
        const pruned = await prisma.topScorer.deleteMany({
          where: { leagueId: league.id, season, id: { notIn: seenScorerIds } },
        });
        result.staleRowsPruned += pruned.count;
      }

      await prisma.league.update({
        where: { id: league.id },
        data: { statsSyncedAt: new Date() },
      });
      result.leaguesProcessed++;
    } catch (err) {
      if (err instanceof ApiFootballQuotaExceededError) {
        result.errors.push(`${league.name}: quota exhausted, stopping sync for this run`);
        break;
      }
      result.errors.push(`${league.name}: ${err instanceof Error ? err.message : String(err)}`);
      // Stamp anyway so one consistently-failing league can't sit at the front of
      // the stalest-first queue and starve the rest run after run. The error is
      // still reported; it'll come back around on the next full cycle.
      await prisma.league
        .update({ where: { id: league.id }, data: { statsSyncedAt: new Date() } })
        .catch(() => {});
    }
  }

  return result;
}
