/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.genius.com',
      },
      {
        protocol: 'https',
        hostname: 'images.genius.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.genius.com',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
      },
    ],
  },
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during production builds
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 