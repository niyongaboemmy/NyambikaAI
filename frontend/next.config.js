const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
    NEXT_PUBLIC_PEXELS_API_KEY: process.env.NEXT_PUBLIC_PEXELS_API_KEY,
  },

  // ✅ Enable React strict mode for better debugging
  reactStrictMode: true,

  // ✅ Configure image optimization
  images: {
    domains: ["localhost", "127.0.0.1", "nyambika.com"],
    formats: ["image/webp", "image/avif"],
  },

  // ✅ ESLint config
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ API rewrites (easily extendable later)
  async rewrites() {
    return [
      {
        source: "/api/tryon",
        destination:
          process.env.NEXT_PUBLIC_TRYON_API || "http://127.0.0.1:8000/try-on",
      },
    ];
  },

  // ✅ Webpack aliasing for clean imports
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@ui": path.resolve(__dirname, "src/components/ui"),
    };
    return config;
  },
};

module.exports = nextConfig;
