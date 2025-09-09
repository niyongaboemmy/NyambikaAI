import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { API_BASE_URL } from "@/config/api";

// Build absolute URL helper
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function getCompany(id: string) {
  // Use absolute URL so this works in Edge/server runtime for metadata
  try {
    // Important: use backend API base, not the frontend site URL
    const url = new URL(`/api/companies/${id}`, API_BASE_URL).toString();
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data as {
      id: string;
      name: string;
      location?: string | null;
      logoUrl?: string | null;
    };
  } catch {
    // If the API is unreachable (e.g., during build or missing SITE_URL),
    // return null so we fall back to default metadata instead of throwing.
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const company = await getCompany(params.id);
  const title = company?.name || "Store";
  const description = company?.location || undefined;

  // Ensure image is absolute
  const defaultLogo = new URL("/nyambika_light_icon.png", SITE_URL).toString();
  const image = company?.logoUrl
    ? (company.logoUrl.startsWith("http")
        ? company.logoUrl
        : new URL(company.logoUrl, SITE_URL).toString())
    : defaultLogo;

  return buildMetadata({
    title,
    description,
    path: `/store/${params.id}`,
    images: [image],
  });
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
