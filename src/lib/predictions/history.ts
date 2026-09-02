import { FixtureStatus } from "@/generated/prisma/enums";
import { getFixturesBySeason } from "@/lib/api-football/endpoints";
import { getCurrentSeason } from "@/lib/api-football/season";
import { toMatchResults } from "@/lib/api-football/transform";
import { seasonCalendarForApiId } from "@/lib/leagues.config";
import { prisma } from "@/lib/db/prisma";
import type { LeagueAverages, MatchResult } from "./model";

const TEAM_HISTORY_POOL_SIZE = 20;
const PRIOR_SEASON_TOP_UP = 15;
const MIN_LEAGUE_SAMPLE = 20;

/** The minimal finished-fixture shape both the history model and the AI context builder consume. */
export type FinishedFixtureRow = {
  homeTeamId: string;
  awayTeamId: string;
  kickoffUtc: Date;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
};

export const finishedFixtureSelect = {
  homeTeamId: true,
  awayTeamId: true,
  kickoffUtc: true,
  homeScore: true,
  awayScore: true,
  homeTeam: { select: { name: true } },
  awayTeam: { select: { name: true } },
} as const;

/** Maps finished-fixture rows (most-recent-first) to the model's MatchResult shape for one team. */
export function finishedRowsToMatchResults(teamId: string, rows: FinishedFixtureRow[]): MatchResult[] {
  return rows.map((f) =>
    f.homeTeamId === teamId
      ? { date: f.kickoffUtc.toISOString(), venue: "home" as const, goalsFor: f.homeScore!, goalsAgainst: f.awayScore! }
      : { date: f.kickoffUtc.toISOString(), venue: "away" as const, goalsFor: f.awayScore!, goalsAgainst: f.homeScore! },
  );
}

/** A team's finished matches already in our DB, most recent first. */
async function dbMatchResults(teamId: string): Promise<MatchResult[]> {
  const fixtures = await prisma.fixture.findMany({
    where: {
      status: FixtureStatus.FINISHED,
      homeScore: { not: null },
      awayScore: { not: null },
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    orderBy: { kickoffUtc: "desc" },
    take: TEAM_HISTORY_POOL_SIZE,
    select: finishedFixtureSelect,
  });

  return finishedRowsToMatchResults(teamId, fixtures);
}

/**
 * A team's recent match history for the stage-1 model. DB history grows over
 * time as the season progresses (sync-fixtures + sync-results accumulate
 * finished matches); early in a season - or for a team new to our tracking -
 * this tops up with the prior season's tail via a live API call, the same
 * pooling approach the Phase 2 backtest used to validate the model.
 */
export async function buildTeamHistory(params: {
  teamDbId: string;
  teamApiId: number;
  leagueApiId: number;
  /** Pre-fetched finished-fixture pool for this team (most recent first). When
   *  omitted, the DB is queried per team - pass this from a batched caller to
   *  avoid an N+1 across a list of fixtures. */
  preloadedDbRows?: FinishedFixtureRow[];
}): Promise<MatchResult[]> {
  const fromDb = params.preloadedDbRows
    ? finishedRowsToMatchResults(params.teamDbId, params.preloadedDbRows.slice(0, TEAM_HISTORY_POOL_SIZE))
    : await dbMatchResults(params.teamDbId);
  if (fromDb.length >= TEAM_HISTORY_POOL_SIZE) return fromDb;

  try {
    const priorSeason = getCurrentSeason(new Date(), seasonCalendarForApiId(params.leagueApiId)) - 1;
    const priorFixtures = await getFixturesBySeason(params.leagueApiId, priorSeason);
    const finished = priorFixtures
      .filter(
        (f) =>
          f.fixture.status.short === "FT" &&
          (f.teams.home.id === params.teamApiId || f.teams.away.id === params.teamApiId),
      )
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
      .slice(0, PRIOR_SEASON_TOP_UP);
    return [...fromDb, ...toMatchResults(params.teamApiId, finished)];
  } catch (err) {
    console.warn(`[history] prior-season top-up failed for team ${params.teamApiId}:`, err);
    return fromDb;
  }
}

/** League-wide average goals, current season if we have enough finished matches yet, else the prior season. */
export async function computeLeagueAverages(params: {
  leagueDbId: string;
  leagueApiId: number;
}): Promise<LeagueAverages> {
  const finished = await prisma.fixture.findMany({
    where: { leagueId: params.leagueDbId, status: FixtureStatus.FINISHED, homeScore: { not: null }, awayScore: { not: null } },
    select: { homeScore: true, awayScore: true },
  });

  if (finished.length >= MIN_LEAGUE_SAMPLE) {
    return {
      avgHomeGoals: average(finished.map((f) => f.homeScore!)),
      avgAwayGoals: average(finished.map((f) => f.awayScore!)),
    };
  }

  try {
    const priorSeason = getCurrentSeason(new Date(), seasonCalendarForApiId(params.leagueApiId)) - 1;
    const priorFixtures = await getFixturesBySeason(params.leagueApiId, priorSeason);
    const finishedPrior = priorFixtures.filter((f) => f.fixture.status.short === "FT");
    if (finishedPrior.length === 0) throw new Error("no finished fixtures in prior season either");
    return {
      avgHomeGoals: average(finishedPrior.map((f) => f.goals.home ?? 0)),
      avgAwayGoals: average(finishedPrior.map((f) => f.goals.away ?? 0)),
    };
  } catch (err) {
    console.warn(`[history] league-average fallback failed for league ${params.leagueApiId}:`, err);
    // Last resort: a league-agnostic constant rather than dividing by zero downstream.
    return { avgHomeGoals: 1.5, avgAwayGoals: 1.2 };
  }
}

function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
