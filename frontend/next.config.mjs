/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      { source: '/money', destination: '/top-up', permanent: true },
      { source: '/onramp', destination: '/top-up', permanent: true },
      { source: '/loan', destination: '/borrow', permanent: true },
      { source: '/assets', destination: '/dashboard', permanent: true },
      { source: '/swap', destination: '/send', permanent: true },
      { source: '/giveaway', destination: '/dashboard', permanent: false }
    ];
  }
};

export default nextConfig;

import('@opennextjs/cloudflare').then((m) => m.initOpenNextCloudflareForDev());
