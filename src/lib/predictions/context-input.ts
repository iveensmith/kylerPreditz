import { FixtureStatus } from "@/generated/prisma/enums";
import { getHeadToHead, getInjuries } from "@/lib/api-football/endpoints";
import { prisma } from "@/lib/db/prisma";
import type { H2hEntry, TeamContextStats } from "./ai/types";
import { finishedFixtureSelect, type FinishedFixtureRow } from "./history";

const LAST_N_RESULTS = 6;

/** Pre-fetched DB inputs for one team, so a batched caller can avoid an N+1 across a list of fixtures. */
export type TeamContextPreload = {
  stats: { played: number; form: string | null; goalsFor: number; goalsAgainst: number; homeGoalsFor: number; awayGoalsFor: number; cleanSheets: number } | null;
  standing: { rank: number } | null;
  /** This team's finished-fixture pool, most recent first (sliced to LAST_N_RESULTS internally). */
  recent: FinishedFixtureRow[];
};

/** Assembles one team's AI-context stats from whatever we have in the DB (TeamStats, Standing, recent fixtures). */
export async function buildTeamContextStats(params: {
  teamDbId: string;
  leagueDbId: string;
  season: number;
  kickoffUtc: Date;
  preload?: TeamContextPreload;
}): Promise<TeamContextStats> {
  const { stats, standing, recent } = params.preload
    ? { ...params.preload, recent: params.preload.recent.slice(0, LAST_N_RESULTS) }
    : await fetchTeamContextInputs(params);

  const played = stats?.played ?? 0;
  const restDays = recent[0]
    ? Math.max(0, Math.round((params.kickoffUtc.getTime() - recent[0].kickoffUtc.getTime()) / (24 * 60 * 60 * 1000)))
    : null;

  return {
    form: stats?.form?.slice(-5) ?? "",
    last6Results: recent.map((f) => {
      const isHome = f.homeTeamId === params.teamDbId;
      return {
        date: f.kickoffUtc.toISOString(),
        opponent: isHome ? f.awayTeam.name : f.homeTeam.name,
        score: `${f.homeScore}-${f.awayScore}`,
        venue: isHome ? ("home" as const) : ("away" as const),
      };
    }),
    goalsForAvg: played > 0 ? round2((stats?.goalsFor ?? 0) / played) : 0,
    goalsAgainstAvg: played > 0 ? round2((stats?.goalsAgainst ?? 0) / played) : 0,
    homeGoalsForAvg: played > 0 ? round2((stats?.homeGoalsFor ?? 0) / played) : undefined,
    awayGoalsForAvg: played > 0 ? round2((stats?.awayGoalsFor ?? 0) / played) : undefined,
    cleanSheets: stats?.cleanSheets ?? 0,
    leaguePosition: standing?.rank ?? null,
    restDays,
  };
}

/** Per-team DB lookups for the single-fixture path (match-detail page). The
 *  batched prediction job supplies these itself via `preload` instead. */
async function fetchTeamContextInputs(params: {
  teamDbId: string;
  leagueDbId: string;
  season: number;
}): Promise<TeamContextPreload> {
  const [stats, standing, recent] = await Promise.all([
    prisma.teamStats.findUnique({ where: { teamId_season: { teamId: params.teamDbId, season: params.season } } }),
    prisma.standing.findUnique({
      where: { leagueId_teamId_season: { leagueId: params.leagueDbId, teamId: params.teamDbId, season: params.season } },
      select: { rank: true },
    }),
    prisma.fixture.findMany({
      where: {
        status: FixtureStatus.FINISHED,
        homeScore: { not: null },
        awayScore: { not: null },
        OR: [{ homeTeamId: params.teamDbId }, { awayTeamId: params.teamDbId }],
      },
      orderBy: { kickoffUtc: "desc" },
      take: LAST_N_RESULTS,
      select: finishedFixtureSelect,
    }),
  ]);
  return { stats, standing, recent };
}

/** Live H2H lookup, mapped to the context packet's shape from the current fixture's home team's perspective. */
export async function buildH2hEntries(homeApiTeamId: number, awayApiTeamId: number): Promise<H2hEntry[]> {
  try {
    const fixtures = await getHeadToHead(homeApiTeamId, awayApiTeamId);
    return fixtures
      .filter((f) => f.fixture.status.short === "FT")
      .map((f) => ({
        date: f.fixture.date,
        score: `${f.goals.home}-${f.goals.away}`,
        venue: f.teams.home.id === homeApiTeamId ? ("home" as const) : ("away" as const),
      }));
  } catch (err) {
    console.warn(`[context] H2H lookup failed for ${homeApiTeamId} vs ${awayApiTeamId}:`, err);
    return [];
  }
}

/** Live injuries lookup, best-effort - a failure here degrades to "no known injuries" rather than blocking the fixture. */
export async function buildInjuries(
  leagueApiId: number,
  season: number,
  homeApiTeamId: number,
  awayApiTeamId: number,
): Promise<{ home: string[]; away: string[] }> {
  try {
    const [home, away] = await Promise.all([
      getInjuries(leagueApiId, season, homeApiTeamId),
      getInjuries(leagueApiId, season, awayApiTeamId),
    ]);
    return {
      home: home.map((i) => i.player.name),
      away: away.map((i) => i.player.name),
    };
  } catch (err) {
    console.warn(`[context] injuries lookup failed for league ${leagueApiId}:`, err);
    return { home: [], away: [] };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
