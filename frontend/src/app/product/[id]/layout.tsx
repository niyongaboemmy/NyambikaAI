import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { API_BASE_URL } from "@/config/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nyambika.com";

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
  params: { id: string };
}): Promise<Metadata> {
  const safeId = encodeURIComponent((params.id || "").trim());
  const product = await getProduct(safeId);

  const title = product?.name
    ? `${product.name} — NyambikaAI`
    : "Product — NyambikaAI";
  const description =
    (product?.description && product.description.trim()) ||
    "View product details, photos, and pricing on NyambikaAI.";

  const img = product?.imageUrl || "/nyambika_dark_icon.png";
  const image =
    img.startsWith("http") || img.startsWith("data:")
      ? img
      : new URL(img, SITE_URL).toString();

  return buildMetadata({
    title,
    description,
    path: `/product/${safeId}`,
    images: [image.trim()],
  });
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
