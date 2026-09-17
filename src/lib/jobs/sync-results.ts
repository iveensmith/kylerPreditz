import { FixtureStatus, SettledStatus } from "@/generated/prisma/enums";
import { ApiFootballQuotaExceededError } from "@/lib/api-football/client";
import { getFixturesForLiveUpdate } from "@/lib/api-football/endpoints";
import { getCurrentSeason as seasonFor } from "@/lib/api-football/season";
import { mapApiFixtureStatus } from "@/lib/api-football/status";
import { seasonCalendarForApiId } from "@/lib/leagues.config";
import { prisma } from "@/lib/db/prisma";
import { evaluateOutcome, type MatchOutcome } from "@/lib/predictions/model";

const NOT_YET_FINAL: FixtureStatus[] = [FixtureStatus.SCHEDULED, FixtureStatus.LIVE, FixtureStatus.HALFTIME];

// A fixture that never receives a terminal status (bad API status code, a
// season/date mismatch that makes the live-update call miss it, a league
// dropping out of coverage mid-match) would otherwise stay a "candidate"
// forever - re-fetched with its full league/team/prediction rows on every
// 3-minute run indefinitely. This bounds the hot query and hands anything
// older off to abandonStaleFixtures() to settle once and stop tracking.
const MAX_CANDIDATE_AGE_DAYS = 5;

function toVoidOutcome(): MatchOutcome {
  return "VOID";
}

export type TransitionedFixture = {
  fixtureId: string;
  homeTeamName: string;
  awayTeamName: string;
  leagueCountry: string;
  leagueSlug: string;
};

export type SyncResultsResult = {
  fixturesChecked: number;
  fixturesUpdated: number;
  /** Fixtures whose status actually changed value this run (e.g. LIVE -> FINISHED) - lets the caller revalidate just these pages instead of every prediction/league page. */
  transitioned: TransitionedFixture[];
  fixturesTransitioned: number;
  predictionsSettled: number;
  fixturesAbandoned: number;
  errors: string[];
};

/**
 * Fixtures that fell out of the live-tracking window (see MAX_CANDIDATE_AGE_DAYS)
 * without ever reaching a terminal status. Marks them ABANDONED and voids any
 * still-PENDING prediction so they stop being re-fetched by syncResults forever.
 */
async function abandonStaleFixtures(): Promise<{ fixturesAbandoned: number }> {
  const cutoff = new Date(Date.now() - MAX_CANDIDATE_AGE_DAYS * 24 * 60 * 60 * 1000);
  const stale = await prisma.fixture.findMany({
    where: { status: { in: NOT_YET_FINAL }, kickoffUtc: { lt: cutoff } },
    select: { id: true, prediction: { select: { id: true, settledAs: true } } },
  });

  for (const f of stale) {
    await prisma.fixture.update({ where: { id: f.id }, data: { status: FixtureStatus.ABANDONED } });
    if (f.prediction && f.prediction.settledAs === SettledStatus.PENDING) {
      await prisma.prediction.update({ where: { id: f.prediction.id }, data: { settledAs: SettledStatus.VOID } });
    }
  }

  return { fixturesAbandoned: stale.length };
}

/** Refreshes in-progress/recently-kicked-off fixtures and settles any PENDING prediction whose fixture just finished. */
export async function syncResults(): Promise<SyncResultsResult> {
  const result: SyncResultsResult = {
    fixturesChecked: 0,
    fixturesUpdated: 0,
    transitioned: [],
    fixturesTransitioned: 0,
    predictionsSettled: 0,
    fixturesAbandoned: 0,
    errors: [],
  };

  const { fixturesAbandoned } = await abandonStaleFixtures();
  result.fixturesAbandoned = fixturesAbandoned;

  const cutoff = new Date(Date.now() - MAX_CANDIDATE_AGE_DAYS * 24 * 60 * 60 * 1000);
  const candidates = await prisma.fixture.findMany({
    where: { status: { in: NOT_YET_FINAL }, kickoffUtc: { lte: new Date(), gte: cutoff } },
    select: {
      id: true,
      apiId: true,
      kickoffUtc: true,
      status: true,
      league: { select: { apiId: true, country: true, slug: true } },
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      prediction: { select: { id: true, market: true, selection: true, settledAs: true } },
    },
  });
  result.fixturesChecked = candidates.length;
  if (candidates.length === 0) return result;

  // Group by (league apiId, season, date) - one API call per group.
  const groups = new Map<string, { leagueApiId: number; season: number; date: string; fixtureIds: Set<number> }>();
  for (const f of candidates) {
    const date = f.kickoffUtc.toISOString().slice(0, 10);
    const season = seasonFor(f.kickoffUtc, seasonCalendarForApiId(f.league.apiId));
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
        if (newStatus !== existing.status) {
          result.fixturesTransitioned++;
          result.transitioned.push({
            fixtureId: existing.id,
            homeTeamName: existing.homeTeam.name,
            awayTeamName: existing.awayTeam.name,
            leagueCountry: existing.league.country,
            leagueSlug: existing.league.slug,
          });
        }

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
