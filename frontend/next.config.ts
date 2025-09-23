import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    // no turbopack field, just standard build
    turbo: true
  },
  output: "standalone" // ensures production build works with Node server
};

export default nextConfig;
