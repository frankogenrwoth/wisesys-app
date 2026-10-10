import type { NextConfig } from "next";

const apiBase = process.env.WISESYS_API_BASE ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: `${apiBase}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
