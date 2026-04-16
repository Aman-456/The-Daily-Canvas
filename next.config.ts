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
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
