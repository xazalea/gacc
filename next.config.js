/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude chromium from bundle - it's loaded at runtime
      config.externals = [...(config.externals || []), '@sparticuz/chromium'];
      config.optimization = { ...config.optimization, minimize: true };
    }
    return config;
  },
}

module.exports = nextConfig

