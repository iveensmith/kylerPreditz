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
  /** Leagues whose standings + top scorers were refreshed (pass 1 - every run covers all of them). */
  tablesRefreshed: number;
  /** Leagues whose per-team TeamStats were refreshed (pass 2 - time-boxed, stalest-first). */
  teamStatsRefreshed: number;
  teamStatsDeferred: number;
  teamsUpdated: number;
  standingsUpdated: number;
  topScorersUpdated: number;
  staleRowsPruned: number;
  errors: string[];
};

// Vercel Hobby kills any function at 60s. Pass 1 (standings + scorers, 2 cheap
// API calls per league) is fast enough to cover all 32 leagues every run. Pass 2
// (a team-statistics call per team) is not - it works stalest-first and stops
// when the budget runs out; the hourly schedule catches every league up within a
// few hours. The two are separate so a matchday's table/scorer changes always
// show within the hour, not whenever pass 2 happens to reach that league.
const TEAM_STATS_BUDGET_MS = 30_000;
const UPSERT_CONCURRENCY = 8;

async function inChunks<T>(items: T[], size: number, fn: (item: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

/** Refreshes standings + top scorers for every league, then per-team stats stalest-first (time-boxed). */
export async function syncStats(): Promise<SyncStatsResult> {
  const result: SyncStatsResult = {
    tablesRefreshed: 0,
    teamStatsRefreshed: 0,
    teamStatsDeferred: 0,
    teamsUpdated: 0,
    standingsUpdated: 0,
    topScorersUpdated: 0,
    staleRowsPruned: 0,
    errors: [],
  };

  const leagues = await prisma.league.findMany({
    where: { isFeatured: true },
    orderBy: { priority: "asc" },
  });

  // One bulk load instead of a /teams call + per-team upsert per league. Teams
  // are created by sync-fixtures; a standings/scorer row for a team we've never
  // seen a fixture for is just skipped (it'll resolve once that fixture syncs).
  const allTeams = await prisma.team.findMany({ select: { id: true, apiId: true } });
  const teamIdByApiId = new Map(allTeams.map((t) => [t.apiId, t.id]));

  // ---- Pass 1: standings + top scorers, every league -----------------------
  for (const league of leagues) {
    const season = getCurrentSeason(new Date(), seasonCalendarForApiId(league.apiId));
    try {
      const [standings, topScorers] = await Promise.all([
        getStandings(league.apiId, season),
        getTopScorers(league.apiId, season),
      ]);

      const seenStandingTeamIds: string[] = [];
      await inChunks(
        standings.filter((row) => teamIdByApiId.has(row.team.id)),
        UPSERT_CONCURRENCY,
        async (row) => {
          const teamId = teamIdByApiId.get(row.team.id)!;
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
        },
      );
      // Drop rows for teams no longer in this season's table. Only when the API
      // actually returned one - an empty response (pre-season cup) must not
      // wipe an existing table.
      if (seenStandingTeamIds.length > 0) {
        const pruned = await prisma.standing.deleteMany({
          where: { leagueId: league.id, season, teamId: { notIn: seenStandingTeamIds } },
        });
        result.staleRowsPruned += pruned.count;
      }

      const seenScorerIds: string[] = [];
      await inChunks(
        topScorers.filter((e) => e.statistics[0] && teamIdByApiId.has(e.statistics[0].team.id)),
        UPSERT_CONCURRENCY,
        async (entry) => {
          const stat = entry.statistics[0]!;
          const teamId = teamIdByApiId.get(stat.team.id)!;
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
        },
      );
      // The API returns only the current top ~20; a player who has since dropped
      // out keeps a stale row (and stale goal count) that pollutes the top-10 list.
      if (seenScorerIds.length > 0) {
        const pruned = await prisma.topScorer.deleteMany({
          where: { leagueId: league.id, season, id: { notIn: seenScorerIds } },
        });
        result.staleRowsPruned += pruned.count;
      }

      result.tablesRefreshed++;
    } catch (err) {
      if (err instanceof ApiFootballQuotaExceededError) {
        result.errors.push(`${league.name}: quota exhausted during table refresh, stopping`);
        return result;
      }
      result.errors.push(`${league.name} tables: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ---- Pass 2: per-team TeamStats, stalest first, time-boxed --------------
  const startedPass2 = Date.now();
  const teamStatsQueue = [...leagues]
    .filter((l) => !isCupLeague(l.apiId))
    .sort((a, b) => {
      const at = a.statsSyncedAt?.getTime() ?? 0;
      const bt = b.statsSyncedAt?.getTime() ?? 0;
      return at - bt;
    });

  let attempted = 0;
  for (const league of teamStatsQueue) {
    if (Date.now() - startedPass2 > TEAM_STATS_BUDGET_MS) {
      result.teamStatsDeferred = teamStatsQueue.length - attempted;
      break;
    }
    attempted++;
    const season = getCurrentSeason(new Date(), seasonCalendarForApiId(league.apiId));
    try {
      const apiTeams = await getTeamsByLeague(league.apiId, season);
      for (const t of apiTeams) {
        const teamId = teamIdByApiId.get(t.team.id);
        if (!teamId) continue; // team without any synced fixture yet - skip
        try {
          const stats = await getTeamStatistics(league.apiId, season, t.team.id);
          if (!stats) continue;
          const data = {
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
          };
          await prisma.teamStats.upsert({
            where: { teamId_season: { teamId, season } },
            create: { teamId, season, ...data },
            update: data,
          });
          result.teamsUpdated++;
        } catch (err) {
          if (err instanceof ApiFootballQuotaExceededError) {
            result.errors.push(`${league.name}: quota exhausted mid team-stats, stopping`);
            return result;
          }
          result.errors.push(
            `${league.name} team ${t.team.id}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
      await prisma.league.update({ where: { id: league.id }, data: { statsSyncedAt: new Date() } });
      result.teamStatsRefreshed++;
    } catch (err) {
      if (err instanceof ApiFootballQuotaExceededError) {
        result.errors.push(`${league.name}: quota exhausted, stopping team-stats pass`);
        return result;
      }
      result.errors.push(`${league.name} team-stats: ${err instanceof Error ? err.message : String(err)}`);
      // Stamp anyway so a consistently-failing league can't starve the queue.
      await prisma.league
        .update({ where: { id: league.id }, data: { statsSyncedAt: new Date() } })
        .catch(() => {});
    }
  }

  return result;
}
