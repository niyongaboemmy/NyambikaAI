/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  },
  eslint: {
    // Skip ESLint during production builds to avoid failing on warnings
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
