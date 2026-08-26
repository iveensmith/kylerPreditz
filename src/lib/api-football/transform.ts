import type { MatchResult } from "@/lib/predictions/model";
import type { ApiFixture } from "./types";

/** Maps a team's raw API-Football fixtures into the pure model's MatchResult shape. */
export function toMatchResults(teamApiId: number, fixtures: ApiFixture[]): MatchResult[] {
  return fixtures.map((f) =>
    f.teams.home.id === teamApiId
      ? { date: f.fixture.date, venue: "home" as const, goalsFor: f.goals.home ?? 0, goalsAgainst: f.goals.away ?? 0 }
      : { date: f.fixture.date, venue: "away" as const, goalsFor: f.goals.away ?? 0, goalsAgainst: f.goals.home ?? 0 },
  );
}
