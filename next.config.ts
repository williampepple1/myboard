import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error - turbopack root is valid for Next.js 16 but not currently in types
    turbopack: {
      root: process.cwd(),
    },
  },
};

export default withPWA(nextConfig);
