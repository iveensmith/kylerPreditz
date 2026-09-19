import { Prisma } from "@/generated/prisma/client";
import { SettledStatus, SubscriptionStatus } from "@/generated/prisma/enums";
import { DAILY_QUOTA } from "@/lib/api-football/client";
import { prisma } from "@/lib/db/prisma";
import { pageArgs, pageMeta } from "@/lib/pagination";
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

  const now = new Date();
  const activeSub = { status: SubscriptionStatus.ACTIVE, expiresAt: { gt: now } };

  const [
    todayTipCount, weekSettled, monthSettled, quota,
    totalTips, premiumTips, publishedPosts, draftPosts, members,
    activeSubscribers, everSubscribed, lastFixtureSync, lastPrediction,
  ] = await Promise.all([
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
    prisma.prediction.count(),
    prisma.prediction.count({ where: { premium: "ALWAYS" } }),
    prisma.post.count({ where: { publishedAt: { not: null } } }),
    prisma.post.count({ where: { publishedAt: null } }),
    prisma.user.count(),
    prisma.subscription.findMany({ where: activeSub, distinct: ["userId"], select: { userId: true } }),
    prisma.subscription.findMany({ distinct: ["userId"], select: { userId: true } }),
    prisma.fixture.aggregate({ _max: { updatedAt: true } }),
    prisma.prediction.aggregate({ _max: { generatedAt: true } }),
  ]);

  return {
    todayTipCount,
    weekHitRate: hitRate(weekSettled),
    monthHitRate: hitRate(monthSettled),
    quotaUsed: quota?.count ?? 0,
    quotaLimit: DAILY_QUOTA,
    totalTips,
    premiumTips,
    publishedPosts,
    draftPosts,
    members,
    activeSubscribers: activeSubscribers.length,
    expiredSubscribers: everSubscribed.length - activeSubscribers.length,
    lastFixtureSync: lastFixtureSync._max.updatedAt,
    lastPredictionRun: lastPrediction._max.generatedAt,
  };
}

/** Registered users with their latest subscription, optional email search - the admin members list. */
export async function getMembersForAdmin(page = 1, q = "") {
  const where: Prisma.UserWhereInput = q ? { email: { contains: q, mode: "insensitive" } } : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...pageArgs(page),
      include: { subscriptions: { orderBy: { expiresAt: "desc" }, take: 1 } },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, meta: pageMeta(total, page) };
}

export async function getAllPredictionsForAdmin(page = 1) {
  const [items, total] = await Promise.all([
    prisma.prediction.findMany({
      orderBy: { fixture: { kickoffUtc: "desc" } },
      ...pageArgs(page),
      include: { fixture: { include: fixtureListInclude } },
    }),
    prisma.prediction.count(),
  ]);
  return { items, meta: pageMeta(total, page) };
}

export async function getPredictionForAdmin(id: string) {
  return prisma.prediction.findUnique({
    where: { id },
    include: { fixture: { include: fixtureListInclude } },
  });
}

/**
 * Fixtures the engine skipped (no prediction) - candidates for a manual tip.
 * Rendered as a <select>, so this is capped rather than paginated (you can't
 * pick an option that's on another page); soonest kickoff first, which is the
 * only end of this list an admin acts on.
 */
export async function getSkippedFixtures(limit = 200) {
  return prisma.fixture.findMany({
    where: { prediction: null, kickoffUtc: { gte: new Date() } },
    orderBy: { kickoffUtc: "asc" },
    take: limit,
    include: { homeTeam: true, awayTeam: true, league: true },
  });
}

export async function getFixtureForAdmin(id: string) {
  return prisma.fixture.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true, league: true },
  });
}

/** All subscriptions, newest first, with the owning user - the admin subscribers list. */
export async function getSubscribersForAdmin(page = 1) {
  const [items, total] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      ...pageArgs(page),
      include: { user: true },
    }),
    prisma.subscription.count(),
  ]);
  return { items, meta: pageMeta(total, page) };
}
