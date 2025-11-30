/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude chromium from webpack bundling to reduce bundle size
      // Chromium will be loaded at runtime
      config.externals = [
        ...(config.externals || []), 
        '@sparticuz/chromium',
        // Also exclude fs and path to reduce size
        'fs',
        'path',
      ];
      
      // Minimize bundle size
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    return config;
  },
  // Reduce output size
  output: 'standalone',
}

module.exports = nextConfig

