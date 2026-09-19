"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { setSetting } from "@/lib/site-settings";
import { ADS_CLIENT_ID_KEY, ADS_ENABLED_KEY, CLIENT_ID_PATTERN } from "@/lib/ads.server";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/actions/result";

/**
 * Saves Admin > Ads. A blank publisher ID clears the admin override (the
 * NEXT_PUBLIC_ADSENSE_CLIENT_ID env var, if any, applies again).
 */
export async function saveAdsSettings(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    const enabled = formData.get("enabled") === "on";
    const clientId = String(formData.get("clientId") ?? "").trim();
    if (clientId && !CLIENT_ID_PATTERN.test(clientId)) {
      throw new UserFacingError('Publisher ID must look like "ca-pub-1234567890123456" (copy it from your AdSense script snippet).');
    }
    await setSetting(ADS_ENABLED_KEY, enabled ? "yes" : "no");
    await setSetting(ADS_CLIENT_ID_KEY, clientId || null);
    revalidatePath("/", "layout");
    revalidatePath("/ads.txt");
    revalidatePath("/admin/ads");
    return { ok: enabled ? "Saved. AdSense is on for public pages." : "Saved. The AdSense script is switched off." };
  } catch (e) {
    return toActionError(e);
  }
}
