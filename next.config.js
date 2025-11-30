/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium-min',
      'puppeteer-extra',
      'puppeteer-extra-plugin-stealth',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@sparticuz/chromium-min',
        'puppeteer-core',
      ];
      config.optimization = { ...config.optimization, minimize: true };
    }
    return config;
  },
}

module.exports = nextConfig

