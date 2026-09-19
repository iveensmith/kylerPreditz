import { getAdsSettings } from "@/lib/ads.server";

// Rebuilt at most every 5 minutes so a publisher ID edited in Admin > Ads shows up without a redeploy.
export const revalidate = 300;

/** Google requires ads.txt to list the publisher ID verbatim - see https://support.google.com/adsense/answer/7532444 */
export async function GET() {
  const { clientId } = await getAdsSettings();
  if (!clientId) {
    return new Response("", { status: 404 });
  }
  const body = `google.com, ${clientId.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
