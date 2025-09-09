import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { API_BASE_URL } from "@/config/api";

// Build absolute URL helper
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nyambika.com";

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

function mimeFromUrl(url: string): string | undefined {
  const u = url.toLowerCase();
  if (u.startsWith("data:")) {
    // pattern: data:image/png;base64,.... or data:image/svg+xml;utf8,...
    const match = /^data:([^;,]+)[;,]/i.exec(url);
    return match ? match[1] : undefined;
  }
  if (u.endsWith(".svg") || u.includes("image/svg")) return "image/svg+xml";
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
  if (u.endsWith(".ico")) return "image/x-icon";
  return undefined;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const company = await getCompany(params.id);
  const safeId = encodeURIComponent((params.id || "").trim());
  const title = company?.name || "Store";
  const description =
    (company?.location && company.location.trim()) ||
    (company?.name
      ? `Explore products from ${company.name} on NyambikaAI`
      : undefined);

  // Ensure image is absolute
  const defaultLogo = new URL("/nyambika_dark_icon.png", SITE_URL).toString();
  const imageTemp = company?.logoUrl
    ? company.logoUrl.startsWith("http") || company.logoUrl.startsWith("data:")
      ? company.logoUrl
      : new URL(company.logoUrl, SITE_URL).toString()
    : defaultLogo;
  const image = imageTemp.trim();
  // Social platforms (FB/LinkedIn/Twitter) do NOT render data URLs.
  // Use a real hosted image for OG/Twitter when the logo is a data URI.

  // Normalize an absolute HTTPS URL for social crawlers
  const toAbsolute = (u: string) =>
    u.startsWith("http") || u.startsWith("data:")
      ? u
      : new URL(u, SITE_URL).toString();
  const ogUrlRaw = toAbsolute(image);
  const ogUrl = ogUrlRaw.startsWith("http://")
    ? ogUrlRaw.replace(/^http:\/\//i, "https://")
    : ogUrlRaw;

  // Build base metadata (title/description/OG/Twitter)
  const base = buildMetadata({
    title,
    description,
    path: `/store/${safeId}`,
    images: [ogUrl],
  });

  // Add per-store icons (favicon/apple/shortcut) using company logo
  // Next.js will place these in <link rel="icon" ...>, etc.
  return {
    ...base,
    openGraph: {
      ...(base.openGraph || {}),
      url: new URL(`/store/${safeId}`, SITE_URL).toString(),
      images: [
        {
          url: ogUrl,
          type: mimeFromUrl(ogUrl),
          alt: company?.name || "Store logo",
          // Hints for crawlers; if unknown actual size, typical OG size works fine
          width: 1200 as any,
          height: 630 as any,
          secureUrl: ogUrl as any,
        } as any,
      ],
    },
    twitter: {
      ...(base.twitter || {}),
      images: [ogUrl],
    },
    icons: {
      icon: [
        { url: image, type: mimeFromUrl(image), sizes: "32x32" },
        { url: image, type: mimeFromUrl(image), sizes: "16x16" },
      ],
      shortcut: [{ url: image, type: mimeFromUrl(image) }],
      apple: [{ url: image, type: mimeFromUrl(image), sizes: "180x180" }],
    },
  };
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
