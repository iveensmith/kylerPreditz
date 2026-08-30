import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@/generated/prisma/client";
import { PredictionMarket, PremiumMode, SettledStatus, SubscriptionStatus } from "@/generated/prisma/enums";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { LeagueWithFixtures } from "@/lib/queries/types";

export const PREMIUM_CONFIDENCE_FLOOR = Number(process.env.PREMIUM_CONFIDENCE_FLOOR ?? 92);

type PremiumFields = { premium: PremiumMode; confidence: number };

/** Is this pick premium? AUTO defers to the confidence threshold; ALWAYS / NEVER are admin overrides. */
export function isPremiumPick(pick: PremiumFields): boolean {
  if (pick.premium === PremiumMode.NEVER) return false;
  if (pick.premium === PremiumMode.ALWAYS) return true;
  return pick.confidence >= PREMIUM_CONFIDENCE_FLOOR;
}

/**
 * A premium pick is hidden from non-members only while it still has value - i.e.
 * before kickoff. Settled premium picks stay fully visible everywhere (results
 * archive, recent winners): they prove the tier's record, they don't give an edge.
 */
export function shouldLockPick(pick: PremiumFields & { settledAs: SettledStatus }): boolean {
  return pick.settledAs === SettledStatus.PENDING && isPremiumPick(pick);
}

type LockablePick = PremiumFields & {
  settledAs: SettledStatus;
  odds: Prisma.Decimal;
  market: PredictionMarket;
  selection: string;
  reasoning: string;
  baseMarket: PredictionMarket | null;
  baseSelection: string | null;
  baseConfidence: number | null;
  allMarkets: Prisma.JsonValue | null;
  expectedGoalsHome: number | null;
  expectedGoalsAway: number | null;
  adjustmentReason: string | null;
};

/**
 * Blanks every sensitive field of a locked pick and tags it `locked: true`, so
 * the real values never reach the HTML. Members' browsers pull them back from
 * /api/premium/reveal, which keeps the pages that render picks fully static.
 * No-op for free picks and for settled picks.
 */
export function redactPickForFreeView<T extends LockablePick>(pick: T): T & { locked?: boolean };
export function redactPickForFreeView<T extends LockablePick>(pick: T | null): (T & { locked?: boolean }) | null;
export function redactPickForFreeView<T extends LockablePick>(pick: T | null) {
  if (!pick || !shouldLockPick(pick)) return pick;
  return {
    ...pick,
    market: PredictionMarket.HOME_WIN,
    selection: "",
    reasoning: "",
    odds: new Prisma.Decimal(0),
    confidence: 0,
    baseMarket: null,
    baseSelection: null,
    baseConfidence: null,
    allMarkets: null,
    expectedGoalsHome: null,
    expectedGoalsAway: null,
    adjustmentReason: null,
    locked: true,
  };
}

/** Redacts every locked pick in a league→fixtures list. */
export function redactFixtureListForFreeView(leagues: LeagueWithFixtures[]): LeagueWithFixtures[] {
  return leagues.map((league) => ({
    ...league,
    fixtures: league.fixtures.map((fixture) => ({
      ...fixture,
      prediction: fixture.prediction ? redactPickForFreeView(fixture.prediction) : null,
    })),
  }));
}

/** The viewer's premium status - an active subscription that hasn't expired. Cached per request. */
export const getViewerPremium = cache(async (): Promise<{ isPremium: boolean; expiresAt: Date | null }> => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { isPremium: false, expiresAt: null };

  const sub = await prisma.subscription.findFirst({
    where: { userId, status: SubscriptionStatus.ACTIVE, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
    select: { expiresAt: true },
  });
  return { isPremium: Boolean(sub), expiresAt: sub?.expiresAt ?? null };
});

export type RevealedPick = {
  market: string;
  selection: string;
  odds: string;
  confidence: number;
  settledAs: SettledStatus;
};

/**
 * The real values for every currently-locked pick, keyed by fixture id - served
 * by /api/premium/reveal to members' browsers. Empty for non-members.
 */
export async function getRevealablePicks(): Promise<Record<string, RevealedPick>> {
  const { isPremium } = await getViewerPremium();
  if (!isPremium) return {};

  const soon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const picks = await prisma.prediction.findMany({
    where: { settledAs: SettledStatus.PENDING, fixture: { kickoffUtc: { lt: soon } } },
    select: { fixtureId: true, market: true, selection: true, odds: true, confidence: true, settledAs: true, premium: true },
  });

  const out: Record<string, RevealedPick> = {};
  for (const p of picks) {
    if (!isPremiumPick(p)) continue;
    out[p.fixtureId] = {
      market: p.market,
      selection: p.selection,
      odds: p.odds.toString(),
      confidence: p.confidence,
      settledAs: p.settledAs,
    };
  }
  return out;
}
