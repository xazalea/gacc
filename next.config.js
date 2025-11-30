/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium-min',
      'puppeteer-extra',
      'puppeteer-extra-plugin',
      'puppeteer-extra-plugin-stealth',
      'clone-deep',
      'merge-deep',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@sparticuz/chromium-min',
        // 'puppeteer-extra',
        // 'puppeteer-extra-plugin-stealth',
      ];
      config.optimization = { ...config.optimization, minimize: true };
    }
    return config;
  },
}

module.exports = nextConfig

