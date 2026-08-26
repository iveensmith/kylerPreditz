import { apiFootballRequest } from "./client";
import {
  apiFixturesResponseSchema,
  apiInjuriesResponseSchema,
  apiLeaguesResponseSchema,
  apiStandingsResponseSchema,
  apiTeamsResponseSchema,
  apiTeamStatisticsResponseSchema,
  apiTopScorersResponseSchema,
} from "./types";

const DAY = 60 * 60 * 24;

export async function getLeagueById(apiLeagueId: number) {
  const { response } = await apiFootballRequest(
    "/leagues",
    { id: apiLeagueId },
    apiLeaguesResponseSchema,
    { ttlSeconds: 30 * DAY },
  );
  return response[0];
}

export async function getTeamsByLeague(apiLeagueId: number, season: number) {
  const { response } = await apiFootballRequest(
    "/teams",
    { league: apiLeagueId, season },
    apiTeamsResponseSchema,
    { ttlSeconds: 7 * DAY },
  );
  return response;
}

export async function getFixturesByDateRange(
  apiLeagueId: number,
  season: number,
  from: string,
  to: string,
) {
  const { response } = await apiFootballRequest(
    "/fixtures",
    { league: apiLeagueId, season, from, to },
    apiFixturesResponseSchema,
    { ttlSeconds: 6 * 60 * 60 },
  );
  return response;
}

/** Full season of fixtures in one call — for backtesting, not the rolling sync jobs. */
export async function getFixturesBySeason(apiLeagueId: number, season: number) {
  const { response } = await apiFootballRequest(
    "/fixtures",
    { league: apiLeagueId, season },
    apiFixturesResponseSchema,
    { ttlSeconds: 30 * DAY },
  );
  return response;
}

export async function getTeamStatistics(apiLeagueId: number, season: number, apiTeamId: number) {
  const { response } = await apiFootballRequest(
    "/teams/statistics",
    { league: apiLeagueId, season, team: apiTeamId },
    apiTeamStatisticsResponseSchema,
    { ttlSeconds: DAY },
  );
  // API-Football returns [] instead of {} when the team has no stats for this league/season.
  return Array.isArray(response) ? null : response;
}

export async function getStandings(apiLeagueId: number, season: number) {
  const { response } = await apiFootballRequest(
    "/standings",
    { league: apiLeagueId, season },
    apiStandingsResponseSchema,
    { ttlSeconds: DAY },
  );
  return response[0]?.league.standings.flat() ?? [];
}

export async function getTopScorers(apiLeagueId: number, season: number) {
  const { response } = await apiFootballRequest(
    "/players/topscorers",
    { league: apiLeagueId, season },
    apiTopScorersResponseSchema,
    { ttlSeconds: DAY },
  );
  return response;
}

/** Last 10 meetings between two teams, most recent first. */
export async function getHeadToHead(homeApiTeamId: number, awayApiTeamId: number) {
  const { response } = await apiFootballRequest(
    "/fixtures/headtohead",
    { h2h: `${homeApiTeamId}-${awayApiTeamId}`, last: 10 },
    apiFixturesResponseSchema,
    { ttlSeconds: 7 * DAY },
  );
  return response;
}

/** Current injuries for a team this season - used to enrich the AI layer's context packet. */
export async function getInjuries(apiLeagueId: number, season: number, apiTeamId: number) {
  const { response } = await apiFootballRequest(
    "/injuries",
    { league: apiLeagueId, season, team: apiTeamId },
    apiInjuriesResponseSchema,
    { ttlSeconds: DAY },
  );
  return response;
}

/**
 * Single-day fixture lookup with a short TTL - for the sync-results job, which
 * needs near-live scores rather than getFixturesByDateRange's 6h cache.
 */
export async function getFixturesForLiveUpdate(apiLeagueId: number, season: number, date: string) {
  const { response } = await apiFootballRequest(
    "/fixtures",
    { league: apiLeagueId, season, date },
    apiFixturesResponseSchema,
    { ttlSeconds: 90 },
  );
  return response;
}
