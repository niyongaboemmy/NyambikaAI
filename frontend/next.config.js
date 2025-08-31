// const withPWA = require('next-pwa')({
//   dest: 'public',
//   // Fully disable PWA and prevent any service worker registration
//   register: false,
//   skipWaiting: false,
//   disable: true,
//   runtimeCaching: [
//     {
//       urlPattern: /^https?.*/,
//       handler: 'NetworkFirst',
//       options: {
//         cacheName: 'offlineCache',
//         expiration: {
//           maxEntries: 200,
//         },
//       },
//     },
//   ],
// });

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
