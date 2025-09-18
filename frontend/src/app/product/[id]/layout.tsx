import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { API_BASE_URL } from "@/config/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nyambika.com";

function toAbsolute(u: string) {
  return u?.startsWith("http") || u?.startsWith("data:")
    ? u
    : new URL(u || "/", SITE_URL).toString();
}

function mimeFromUrl(url: string): string | undefined {
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
}

async function getProduct(id: string) {
  try {
    const url = new URL(`/api/products/${id}`, API_BASE_URL).toString();
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as {
      id: string;
      name: string;
      description?: string | null;
      imageUrl?: string | null;
      additionalImages?: string[] | null;
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  // In Next.js 15+, dynamic route params can be a Promise in some cases
  params: { id: string } | Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolved = (params instanceof Promise ? await params : params) as {
    id: string;
  };
  const safeId = encodeURIComponent((resolved.id || "").trim());
  const product = await getProduct(safeId);

  const title = product?.name
    ? `${product.name} — Nyambika`
    : "Product — Nyambika";
  const description =
    (product?.description && product.description.trim()) ||
    "View product details, photos, and pricing on Nyambika.";

  // Prefer primary product image; fallback to first additional image; else brand icon
  const rawImage =
    product?.imageUrl ||
    product?.additionalImages?.[0] ||
    "/nyambika_dark_icon.png";
  const image = toAbsolute(rawImage).trim();

  const base = buildMetadata({
    title,
    description,
    path: `/product/${safeId}`,
    images: [image],
  });

  return {
    ...base,
    openGraph: {
      ...(base.openGraph || {}),
      images: [
        {
          url: image,
          type: mimeFromUrl(image),
          alt: product?.name || "Product image",
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
    icons: {
      icon: [
        { url: image, sizes: "32x32", type: mimeFromUrl(image) },
        { url: image, sizes: "16x16", type: mimeFromUrl(image) },
      ],
      shortcut: [{ url: image, type: mimeFromUrl(image) }],
      apple: [{ url: image, sizes: "180x180", type: mimeFromUrl(image) }],
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
