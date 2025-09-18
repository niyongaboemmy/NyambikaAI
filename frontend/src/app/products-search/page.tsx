import type { Metadata } from "next";
import ClientProductsSearchPage from "./ClientPage";
import { buildMetadata } from "@/lib/seo";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

export const dynamic = "force-dynamic";

// Build absolute URL helper (align with store layout approach)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nyambika.com";
const toAbsolute = (u: string) =>
  u?.startsWith("http") || u?.startsWith("data:")
    ? u
    : new URL(u || "/", SITE_URL).toString();
const mimeFromUrl = (url: string): string | undefined => {
  const u = (url || "").toLowerCase();
  if (u.startsWith("data:")) {
    const match = /^data:([^;,]+)[;,]/i.exec(url);
    return match ? match[1] : undefined;
  }
  if (u.endsWith(".svg") || u.includes("image/svg")) return "image/svg+xml";
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
  if (u.endsWith(".ico")) return "image/x-icon";
  return undefined;
};

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
      keywords: ["product search", "AI recommendations", "fashion search"],
    });
    const logo = toAbsolute("/nyambika_logo.png");
    return {
      ...base,
      openGraph: {
        ...(base.openGraph || {}),
        images: [
          {
            url: logo,
            type: mimeFromUrl(logo),
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

  try {
    const url = new URL(
      API_ENDPOINTS.CATEGORY_BY_ID(categoryId),
      API_BASE_URL
    ).toString();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch category");
    const payload = await res.json();
    const category = payload?.data ?? payload ?? {};
    const name: string = `${
      category.name || category.title || category.slug || categoryId
    } - Nyambika`;
    const description: string =
      category.description ||
      `Explore ${name} products with AI-powered virtual try-on and personalized recommendations.`;

    const base = buildMetadata({
      title: name,
      description,
      path: `/products-search?category=${encodeURIComponent(categoryId)}`,
      images: ["/nyambika_logo.png"],
      keywords: [name, "AI fashion", "virtual try-on"],
    });
    // Prefer category image when available; else use logo
    const rawImage =
      category.imageUrl ||
      category.image ||
      category.bannerImage ||
      "/nyambika_logo.png";
    const image = toAbsolute(rawImage);
    return {
      ...base,
      openGraph: {
        ...(base.openGraph || {}),
        images: [
          {
            url: image,
            type: mimeFromUrl(image),
            alt: `${name} category` as any,
            width: 1200 as any,
            height: 630 as any,
            secureUrl: image as any,
          } as any,
        ],
      },
      twitter: {
        ...(base.twitter || {}),
        images: [image],
      },
      // Also set favicon/apple/shortcut using the category image
      icons: {
        icon: [
          { url: image, sizes: "32x32", type: mimeFromUrl(image) },
          { url: image, sizes: "16x16", type: mimeFromUrl(image) },
        ],
        shortcut: [{ url: image, type: mimeFromUrl(image) }],
        apple: [{ url: image, sizes: "180x180", type: mimeFromUrl(image) }],
      },
    };
  } catch (e) {
    const base = buildMetadata({
      title: categoryId,
      description: `Explore ${categoryId} products with AI-powered virtual try-on and personalized recommendations.`,
      path: `/products-search?category=${encodeURIComponent(categoryId)}`,
      images: ["/nyambika_logo.png"],
    });
    const logo = toAbsolute("/nyambika_logo.png");
    return {
      ...base,
      openGraph: {
        ...(base.openGraph || {}),
        images: [
          {
            url: logo,
            type: mimeFromUrl(logo),
            alt: `${categoryId} category` as any,
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

export default function ProductsSearchPage() {
  return <ClientProductsSearchPage />;
}
