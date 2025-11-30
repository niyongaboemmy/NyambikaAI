import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Try-On Gallery - Nyambika",
  description:
    "Discover breathtaking fashion transformations powered by cutting-edge AI. See how virtual try-on technology brings your wildest style dreams to life.",
  openGraph: {
    title: "AI Try-On Gallery - Nyambika",
    description:
      "Discover breathtaking fashion transformations powered by cutting-edge AI. See how virtual try-on technology brings your wildest style dreams to life.",
    type: "website",
    images: [
      {
        url: "/nyambika_light_icon.png",
        width: 1200,
        height: 630,
        alt: "Nyambika AI Try-On Gallery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Try-On Gallery - Nyambika",
    description:
      "Discover breathtaking fashion transformations powered by cutting-edge AI. See how virtual try-on technology brings your wildest style dreams to life.",
    images: ["/nyambika_light_icon.png"],
  },
};

export default function PublicTryOnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
