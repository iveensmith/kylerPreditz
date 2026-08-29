/**
 * Build-time guard: on a deployed (Vercel) build, fail fast if
 * NEXT_PUBLIC_SITE_URL is missing or still points at localhost. It drives every
 * canonical URL, OpenGraph tag, and sitemap entry - a localhost value silently
 * tells Google to ignore the real site.
 *
 * Local `npm run build` is unaffected (localhost is expected there).
 */
const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
if (!onVercel) process.exit(0);

const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const problems: string[] = [];

if (!url) {
  problems.push("it is not set");
} else {
  if (!/^https:\/\//i.test(url)) problems.push(`it must start with https:// (got "${url}")`);
  if (/\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(url)) problems.push(`it points at a local address (got "${url}")`);
  try {
    new URL(url);
  } catch {
    problems.push(`it is not a valid URL (got "${url}")`);
  }
}

if (problems.length > 0) {
  console.error("\n✖ Build blocked - NEXT_PUBLIC_SITE_URL is misconfigured for a deployed build:");
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    "\n  Set it in Vercel → Settings → Environment Variables to the real origin,\n" +
      "  e.g. https://unique-preditz.vercel.app (no trailing slash). It drives every\n" +
      "  canonical URL, OpenGraph tag, and sitemap entry.\n",
  );
  process.exit(1);
}

if (url!.endsWith("/")) {
  console.warn(`⚠ NEXT_PUBLIC_SITE_URL has a trailing slash ("${url}") - prefer it without one.`);
}

const authUrl = process.env.NEXTAUTH_URL?.trim();
if (authUrl && /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(authUrl)) {
  console.warn(`⚠ NEXTAUTH_URL still points at localhost ("${authUrl}") - sign-in redirects will break in production.`);
}

console.log(`✓ NEXT_PUBLIC_SITE_URL = ${url}`);
