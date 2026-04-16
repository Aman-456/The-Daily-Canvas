import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/blogs/:slug",
        destination: "/articles/:slug",
        permanent: true,
      },
      {
        source: "/blogs/:slug/thread/:commentId",
        destination: "/articles/:slug/thread/:commentId",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Allow custom `quality` values used across editorial cards.
    qualities: [40,45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
