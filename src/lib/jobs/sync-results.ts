import { FixtureStatus, SettledStatus } from "@/generated/prisma/enums";
import { ApiFootballQuotaExceededError } from "@/lib/api-football/client";
import { getFixturesForLiveUpdate } from "@/lib/api-football/endpoints";
import { getCurrentSeason as seasonFor } from "@/lib/api-football/season";
import { mapApiFixtureStatus } from "@/lib/api-football/status";
import { prisma } from "@/lib/db/prisma";
import { evaluateOutcome, type MatchOutcome } from "@/lib/predictions/model";

const NOT_YET_FINAL: FixtureStatus[] = [FixtureStatus.SCHEDULED, FixtureStatus.LIVE, FixtureStatus.HALFTIME];

function toVoidOutcome(): MatchOutcome {
  return "VOID";
}

export type SyncResultsResult = {
  fixturesChecked: number;
  fixturesUpdated: number;
  predictionsSettled: number;
  errors: string[];
};

/** Refreshes in-progress/recently-kicked-off fixtures and settles any PENDING prediction whose fixture just finished. */
export async function syncResults(): Promise<SyncResultsResult> {
  const result: SyncResultsResult = { fixturesChecked: 0, fixturesUpdated: 0, predictionsSettled: 0, errors: [] };

  const candidates = await prisma.fixture.findMany({
    where: { status: { in: NOT_YET_FINAL }, kickoffUtc: { lte: new Date() } },
    include: { league: true, prediction: true },
  });
  result.fixturesChecked = candidates.length;
  if (candidates.length === 0) return result;

  // Group by (league apiId, season, date) - one API call per group.
  const groups = new Map<string, { leagueApiId: number; season: number; date: string; fixtureIds: Set<number> }>();
  for (const f of candidates) {
    const date = f.kickoffUtc.toISOString().slice(0, 10);
    const season = seasonFor(f.kickoffUtc);
    const key = `${f.league.apiId}|${season}|${date}`;
    if (!groups.has(key)) groups.set(key, { leagueApiId: f.league.apiId, season, date, fixtureIds: new Set() });
    groups.get(key)!.fixtureIds.add(f.apiId);
  }

  const byApiId = new Map(candidates.map((f) => [f.apiId, f]));

  for (const group of groups.values()) {
    try {
      const apiFixtures = await getFixturesForLiveUpdate(group.leagueApiId, group.season, group.date);
      for (const apiFixture of apiFixtures) {
        const existing = byApiId.get(apiFixture.fixture.id);
        if (!existing) continue;

        const newStatus = mapApiFixtureStatus(apiFixture.fixture.status.short);
        await prisma.fixture.update({
          where: { id: existing.id },
          data: {
            status: newStatus,
            homeScore: apiFixture.goals.home,
            awayScore: apiFixture.goals.away,
            htHomeScore: apiFixture.score.halftime.home,
            htAwayScore: apiFixture.score.halftime.away,
            elapsedMinutes: apiFixture.fixture.status.elapsed,
          },
        });
        result.fixturesUpdated++;

        const prediction = existing.prediction;
        if (!prediction || prediction.settledAs !== SettledStatus.PENDING) continue;

        let outcome: MatchOutcome | null = null;
        if (newStatus === FixtureStatus.FINISHED && apiFixture.goals.home !== null && apiFixture.goals.away !== null) {
          outcome = evaluateOutcome(prediction.market, prediction.selection, {
            homeGoals: apiFixture.goals.home,
            awayGoals: apiFixture.goals.away,
            htHomeGoals: apiFixture.score.halftime.home ?? undefined,
            htAwayGoals: apiFixture.score.halftime.away ?? undefined,
          });
        } else if (newStatus === FixtureStatus.CANCELLED || newStatus === FixtureStatus.ABANDONED) {
          outcome = toVoidOutcome();
        }

        if (outcome) {
          await prisma.prediction.update({ where: { id: prediction.id }, data: { settledAs: outcome } });
          result.predictionsSettled++;
        }
      }
    } catch (err) {
      if (err instanceof ApiFootballQuotaExceededError) {
        result.errors.push("quota exhausted mid-sync, stopping this run");
        break;
      }
      result.errors.push(`league ${group.leagueApiId} ${group.date}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
