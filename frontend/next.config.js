const path = require("path");

const withPWA = require("next-pwa")({
  dest: "public",
  disable: false, // Enable PWA in development for testing
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "unsplash-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/images\.pexels\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "pexels-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "cloudinary-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
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
    domains: [
      "localhost",
      "127.0.0.1",
      "nyambika.com",
      "images.unsplash.com",
      "images.pexels.com",
      "res.cloudinary.com",
      "marketplace.canva.com",
      "vms.rw",
      "nyambikav2.vms.rw",
    ],
    formats: ["image/webp", "image/avif"],
    // Explicit qualities used in the app (required in Next.js 16+)
    qualities: [60, 70, 75],
    // Generate only the sizes we actually use across the app
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
