import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

// Use the same SITE_URL strategy as store layout for absolute URLs and consistent metadataBase
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nyambika.com";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { category?: string };
}): Promise<Metadata> {
  const categoryId = searchParams?.category;

  if (!categoryId || categoryId === "all") {
    const base = buildMetadata({
      title: "Product Search — Nyambika",
      description:
        "Search and discover amazing products with AI-powered recommendations across all categories.",
      path: "/products-search",
      images: ["/nyambika_logo.png"],
      keywords: [
        "product search",
        "AI recommendations",
        "fashion search",
        "Rwanda shopping",
      ],
    });
    const logo = new URL("/nyambika_logo.png", SITE_URL).toString();
    return {
      ...base,
      openGraph: {
        ...(base.openGraph || {}),
        images: [
          {
            url: logo,
            alt: "Nyambika Logo",
            width: 1200 as any,
            height: 630 as any,
            secureUrl: logo as any,
          } as any,
        ],
      },
      twitter: {
        ...(base.twitter || {}),
        images: [logo],
      },
      icons: {
        icon: [
          { url: logo, sizes: "32x32", type: "image/png" },
          { url: logo, sizes: "16x16", type: "image/png" },
        ],
        shortcut: [{ url: logo, type: "image/png" }],
        apple: [{ url: logo, sizes: "180x180", type: "image/png" }],
      },
    };
  }

  // For specific category, we'll fetch category details
  try {
    const url = new URL(
      API_ENDPOINTS.CATEGORY_BY_ID(categoryId),
      API_BASE_URL
    ).toString();
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Failed to fetch category ${categoryId}`);
    }

    const payload = await res.json();
    // Handle possible response shapes: { data: {...} } | {...}
    const category = payload?.data ?? payload ?? {};

    const name: string =
      category.name || category.title || category.slug || categoryId;
    const description: string =
      category.description ||
      `Explore ${name} products with AI-powered virtual try-on and personalized recommendations.`;

    const base = buildMetadata({
      title: name,
      description,
      path: `/products-search?category=${encodeURIComponent(categoryId)}`,
      // Always show logo as the category image in previews/metadata
      images: ["/nyambika_logo.png"],
      keywords: [name, "AI fashion", "virtual try-on", "Rwanda shopping"],
    });
    const logo = new URL("/nyambika_logo.png", SITE_URL).toString();
    return {
      ...base,
      openGraph: {
        ...(base.openGraph || {}),
        images: [
          {
            url: logo,
            alt: `${name} category` as any,
            width: 1200 as any,
            height: 630 as any,
            secureUrl: logo as any,
          } as any,
        ],
      },
      twitter: {
        ...(base.twitter || {}),
        images: [logo],
      },
      icons: {
        icon: [
          { url: logo, sizes: "32x32", type: "image/png" },
          { url: logo, sizes: "16x16", type: "image/png" },
        ],
        shortcut: [{ url: logo, type: "image/png" }],
        apple: [{ url: logo, sizes: "180x180", type: "image/png" }],
      },
    };
  } catch (error) {
    // Network or API failure: still honor the selected category by using its ID as name
    const fallbackName = categoryId || "Products";
    const base = buildMetadata({
      title: fallbackName,
      description: `Explore ${fallbackName} products with AI-powered virtual try-on and personalized recommendations.`,
      path: categoryId
        ? `/products-search?category=${encodeURIComponent(categoryId)}`
        : "/products-search",
      images: ["/nyambika_logo.png"],
      keywords: [
        fallbackName,
        "AI fashion",
        "virtual try-on",
        "Rwanda shopping",
      ],
    });
    const logo = new URL("/nyambika_logo.png", SITE_URL).toString();
    return {
      ...base,
      openGraph: {
        ...(base.openGraph || {}),
        images: [
          {
            url: logo,
            alt: `${fallbackName} category` as any,
            width: 1200 as any,
            height: 630 as any,
            secureUrl: logo as any,
          } as any,
        ],
      },
      twitter: {
        ...(base.twitter || {}),
        images: [logo],
      },
      icons: {
        icon: [
          { url: logo, sizes: "32x32", type: "image/png" },
          { url: logo, sizes: "16x16", type: "image/png" },
        ],
        shortcut: [{ url: logo, type: "image/png" }],
        apple: [{ url: logo, sizes: "180x180", type: "image/png" }],
      },
    };
  }
}

export default function ProductsSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
