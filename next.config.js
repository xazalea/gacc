/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude chromium from webpack bundling
      config.externals = [...(config.externals || []), '@sparticuz/chromium'];
    }
    return config;
  },
}

module.exports = nextConfig

