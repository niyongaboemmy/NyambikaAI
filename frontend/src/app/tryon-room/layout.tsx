import { Metadata } from "next";

interface TryOnRoomLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale?: string;
  }>;
}

export async function generateMetadata({
  params,
}: TryOnRoomLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const isRwanda = locale === "rw";

  return {
    title: isRwanda
      ? "Ishusho rya AI Try-On - Nyambika AI"
      : "AI Try-On Room - Nyambika AI",
    description: isRwanda
      ? "Reba ibishushanyo bya AI try-on byumvikana, wifashishije imiterere y'ibicuruzwa no gukora ibishushanyo byawe. Shakisha ibyifuzo byawe by'imyenda hamwe n'ikoranabuhanga rya AI."
      : "Explore community AI try-on showcases, discover product styles, and create your own virtual fashion try-ons with advanced AI technology.",
    keywords: [
      "AI try-on",
      "virtual fitting room",
      "fashion technology",
      "virtual try-on",
      "AI fashion",
      "clothing visualization",
      "style discovery",
      isRwanda ? "ishusho ryamafoto" : "photo showcase",
      isRwanda ? "imodoka ya AI" : "AI fashion",
      isRwanda ? "guhanga no kubika" : "try and see",
    ],
    authors: [{ name: "Nyambika AI" }],
    creator: "Nyambika AI",
    publisher: "Nyambika AI",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "https://nyambika.com"
    ),
    alternates: {
      canonical: "/tryon-room",
      languages: {
        "en-US": "/en/tryon-room",
        "rw-RW": "/rw/tryon-room",
        "fr-FR": "/fr/tryon-room",
      },
    },
    openGraph: {
      type: "website",
      locale: locale || "en_US",
      url: "/tryon-room",
      title: isRwanda
        ? "Ishusho rya AI Try-On - Nyambika AI"
        : "AI Try-On Room - Nyambika AI",
      description: isRwanda
        ? "Reba ibishushanyo bya AI try-on byumvikana, wifashishije imiterere y'ibicuruzwa no gukora ibishushanyo byawe."
        : "Explore community AI try-on showcases, discover product styles, and create your own virtual fashion try-ons.",
      siteName: "Nyambika AI",
      images: [
        {
          url: "/images/tryon-room-og.jpg",
          width: 1200,
          height: 630,
          alt: isRwanda ? "Ishusho rya AI Try-On" : "AI Try-On Room",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: isRwanda
        ? "Ishusho rya AI Try-On - Nyambika AI"
        : "AI Try-On Room - Nyambika AI",
      description: isRwanda
        ? "Reba ibishushanyo bya AI try-on byumvikana, wifashishije imiterere y'ibicuruzwa no gukora ibishushanyo byawe."
        : "Explore community AI try-on showcases, discover product styles, and create your own virtual fashion try-ons.",
      images: ["/images/tryon-room-twitter.jpg"],
      creator: "@nyambika_ai",
      site: "@nyambika_ai",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "your-google-verification-code",
      yandex: "your-yandex-verification-code",
      yahoo: "your-yahoo-verification-code",
    },
  };
}

export default function TryOnRoomLayout({ children }: TryOnRoomLayoutProps) {
  return children;
}
