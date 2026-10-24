import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Course thumbnails are served from Convex file storage. A fixed pattern, because .env values
    // aren't reliably loaded yet when the client image config is compiled.
    remotePatterns: [{ protocol: "https", hostname: "*.convex.cloud", pathname: "/api/storage/**" }],
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
