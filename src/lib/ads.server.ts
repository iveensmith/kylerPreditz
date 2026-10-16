import { cache } from "react";
import { ADSENSE_CLIENT_ID as ENV_CLIENT_ID } from "@/lib/ads.config";
import { prisma } from "@/lib/db/prisma";

export const ADS_ENABLED_KEY = "adsEnabled";
export const ADS_CLIENT_ID_KEY = "adsenseClientId";

/** Publisher ID as AdSense prints it in the loader snippet: ca-pub-<digits>. */
export const CLIENT_ID_PATTERN = /^ca-pub-\d{10,20}$/;

export type AdsSettings = {
  /** Load the AdSense script on public pages. */
  enabled: boolean;
  /** Effective publisher ID (admin value wins over the env var); null = none configured. */
  clientId: string | null;
  source: "admin" | "env" | "none";
};

/**
 * Admin > Ads settings with the env var as fallback. Never throws: this runs in the root
 * layout's generateMetadata AND the layout component itself, so cache()'d to one DB read per
 * request rather than two - each was its own two-query `Promise.all`, now a single `findMany`,
 * so this cuts 4 round-trips down to 1. Each Prisma call opens its own connection under
 * Workers' `maxUses: 1` (see src/lib/db/prisma.ts), so uncached/split reads here were a real,
 * measurable chunk of per-page latency.
 */
export const getAdsSettings = cache(async (): Promise<AdsSettings> => {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: [ADS_CLIENT_ID_KEY, ADS_ENABLED_KEY] } },
    });
    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    const idRaw = byKey.get(ADS_CLIENT_ID_KEY) ?? null;
    const enabledRaw = byKey.get(ADS_ENABLED_KEY) ?? null;
    const adminId = idRaw && CLIENT_ID_PATTERN.test(idRaw) ? idRaw : null;
    const clientId = adminId ?? ENV_CLIENT_ID;
    return {
      enabled: enabledRaw !== "no",
      clientId,
      source: adminId ? "admin" : ENV_CLIENT_ID ? "env" : "none",
    };
  } catch (e) {
    console.error("[ads] settings read failed, using env", e);
    return { enabled: true, clientId: ENV_CLIENT_ID, source: ENV_CLIENT_ID ? "env" : "none" };
  }
});
