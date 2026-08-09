import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
