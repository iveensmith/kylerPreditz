import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
