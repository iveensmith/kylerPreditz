import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "@/lib/db/prisma";
import { getCurrentSeason } from "@/lib/api-football/season";
import { seasonCalendarForApiId } from "@/lib/leagues.config";

/**
 * Compares what's in our DB against a live, un-cached API-Football call, so you
 * can see whether standings + top scorers are current.
 *
 *   npx tsx scripts/check-stats-freshness.ts                # Premier League
 *   npx tsx scripts/check-stats-freshness.ts la-liga        # by league slug
 *   npx tsx scripts/check-stats-freshness.ts 140            # by API-Football id
 *
 * This calls the API directly (not through our cached client) - it does not
 * touch the daily quota guard, but it is a real request, so don't loop it.
 */
const BASE = "https://v3.football.api-sports.io";

async function live(path: string, params: Record<string, string | number>) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY ?? "" },
  });
  const body = (await res.json()) as { response?: unknown[]; errors?: unknown };
  return body;
}

function pad(s: string, n: number) {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

async function main() {
  const arg = process.argv[2] ?? "premier-league";
  const league = await prisma.league.findFirst({
    where: /^\d+$/.test(arg) ? { apiId: Number(arg) } : { slug: arg },
  });
  if (!league) {
    console.error(`No tracked league matches "${arg}" (try a slug like premier-league, or an API id like 39)`);
    process.exit(1);
  }

  const season = getCurrentSeason(new Date(), seasonCalendarForApiId(league.apiId));
  console.log(`\n${league.name} — season ${season}\n${"=".repeat(48)}`);

  // ---- Top scorers -------------------------------------------------------
  const dbScorers = await prisma.topScorer.findMany({
    where: { leagueId: league.id, season },
    orderBy: [{ goals: "desc" }, { playerName: "asc" }],
    include: { team: { select: { name: true } } },
  });
  const scRes = await live("/players/topscorers", { league: league.apiId, season });
  const apiScorers = ((scRes.response ?? []) as Array<{ player: { name: string }; statistics: Array<{ goals: { total: number | null } }> }>)
    .map((e) => ({ name: e.player.name, goals: e.statistics[0]?.goals.total ?? 0 }));

  console.log("\nTOP SCORERS            our DB          live API");
  console.log("-".repeat(48));
  const maxRows = Math.max(dbScorers.length, apiScorers.length, 10);
  for (let i = 0; i < Math.min(maxRows, 12); i++) {
    const d = dbScorers[i];
    const a = apiScorers[i];
    console.log(
      `${pad(String(i + 1) + ".", 4)} ${pad(d ? `${d.goals}  ${d.playerName}` : "-", 22)}  ${a ? `${a.goals}  ${a.name}` : "-"}`,
    );
  }
  const dbNames = new Set(dbScorers.map((s) => s.playerName));
  const apiNames = new Set(apiScorers.map((s) => s.name));
  const missing = [...apiNames].filter((n) => !dbNames.has(n));
  const extra = [...dbNames].filter((n) => !apiNames.has(n));
  console.log(`\n  rows: DB ${dbScorers.length}, API ${apiScorers.length}`);
  console.log(`  in API but not our DB: ${missing.length ? missing.join(", ") : "none"}`);
  console.log(`  in our DB but not API: ${extra.length ? extra.join(", ") : "none"}`);
  const goalMismatch = dbScorers
    .map((d) => {
      const a = apiScorers.find((x) => x.name === d.playerName);
      return a && a.goals !== d.goals ? `${d.playerName} (DB ${d.goals} / API ${a.goals})` : null;
    })
    .filter(Boolean);
  console.log(`  goal-count mismatches: ${goalMismatch.length ? goalMismatch.join(", ") : "none"}`);

  // ---- Standings --------------------------------------------------------
  const dbStandings = await prisma.standing.findMany({
    where: { leagueId: league.id, season },
    orderBy: { rank: "asc" },
    include: { team: { select: { name: true } } },
  });
  const stRes = await live("/standings", { league: league.apiId, season });
  const apiStandings = (
    ((stRes.response ?? [])[0] as { league?: { standings?: Array<Array<{ rank: number; team: { name: string }; points: number }>> } })
      ?.league?.standings ?? []
  ).flat();

  console.log("\nSTANDINGS (top 6)     our DB                 live API");
  console.log("-".repeat(48));
  for (let i = 0; i < 6; i++) {
    const d = dbStandings[i];
    const a = apiStandings[i];
    console.log(
      `${pad(String(i + 1) + ".", 4)} ${pad(d ? `${d.team.name} (${d.points}pts)` : "-", 22)} ${a ? `${a.team.name} (${a.points}pts)` : "-"}`,
    );
  }
  console.log(`\n  rows: DB ${dbStandings.length}, API ${apiStandings.length}`);
  const verdict =
    missing.length === 0 && extra.length === 0 && goalMismatch.length === 0
      ? "✓ top scorers match the live API"
      : "✗ top scorers differ from the live API — run: npm run sync:stats";
  console.log(`\n${verdict}\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
