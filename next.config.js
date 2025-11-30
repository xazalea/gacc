/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude chromium-min from webpack bundling to reduce bundle size
      // Chromium will be loaded at runtime
      config.externals = [
        ...(config.externals || []), 
        '@sparticuz/chromium-min',
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

