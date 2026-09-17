import { ADSENSE_CLIENT_ID } from "@/lib/ads.config";

/** Google requires ads.txt to list the publisher ID verbatim - see https://support.google.com/adsense/answer/7532444 */
export function GET() {
  if (!ADSENSE_CLIENT_ID) {
    return new Response("", { status: 404 });
  }
  const body = `google.com, ${ADSENSE_CLIENT_ID}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
