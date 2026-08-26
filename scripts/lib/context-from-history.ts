import type { TeamContextStats, H2hEntry } from "../../src/lib/predictions/ai";
import type { ApiFixture } from "./historical-data";

function outcome(teamApiId: number, f: ApiFixture): "W" | "D" | "L" {
  const isHome = f.teams.home.id === teamApiId;
  const gf = isHome ? f.goals.home ?? 0 : f.goals.away ?? 0;
  const ga = isHome ? f.goals.away ?? 0 : f.goals.home ?? 0;
  if (gf > ga) return "W";
  if (gf < ga) return "L";
  return "D";
}

function average(nums: number[]): number {
  return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : 0;
}

/** Builds the packet's per-team stats block from that team's chronological (ascending) prior-match history. */
export function buildTeamContextStats(teamApiId: number, history: ApiFixture[], kickoffIso: string): TeamContextStats {
  const recent = history.slice(-10); // last up-to-10 matches for averages/clean sheets
  const last5 = history.slice(-5);
  const last6 = history.slice(-6);

  const homeMatches = recent.filter((f) => f.teams.home.id === teamApiId);
  const awayMatches = recent.filter((f) => f.teams.away.id === teamApiId);

  const goalsFor = recent.map((f) => (f.teams.home.id === teamApiId ? f.goals.home ?? 0 : f.goals.away ?? 0));
  const goalsAgainst = recent.map((f) => (f.teams.home.id === teamApiId ? f.goals.away ?? 0 : f.goals.home ?? 0));
  const cleanSheets = recent.filter((f) => (f.teams.home.id === teamApiId ? f.goals.away ?? 0 : f.goals.home ?? 0) === 0).length;

  const lastMatch = history[history.length - 1];
  const restDays = lastMatch
    ? Math.round((new Date(kickoffIso).getTime() - new Date(lastMatch.fixture.date).getTime()) / 86_400_000)
    : null;

  return {
    form: last5.map((f) => outcome(teamApiId, f)).join(""),
    last6Results: last6.map((f) => {
      const isHome = f.teams.home.id === teamApiId;
      return {
        date: f.fixture.date.slice(0, 10),
        opponent: isHome ? f.teams.away.name : f.teams.home.name,
        score: `${f.goals.home}-${f.goals.away}`,
        venue: isHome ? ("home" as const) : ("away" as const),
      };
    }),
    goalsForAvg: average(goalsFor),
    goalsAgainstAvg: average(goalsAgainst),
    homeGoalsForAvg: homeMatches.length ? average(homeMatches.map((f) => f.goals.home ?? 0)) : undefined,
    awayGoalsForAvg: awayMatches.length ? average(awayMatches.map((f) => f.goals.away ?? 0)) : undefined,
    cleanSheets,
    leaguePosition: null, // filled in by computeLeaguePosition when season-to-date fixtures are available
    restDays,
  };
}

/** Live table computed from season-to-date results, so a mid-season historical snapshot is honest. */
export function computeLeaguePosition(teamApiId: number, seasonFixturesBeforeKickoff: ApiFixture[]): number | null {
  if (seasonFixturesBeforeKickoff.length === 0) return null;

  const points = new Map<number, number>();
  const goalDiff = new Map<number, number>();
  const bump = (map: Map<number, number>, id: number, by: number) => map.set(id, (map.get(id) ?? 0) + by);

  for (const f of seasonFixturesBeforeKickoff) {
    const hg = f.goals.home ?? 0;
    const ag = f.goals.away ?? 0;
    bump(goalDiff, f.teams.home.id, hg - ag);
    bump(goalDiff, f.teams.away.id, ag - hg);
    if (hg > ag) bump(points, f.teams.home.id, 3);
    else if (ag > hg) bump(points, f.teams.away.id, 3);
    else {
      bump(points, f.teams.home.id, 1);
      bump(points, f.teams.away.id, 1);
    }
    if (!points.has(f.teams.home.id)) points.set(f.teams.home.id, points.get(f.teams.home.id) ?? 0);
    if (!points.has(f.teams.away.id)) points.set(f.teams.away.id, points.get(f.teams.away.id) ?? 0);
  }

  if (!points.has(teamApiId)) return null;

  const table = [...points.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return (goalDiff.get(b[0]) ?? 0) - (goalDiff.get(a[0]) ?? 0);
  });
  const rank = table.findIndex(([id]) => id === teamApiId);
  return rank === -1 ? null : rank + 1;
}

/** Past meetings between these two teams, drawn from the home team's own match history. */
export function buildH2h(currentHomeApiId: number, currentAwayApiId: number, homeTeamHistory: ApiFixture[]): H2hEntry[] {
  return homeTeamHistory
    .filter(
      (f) =>
        (f.teams.home.id === currentHomeApiId && f.teams.away.id === currentAwayApiId) ||
        (f.teams.home.id === currentAwayApiId && f.teams.away.id === currentHomeApiId),
    )
    .map((f) => ({
      date: f.fixture.date.slice(0, 10),
      score: `${f.goals.home}-${f.goals.away}`,
      venue: f.teams.home.id === currentHomeApiId ? ("home" as const) : ("away" as const),
    }));
}
