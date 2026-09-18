import { ADSENSE_PUBLISHER_ID } from "@/lib/ads.config";

/** Google requires ads.txt to list the publisher ID verbatim - see https://support.google.com/adsense/answer/7532444 */
export function GET() {
  if (!ADSENSE_PUBLISHER_ID) {
    return new Response("", { status: 404 });
  }
  const body = `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
