import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "@/lib/db/prisma";
import { getStandings, getTopScorers } from "@/lib/api-football/endpoints";
import { getCurrentSeason } from "@/lib/api-football/season";
import { seasonCalendarForApiId } from "@/lib/leagues.config";

/**
 * One-off / maintenance: removes Standing and TopScorer rows that API-Football
 * no longer returns for the current season. syncStats now does this per league
 * on every run, but it is time-boxed and takes ~a day to cycle all 32 leagues -
 * this sweeps every league in one pass (2 API calls each, no per-team stats).
 *
 *   npx tsx scripts/prune-stale-stats.ts
 */
async function main() {
  const leagues = await prisma.league.findMany({
    where: { isFeatured: true },
    orderBy: { priority: "asc" },
  });

  const teams = await prisma.team.findMany({ select: { id: true, apiId: true } });
  const teamIdByApiId = new Map(teams.map((t) => [t.apiId, t.id]));

  let standingsPruned = 0;
  let scorersPruned = 0;

  for (const league of leagues) {
    const season = getCurrentSeason(new Date(), seasonCalendarForApiId(league.apiId));
    try {
      const standings = await getStandings(league.apiId, season);
      const seenStandingTeamIds = standings
        .map((r) => teamIdByApiId.get(r.team.id))
        .filter((id): id is string => Boolean(id));
      if (seenStandingTeamIds.length > 0) {
        const res = await prisma.standing.deleteMany({
          where: { leagueId: league.id, season, teamId: { notIn: seenStandingTeamIds } },
        });
        standingsPruned += res.count;
      }

      const topScorers = await getTopScorers(league.apiId, season);
      const seenKeys = topScorers
        .map((e) => {
          const stat = e.statistics[0];
          const teamId = stat && teamIdByApiId.get(stat.team.id);
          return teamId ? { teamId, playerName: e.player.name } : null;
        })
        .filter((k): k is { teamId: string; playerName: string } => Boolean(k));
      if (seenKeys.length > 0) {
        const current = await prisma.topScorer.findMany({
          where: { leagueId: league.id, season },
          select: { id: true, teamId: true, playerName: true },
        });
        const keep = new Set(seenKeys.map((k) => `${k.teamId}::${k.playerName}`));
        const staleIds = current
          .filter((row) => !keep.has(`${row.teamId}::${row.playerName}`))
          .map((row) => row.id);
        if (staleIds.length > 0) {
          const res = await prisma.topScorer.deleteMany({ where: { id: { in: staleIds } } });
          scorersPruned += res.count;
        }
      }

      console.log(`${league.name}: ok (standings ${standings.length}, scorers ${topScorers.length})`);
    } catch (err) {
      console.warn(`${league.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\nPruned ${standingsPruned} standing rows, ${scorersPruned} top-scorer rows.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
