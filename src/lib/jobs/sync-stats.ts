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

export type LeagueTablesResult = {
  /** Leagues whose standings + top scorers were checked (all of them, every run). */
  tablesChecked: number;
  standingsWritten: number;
  topScorersWritten: number;
  staleRowsPruned: number;
  errors: string[];
};

export type TeamStatsResult = {
  /** Leagues whose per-team TeamStats were refreshed this run (stalest-first, time-boxed). */
  leaguesRefreshed: number;
  leaguesDeferred: number;
  teamsUpdated: number;
  errors: string[];
};

const UPSERT_CONCURRENCY = 10;
// Leagues processed in parallel in the table pass - the API client has its own
// rate-limit throttle and the DB pool handles the fan-out.
const LEAGUE_CONCURRENCY = 5;
// The per-team-statistics pass can't finish all 32 leagues inside one function
// invocation. It works stalest-first and stops here; its own schedule catches up.
const TEAM_STATS_BUDGET_MS = 45_000;

async function inChunks<T>(items: T[], size: number, fn: (item: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

/**
 * Standings + top scorers for every featured league. Cheap: two cached API calls
 * per league, and rows are only written when a value actually changed (most runs
 * between matchdays write nothing). This is the freshness-sensitive half - it
 * runs often and must stay well under any scheduler's response timeout.
 */
export async function syncLeagueTables(): Promise<LeagueTablesResult> {
  const result: LeagueTablesResult = {
    tablesChecked: 0,
    standingsWritten: 0,
    topScorersWritten: 0,
    staleRowsPruned: 0,
    errors: [],
  };

  const leagues = await prisma.league.findMany({
    where: { isFeatured: true },
    orderBy: { priority: "asc" },
  });

  const allTeams = await prisma.team.findMany({ select: { id: true, apiId: true } });
  const teamIdByApiId = new Map(allTeams.map((t) => [t.apiId, t.id]));

  await inChunks(leagues, LEAGUE_CONCURRENCY, async (league) => {
    const season = getCurrentSeason(new Date(), seasonCalendarForApiId(league.apiId));
    try {
      const [standings, topScorers, existingStandings, existingScorers] = await Promise.all([
        getStandings(league.apiId, season),
        getTopScorers(league.apiId, season),
        prisma.standing.findMany({ where: { leagueId: league.id, season } }),
        prisma.topScorer.findMany({ where: { leagueId: league.id, season } }),
      ]);

      // ---- standings ----------------------------------------------------
      const standingByTeam = new Map(existingStandings.map((s) => [s.teamId, s]));
      const seenStandingTeamIds = new Set<string>();
      await inChunks(
        standings.filter((row) => teamIdByApiId.has(row.team.id)),
        UPSERT_CONCURRENCY,
        async (row) => {
          const teamId = teamIdByApiId.get(row.team.id)!;
          seenStandingTeamIds.add(teamId);
          const next = {
            rank: row.rank,
            played: row.all.played,
            points: row.points ?? 0,
            goalDiff: row.goalsDiff ?? 0,
          };
          const current = standingByTeam.get(teamId);
          if (
            current &&
            current.rank === next.rank &&
            current.played === next.played &&
            current.points === next.points &&
            current.goalDiff === next.goalDiff
          ) {
            return; // unchanged
          }
          await prisma.standing.upsert({
            where: { leagueId_teamId_season: { leagueId: league.id, teamId, season } },
            create: { leagueId: league.id, teamId, season, ...next },
            update: next,
          });
          result.standingsWritten++;
        },
      );
      // Drop rows for teams no longer in the table - but only when the API
      // actually returned one (an empty pre-season cup response must not wipe it).
      if (seenStandingTeamIds.size > 0) {
        const stale = existingStandings.filter((s) => !seenStandingTeamIds.has(s.teamId)).map((s) => s.id);
        if (stale.length > 0) {
          const pruned = await prisma.standing.deleteMany({ where: { id: { in: stale } } });
          result.staleRowsPruned += pruned.count;
        }
      }

      // ---- top scorers ------------------------------------------------
      const scorerByKey = new Map(existingScorers.map((s) => [`${s.teamId}::${s.playerName}`, s]));
      const seenScorerIds = new Set<string>();
      await inChunks(
        topScorers.filter((e) => e.statistics[0] && teamIdByApiId.has(e.statistics[0].team.id)),
        UPSERT_CONCURRENCY,
        async (entry) => {
          const stat = entry.statistics[0]!;
          const teamId = teamIdByApiId.get(stat.team.id)!;
          const next = {
            playerApiId: entry.player.id,
            photoUrl: entry.player.photo ?? null,
            goals: stat.goals.total ?? 0,
            appearances: stat.games.appearences ?? 0,
          };
          const current = scorerByKey.get(`${teamId}::${entry.player.name}`);
          if (current) {
            seenScorerIds.add(current.id);
            if (
              current.goals === next.goals &&
              current.appearances === next.appearances &&
              current.playerApiId === next.playerApiId &&
              current.photoUrl === next.photoUrl
            ) {
              return; // unchanged
            }
            await prisma.topScorer.update({ where: { id: current.id }, data: next });
            result.topScorersWritten++;
            return;
          }
          const created = await prisma.topScorer.create({
            data: { leagueId: league.id, teamId, playerName: entry.player.name, season, ...next },
            select: { id: true },
          });
          seenScorerIds.add(created.id);
          result.topScorersWritten++;
        },
      );
      // The API only returns the current top ~20; anyone who dropped out keeps a
      // stale row (and stale goal count) that pollutes the top-10 list.
      if (seenScorerIds.size > 0) {
        const stale = existingScorers.filter((s) => !seenScorerIds.has(s.id)).map((s) => s.id);
        if (stale.length > 0) {
          const pruned = await prisma.topScorer.deleteMany({ where: { id: { in: stale } } });
          result.staleRowsPruned += pruned.count;
        }
      }

      result.tablesChecked++;
    } catch (err) {
      const label = err instanceof ApiFootballQuotaExceededError ? "quota exhausted" : String(err instanceof Error ? err.message : err);
      result.errors.push(`${league.name}: ${label}`);
    }
  });

  return result;
}

/**
 * Per-team TeamStats (goals for/against, form, clean sheets) - the stage-1
 * model's inputs. A statistics call per team, so it can't cover every league in
 * one run: stalest-first, time-boxed, `League.statsSyncedAt` is the cursor.
 * Delay-tolerant - generate-predictions tops these up from the API anyway.
 */
export async function syncTeamStats(): Promise<TeamStatsResult> {
  const result: TeamStatsResult = {
    leaguesRefreshed: 0,
    leaguesDeferred: 0,
    teamsUpdated: 0,
    errors: [],
  };

  const leagues = await prisma.league.findMany({
    where: { isFeatured: true },
    orderBy: [{ statsSyncedAt: { sort: "asc", nulls: "first" } }, { priority: "asc" }],
  });
  const queue = leagues.filter((l) => !isCupLeague(l.apiId));

  const allTeams = await prisma.team.findMany({ select: { id: true, apiId: true } });
  const teamIdByApiId = new Map(allTeams.map((t) => [t.apiId, t.id]));

  const startedAt = Date.now();
  let attempted = 0;
  for (const league of queue) {
    if (Date.now() - startedAt > TEAM_STATS_BUDGET_MS) {
      result.leaguesDeferred = queue.length - attempted;
      break;
    }
    attempted++;
    const season = getCurrentSeason(new Date(), seasonCalendarForApiId(league.apiId));
    try {
      const apiTeams = await getTeamsByLeague(league.apiId, season);
      for (const t of apiTeams) {
        const teamId = teamIdByApiId.get(t.team.id);
        if (!teamId) continue;
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
      result.leaguesRefreshed++;
    } catch (err) {
      if (err instanceof ApiFootballQuotaExceededError) {
        result.errors.push(`${league.name}: quota exhausted, stopping`);
        return result;
      }
      result.errors.push(`${league.name}: ${err instanceof Error ? err.message : String(err)}`);
      await prisma.league
        .update({ where: { id: league.id }, data: { statsSyncedAt: new Date() } })
        .catch(() => {});
    }
  }

  return result;
}

/** Both passes - for the `npm run sync:stats` CLI runner. The cron endpoints call each separately. */
export async function syncStats() {
  const tables = await syncLeagueTables();
  const teamStats = await syncTeamStats();
  return { tables, teamStats };
}
