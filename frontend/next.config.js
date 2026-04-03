const path = require("path");

const withPWA = require("next-pwa")({
  dest: "public",
  disable: false, // Re-enable PWA for proper service worker generation
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
