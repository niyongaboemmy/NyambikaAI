import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LoadingIndicatorStyles } from "@/components/loading-indicator-styles";
import ServiceWorkerCleanup from "@/components/service-worker-cleanup";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { InstallPrompt } from "@/components/InstallPrompt";

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

// Removed next/font/google to prevent network fetch during build in restricted environments

export const metadata: Metadata = {
  title: "Nyambika - AI-Powered Fashion Platform",
  description:
    "Experience the future of fashion with AI-powered virtual try-ons, personalized recommendations, and seamless shopping in Rwanda.",
  keywords:
    "AI fashion, virtual try-on, Rwanda fashion, e-commerce, artificial intelligence",
  authors: [{ name: "Nyambika Team" }],
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
  manifest: "/manifest.json",
  colorScheme: "light dark",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nyambika - AI Fashion",
    startupImage: [
      {
        url: "/nyambika_dark_icon.png",
        media: "(orientation: portrait)",
      },
    ],
  },
  openGraph: {
    title: "Nyambika - AI-Powered Fashion Platform",
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
    title: "Nyambika - AI-Powered Fashion Platform",
    description:
      "Experience the future of fashion with AI-powered virtual try-ons and personalized recommendations.",
    images: ["/nyambika_dark_icon.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Nyambika",
    "msapplication-TileColor": "#6366f1",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Improves behavior of on-screen keyboards on mobile
  interactiveWidget: "resizes-content",
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
        {/* PWA and Mobile App Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#6366f1" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#3730a3" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nyambika" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Global mobile scroll and touch behavior hardening to avoid page disturbance while swiping */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                -webkit-overflow-scrolling: touch;
                touch-action: pan-y;
              }
              body {
                overscroll-behavior-y: none;
              }
              /* Prevent pull-to-refresh on supported browsers */
              @supports (-webkit-touch-callout: none) {
                body { overscroll-behavior: none; }
              }
            `,
          }}
        />
      </head>
      <body className="font-sans overscroll-none touch-pan-y overflow-x-hidden">
        <Providers>
          {children}
          <LoadingIndicatorStyles />
          <ServiceWorkerCleanup />
          <InstallPrompt />
          {GA_MEASUREMENT_ID && (
            <GoogleAnalytics GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} />
          )}
        </Providers>
      </body>
    </html>
  );
}
