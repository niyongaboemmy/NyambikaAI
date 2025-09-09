import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LoadingIndicatorStyles } from "@/components/loading-indicator-styles";
import ServiceWorkerCleanup from "@/components/service-worker-cleanup";
import GoogleAnalytics from "@/components/GoogleAnalytics";

// Theme script to be injected into the document head
const themeScript = `
  (function() {
    try {
      // Get theme from localStorage or system preference
      const savedTheme = localStorage.getItem('nyambika-ui-theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Apply theme immediately
      if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        document.documentElement.classList.add('dark');
      } else if (savedTheme === 'light' || (!savedTheme && !systemDark)) {
        document.documentElement.classList.add('light');
      }
    } catch (e) {
      console.error('Error applying theme:', e);
    }
  })();
`;

declare global {
  interface Window {
    __NEXT_NAVIGATION_LOADING?: boolean;
  }
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "NyambikaAI - AI-Powered Fashion Platform",
  description:
    "Experience the future of fashion with AI-powered virtual try-ons, personalized recommendations, and seamless shopping in Rwanda.",
  keywords:
    "AI fashion, virtual try-on, Rwanda fashion, e-commerce, artificial intelligence",
  authors: [{ name: "NyambikaAI Team" }],
  icons: {
    icon: [
      {
        url: "/nyambika_dark_icon.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/nyambika_dark_icon.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
    ],
    apple: [
      {
        url: "/nyambika_dark_icon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/nyambika_dark_icon.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  openGraph: {
    title: "NyambikaAI - AI-Powered Fashion Platform",
    description:
      "Experience the future of fashion with AI-powered virtual try-ons and personalized recommendations.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/nyambika_dark_icon.png",
        type: "image/png",
      } as any,
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NyambikaAI - AI-Powered Fashion Platform",
    description:
      "Experience the future of fashion with AI-powered virtual try-ons and personalized recommendations.",
    images: ["/nyambika_dark_icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get Google Analytics ID from environment variables
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`font-sans ${inter.variable}`}>
        <Providers>
          {children}
          <LoadingIndicatorStyles />
          <ServiceWorkerCleanup />
          {GA_MEASUREMENT_ID && (
            <GoogleAnalytics GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} />
          )}
        </Providers>
      </body>
    </html>
  );
}
