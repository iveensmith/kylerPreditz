import type { Prisma } from "@/generated/prisma/client";
import { PredictionMarket, SettledStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { pageArgs, pageMeta } from "@/lib/pagination";
import { fixtureListInclude } from "./types";
import { dayRangeUtc } from "./homepage";

export type ResultsFilters = { date?: Date; market?: PredictionMarket };

function whereForFilters(filters: ResultsFilters): Prisma.PredictionWhereInput {
  const where: Prisma.PredictionWhereInput = { settledAs: { not: SettledStatus.PENDING } };
  if (filters.date) {
    const { gte, lt } = dayRangeUtc(filters.date);
    where.fixture = { kickoffUtc: { gte, lt } };
  }
  if (filters.market) where.market = filters.market;
  return where;
}

export async function getSettledPredictions(filters: ResultsFilters, page = 1) {
  const where = whereForFilters(filters);
  const [items, total] = await Promise.all([
    prisma.prediction.findMany({
      where,
      orderBy: { fixture: { kickoffUtc: "desc" } },
      ...pageArgs(page),
      include: { fixture: { include: fixtureListInclude } },
    }),
    prisma.prediction.count({ where }),
  ]);
  return { items, meta: pageMeta(total, page) };
}

export async function getSettledCounts(filters: ResultsFilters) {
  const counts = await prisma.prediction.groupBy({
    by: ["settledAs"],
    where: whereForFilters(filters),
    _count: true,
  });
  const byStatus = Object.fromEntries(counts.map((c) => [c.settledAs, c._count])) as Record<SettledStatus, number | undefined>;
  return {
    won: byStatus.WON ?? 0,
    lost: byStatus.LOST ?? 0,
    void: byStatus.VOID ?? 0,
  };
}

export function isValidMarket(value: string): value is PredictionMarket {
  return (Object.values(PredictionMarket) as string[]).includes(value);
}
