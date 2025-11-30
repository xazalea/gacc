/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude everything possible to minimize bundle
      config.externals = [
        ...(config.externals || []), 
        '@sparticuz/chromium',
        'fs',
        'path',
        'os',
        'https',
      ];
      
      // Aggressive minimization
      config.optimization = {
        ...config.optimization,
        minimize: true,
        usedExports: true,
        sideEffects: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

