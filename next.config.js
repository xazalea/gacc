/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright-core'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'playwright-core'];
      config.optimization = { ...config.optimization, minimize: true };
    }
    return config;
  },
}

module.exports = nextConfig

