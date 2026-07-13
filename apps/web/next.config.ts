import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@genie/api-client', '@genie/types'],
  turbopack: {
    root: '../..',
  },
};

export default nextConfig;
