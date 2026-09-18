/**
 * Google AdSense publisher ID, exactly as given in the AdSense dashboard's
 * script snippet, e.g. "ca-pub-1234567890123456". Unset until the site is
 * approved - every consumer (root layout script, /ads.txt) checks this and
 * renders nothing rather than a broken tag with a placeholder ID.
 */
const raw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || null;

export const ADSENSE_CLIENT_ID = raw;

/**
 * Bare publisher ID for ads.txt, e.g. "pub-1234567890123456" - ads.txt never
 * uses the "ca-" prefix that the loader script's `client` param needs.
 */
export const ADSENSE_PUBLISHER_ID = raw ? raw.replace(/^ca-/, "") : null;
