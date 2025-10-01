import type { Metadata, Viewport } from "next";
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
  themeColor: "#6366f1",
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
        <meta name="theme-color" content="#6366f1" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nyambika" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

        {/* Global mobile scroll and touch behavior hardening to avoid page disturbance while swiping */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                height: 100%;
                -webkit-overflow-scrolling: touch;
                touch-action: pan-y;
              }
              body {
                overflow-x: hidden;
                overscroll-behavior-y: none;
              }
              /* Prevent pull-to-refresh on supported browsers */
              @supports (-webkit-touch-callout: none) {
                body { overscroll-behavior: none; }
              }

              /* Handle safe areas for devices with notches */
              @supports (padding: max(0px)) {
                body {
                  padding-top: env(safe-area-inset-top);
                  padding-bottom: env(safe-area-inset-bottom);
                  padding-left: env(safe-area-inset-left);
                  padding-right: env(safe-area-inset-right);
                }
              }

              /* Force mobile browser to use full viewport */
              html {
                height: 100vh;
                width: 100vw;
                margin: 0;
                padding: 0;
              }

              /* Hide browser UI for PWA experience */
              body {
                margin: 0;
                padding: 0;
                height: 100vh;
                width: 100vw;
                overflow: hidden;
              }

              /* Ensure content fits properly */
              #__next {
                height: 100vh;
                width: 100vw;
                overflow-x: hidden;
                overscroll-behavior-y: none;
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
          {GA_MEASUREMENT_ID && (
            <GoogleAnalytics GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} />
          )}
        </Providers>
      </body>
    </html>
  );
}
