import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== "production") {
      return [
        {
          source: "/api/:path*",
          // Use backend port 8002 for local development to avoid conflicts
          destination: "http://127.0.0.1:8002/api/:path*",
        },
      ];
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://financial-time-series-api.vercel.app";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;