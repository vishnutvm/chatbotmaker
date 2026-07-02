import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@genie/ui', '@genie/api-client', '@genie/types'],
};

export default nextConfig;
