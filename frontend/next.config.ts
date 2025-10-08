import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  // Required for Docker deployment
  output: 'standalone',
  // Enable HTTPS in development if needed
  // devServer: {
  //   https: true,
  // },
};

export default nextConfig;
