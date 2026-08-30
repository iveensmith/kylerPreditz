import { SettledStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { isPremiumPick } from "@/lib/premium";
import { fixtureListInclude } from "./types";

/**
 * Every currently-live premium pick (premium + pending, kickoff still ahead),
 * most confident first, with full fixture detail. This is the ONLY place a
 * pending premium pick is served in the clear - the subscriber-only /premium
 * page. The gate lives on the page, not here.
 */
export async function getPremiumPicks() {
  const picks = await prisma.prediction.findMany({
    where: {
      settledAs: SettledStatus.PENDING,
      fixture: { kickoffUtc: { gte: new Date() } },
    },
    orderBy: { confidence: "desc" },
    include: { fixture: { include: fixtureListInclude } },
  });
  return picks.filter((p) => isPremiumPick(p));
}

export type PremiumPick = Awaited<ReturnType<typeof getPremiumPicks>>[number];
