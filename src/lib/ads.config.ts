/**
 * Google AdSense publisher ID, e.g. "pub-1234567890123456". Unset until the
 * site is approved - every consumer (root layout script, /ads.txt) checks
 * this and renders nothing rather than a broken tag with a placeholder ID.
 */
export const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || null;
