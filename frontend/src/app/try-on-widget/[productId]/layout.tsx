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
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const safeId = encodeURIComponent((productId || "").trim());
  const product = await getProduct(safeId);

  const baseName = product?.name?.trim() || "Product";
  const title = `AI Try-On — ${baseName} — Nyambika`;
  const description =
    product?.description?.trim() ||
    `Try on ${baseName} with AI on Nyambika and see how it looks on you.`;

  const img = product?.imageUrl || "/nyambika_dark_icon.png";
  const image =
    img.startsWith("http") || img.startsWith("data:")
      ? img
      : new URL(img, SITE_URL).toString();

  return buildMetadata({
    title,
    description,
    path: `/try-on-widget/${safeId}`,
    images: [image],
  });
}

export default function TryOnWidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
