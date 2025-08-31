/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
  },
  eslint: {
    // Skip ESLint during production builds to avoid failing on warnings
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
  },
  async rewrites() {
    return [
      {
        source: "/api/tryon",
        destination: "http://127.0.0.1:8000/try-on",
      },
    ];
  },
};

module.exports = nextConfig;
