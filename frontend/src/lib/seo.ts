import type { Metadata } from "next";

const SITE_NAME = "Nyambika";
const DEFAULT_TITLE = "Nyambika - AI-Powered Fashion Platform";
const DEFAULT_DESCRIPTION =
  "Experience the future of fashion with AI-powered virtual try-ons, personalized recommendations, and seamless shopping in Rwanda.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export type BuildMetadataOptions = {
  title?: string;
  description?: string;
  path?: string; // e.g. "/products"
  images?: string[]; // absolute or relative
  keywords?: string[];
};

export function buildMetadata(options: BuildMetadataOptions = {}): Metadata {
  const title = options.title || DEFAULT_TITLE;
  const description = options.description || DEFAULT_DESCRIPTION;
  const url = options.path
    ? new URL(options.path, SITE_URL).toString()
    : SITE_URL;

  const images = (options.images || ["/nyambika_dark_icon.png"]).map((img) =>
    img.startsWith("http") ? img : new URL(img, SITE_URL).toString()
  );

  const keywords = options.keywords || [
    "AI fashion",
    "virtual try-on",
    "Rwanda fashion",
    "e-commerce",
    "artificial intelligence",
  ];

  return {
    title,
    description,
    keywords: keywords.join(", "),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      siteName: SITE_NAME,
      title,
      description,
      url,
      type: "website",
      images: images,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    // Add any custom meta tags
    other: {
      "application-name": SITE_NAME,
      "theme-color": "#0B1220",
    },
  };
}
