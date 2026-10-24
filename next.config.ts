import type { NextConfig } from "next";

// Course thumbnails are served from Convex file storage.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: convexUrl ? [new URL("/api/storage/**", convexUrl)] : [],
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
