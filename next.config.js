const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'tong.visitkorea.or.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tong.visitkorea.or.kr',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'www.kopis.or.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.kopis.or.kr',
        pathname: '/**',
      }
    ],
  },
};

module.exports = withNextIntl(nextConfig);
