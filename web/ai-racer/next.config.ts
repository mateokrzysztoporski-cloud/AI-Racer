import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false, // don't create AGENTS.md for AI tools
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
