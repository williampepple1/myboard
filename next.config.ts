import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error - turbopack root is valid for Next.js 16 but not currently in types
    turbopack: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
