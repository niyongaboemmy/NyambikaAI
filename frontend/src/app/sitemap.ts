import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Core routes to index; dynamic routes can be added here or generated from an API in the future
  const routes = [
    "",
    "/products",
    "/product-categories",
    "/companies",
    "/try-on",
    "/store",
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: route === "" ? 1 : 0.7,
  }));
}
