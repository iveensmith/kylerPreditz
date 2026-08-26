import { getFixturesBySeason } from "../../src/lib/api-football/endpoints";
import { toMatchResults } from "../../src/lib/api-football/transform";
import { TRACKED_LEAGUES } from "../../src/lib/leagues.config";
import type { LeagueAverages } from "../../src/lib/predictions/model";

export { toMatchResults };

// The free API-Football tier only serves 2022-2024. 2023 is the backtest
// season; 2022 exists purely to give early-2023 fixtures enough prior history.
export const BACKTEST_SEASON = 2023;
export const HISTORY_SEASON = 2022;
export const TARGET_PER_LEAGUE = 10; // 5 leagues x 10 = 50 fixtures
export const MIN_MATCHES_REQUIRED = 6;

export type ApiFixture = Awaited<ReturnType<typeof getFixturesBySeason>>[number];

export type BacktestCase = {
  leagueName: string;
  fixture: ApiFixture;
  /** This team's finished matches (2022+2023) strictly before kickoff, chronological ascending. */
  homeHistory: ApiFixture[];
  awayHistory: ApiFixture[];
  /** 2023-only finished matches before kickoff - for a point-in-time standings snapshot. */
  seasonFixturesBeforeKickoff: ApiFixture[];
  league: LeagueAverages;
};

function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function evenlySample<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = items.length / n;
  return Array.from({ length: n }, (_, i) => items[Math.floor(i * step)]);
}

/** Pulls real fixture data (season 2022+2023, all 5 tracked leagues) and samples ~50 backtest candidates. */
export async function gatherBacktestCases(): Promise<BacktestCase[]> {
  const cases: BacktestCase[] = [];

  for (const leagueCfg of TRACKED_LEAGUES) {
    const [season2022, season2023] = await Promise.all([
      getFixturesBySeason(leagueCfg.apiId, HISTORY_SEASON),
      getFixturesBySeason(leagueCfg.apiId, BACKTEST_SEASON),
    ]);

    const finished2023 = season2023.filter((f) => f.fixture.status.short === "FT");
    const allFinished = [...season2022, ...finished2023]
      .filter((f) => f.fixture.status.short === "FT")
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

    const league: LeagueAverages = {
      avgHomeGoals: average(finished2023.map((f) => f.goals.home ?? 0)),
      avgAwayGoals: average(finished2023.map((f) => f.goals.away ?? 0)),
    };

    function priorFixtures(teamApiId: number, beforeIso: string, pool: ApiFixture[]): ApiFixture[] {
      const cutoff = new Date(beforeIso).getTime();
      return pool.filter(
        (f) =>
          new Date(f.fixture.date).getTime() < cutoff &&
          (f.teams.home.id === teamApiId || f.teams.away.id === teamApiId),
      );
    }

    const chronological2023 = [...finished2023].sort(
      (a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime(),
    );
    const eligible = chronological2023.filter(
      (f) =>
        priorFixtures(f.teams.home.id, f.fixture.date, allFinished).length >= MIN_MATCHES_REQUIRED &&
        priorFixtures(f.teams.away.id, f.fixture.date, allFinished).length >= MIN_MATCHES_REQUIRED,
    );
    const sampled = evenlySample(eligible, TARGET_PER_LEAGUE);

    for (const fixture of sampled) {
      const kickoff = new Date(fixture.fixture.date).getTime();
      cases.push({
        leagueName: leagueCfg.name,
        fixture,
        homeHistory: priorFixtures(fixture.teams.home.id, fixture.fixture.date, allFinished),
        awayHistory: priorFixtures(fixture.teams.away.id, fixture.fixture.date, allFinished),
        seasonFixturesBeforeKickoff: chronological2023.filter((f) => new Date(f.fixture.date).getTime() < kickoff),
        league,
      });
    }
  }

  return cases;
}
