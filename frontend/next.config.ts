// next.config.ts
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbopack: {
      root: "./frontend",
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
