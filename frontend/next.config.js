const path = require("path");
const withSerwist = require("@serwist/next").default;

const withPWA = withSerwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
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
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "nyambika.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "marketplace.canva.com" },
      { protocol: "https", hostname: "vms.rw" },
      { protocol: "https", hostname: "nyambikav2.vms.rw" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "view.tryon-api.com" },
      { protocol: "https", hostname: "example.com" }, // placeholder/test data
      { protocol: "https", hostname: "**.amazonaws.com" }, // S3 / try-on results
      { protocol: "https", hostname: "**.neon.tech" },
      { protocol: "https", hostname: "**" }, // catch-all for any HTTPS image host
    ],
    formats: ["image/webp", "image/avif"],
    qualities: [60, 70, 75],
    deviceSizes: [320, 420, 640, 768, 1024, 1280],
    imageSizes: [32, 48, 64, 96, 120, 160, 240, 320],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
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
});

module.exports = nextConfig;
