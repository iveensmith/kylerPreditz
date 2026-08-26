import { SettledStatus } from "@/generated/prisma/enums";
import { DAILY_QUOTA } from "@/lib/api-football/client";
import { prisma } from "@/lib/db/prisma";
import { dayRangeUtc } from "./homepage";
import { fixtureListInclude } from "./types";

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function hitRate(rows: { settledAs: SettledStatus; _count: number }[]): number | null {
  const won = rows.find((r) => r.settledAs === SettledStatus.WON)?._count ?? 0;
  const lost = rows.find((r) => r.settledAs === SettledStatus.LOST)?._count ?? 0;
  const total = won + lost;
  return total > 0 ? Math.round((won / total) * 100) : null;
}

export async function getDashboardStats() {
  const today = dayRangeUtc(new Date());
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const settledOnly = { in: [SettledStatus.WON, SettledStatus.LOST] };

  const [todayTipCount, weekSettled, monthSettled, quota] = await Promise.all([
    prisma.prediction.count({ where: { fixture: { kickoffUtc: { gte: today.gte, lt: today.lt } } } }),
    prisma.prediction.groupBy({
      by: ["settledAs"],
      where: { fixture: { kickoffUtc: { gte: weekAgo } }, settledAs: settledOnly },
      _count: true,
    }),
    prisma.prediction.groupBy({
      by: ["settledAs"],
      where: { fixture: { kickoffUtc: { gte: monthAgo } }, settledAs: settledOnly },
      _count: true,
    }),
    prisma.apiQuotaUsage.findUnique({ where: { date: toDateParam(new Date()) } }),
  ]);

  return {
    todayTipCount,
    weekHitRate: hitRate(weekSettled),
    monthHitRate: hitRate(monthSettled),
    quotaUsed: quota?.count ?? 0,
    quotaLimit: DAILY_QUOTA,
  };
}

export async function getAllPredictionsForAdmin(limit = 100) {
  return prisma.prediction.findMany({
    orderBy: { fixture: { kickoffUtc: "desc" } },
    take: limit,
    include: { fixture: { include: fixtureListInclude } },
  });
}

export async function getPredictionForAdmin(id: string) {
  return prisma.prediction.findUnique({
    where: { id },
    include: { fixture: { include: fixtureListInclude } },
  });
}

/** Fixtures the engine skipped (no prediction) - candidates for a manual tip. */
export async function getSkippedFixtures() {
  return prisma.fixture.findMany({
    where: { prediction: null, kickoffUtc: { gte: new Date() } },
    orderBy: { kickoffUtc: "asc" },
    include: { homeTeam: true, awayTeam: true, league: true },
  });
}

export async function getFixtureForAdmin(id: string) {
  return prisma.fixture.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true, league: true },
  });
}
