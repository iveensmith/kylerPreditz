import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Long articles (or pasted HTML) can exceed the 1MB default and fail the whole submit.
    serverActions: { bodySizeLimit: "4mb" },
    // League/prediction pages each run a nested-include query (several
    // queries wrapped in one transaction) during static generation. At the
    // default concurrency (several workers x many pages in flight at once)
    // this was contending hard enough for Neon connections to blow past even
    // a 45s transaction timeout (P2028). Capping concurrency keeps the
    // simultaneous-transaction count low enough to actually complete, and
    // the retry count gives a one-off slow page (cold-start, a blip) a
    // second chance instead of failing the whole build over it.
    staticGenerationMaxConcurrency: 2,
    staticGenerationRetryCount: 2,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "media.api-sports.io" }],
    // Every remote image we render is a tiny (14-40px) team crest, league badge
    // or player headshot from api-sports' Cloudflare-backed CDN - there's nothing
    // for the optimizer to gain, and routing them through it burns the Vercel
    // Hobby image-optimization quota, after which they 402 and render broken.
    unoptimized: true,
  },
};

export default nextConfig;
