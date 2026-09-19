import { ADSENSE_CLIENT_ID as ENV_CLIENT_ID } from "@/lib/ads.config";
import { getSetting } from "@/lib/site-settings";

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
 * layout, so a database hiccup must degrade to the env-configured behaviour, not break every page.
 */
export async function getAdsSettings(): Promise<AdsSettings> {
  try {
    const [idRaw, enabledRaw] = await Promise.all([getSetting(ADS_CLIENT_ID_KEY), getSetting(ADS_ENABLED_KEY)]);
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
}
