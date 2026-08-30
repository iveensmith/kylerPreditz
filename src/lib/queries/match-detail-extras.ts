import { getHeadToHead, getTeamRecentFixtures } from "@/lib/api-football/endpoints";

export type H2hFixture = {
  date: string;
  competition: string;
  home: { name: string; logoUrl: string | null; goals: number };
  away: { name: string; logoUrl: string | null; goals: number };
};

export type RecentFixture = {
  date: string;
  competition: string;
  opponent: { name: string; logoUrl: string | null };
  homeAway: "H" | "A";
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "D" | "L";
};

function result(gf: number, ga: number): "W" | "D" | "L" {
  if (gf > ga) return "W";
  if (gf < ga) return "L";
  return "D";
}

/** Last 10 meetings between the two teams, with names + crests, most recent first. Best-effort. */
export async function buildH2hFixtures(
  homeApiTeamId: number,
  awayApiTeamId: number,
): Promise<H2hFixture[]> {
  try {
    const fixtures = await getHeadToHead(homeApiTeamId, awayApiTeamId);
    return fixtures
      .filter((f) => f.fixture.status.short === "FT" && f.goals.home !== null && f.goals.away !== null)
      .map((f) => ({
        date: f.fixture.date,
        competition: f.league.name,
        home: { name: f.teams.home.name, logoUrl: f.teams.home.logo, goals: f.goals.home as number },
        away: { name: f.teams.away.name, logoUrl: f.teams.away.logo, goals: f.goals.away as number },
      }));
  } catch (err) {
    console.warn(`[match-extras] H2H lookup failed for ${homeApiTeamId} vs ${awayApiTeamId}:`, err);
    return [];
  }
}

/** One team's last 10 completed fixtures across all competitions, most recent first. Best-effort. */
export async function buildRecentFixtures(apiTeamId: number): Promise<RecentFixture[]> {
  try {
    const fixtures = await getTeamRecentFixtures(apiTeamId, 10);
    return fixtures
      .filter((f) => f.fixture.status.short === "FT" && f.goals.home !== null && f.goals.away !== null)
      .map((f) => {
        const isHome = f.teams.home.id === apiTeamId;
        const goalsFor = (isHome ? f.goals.home : f.goals.away) as number;
        const goalsAgainst = (isHome ? f.goals.away : f.goals.home) as number;
        const opponent = isHome ? f.teams.away : f.teams.home;
        return {
          date: f.fixture.date,
          competition: f.league.name,
          opponent: { name: opponent.name, logoUrl: opponent.logo },
          homeAway: isHome ? ("H" as const) : ("A" as const),
          goalsFor,
          goalsAgainst,
          result: result(goalsFor, goalsAgainst),
        };
      });
  } catch (err) {
    console.warn(`[match-extras] recent-fixtures lookup failed for team ${apiTeamId}:`, err);
    return [];
  }
}
