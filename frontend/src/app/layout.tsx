import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LoadingIndicatorStyles } from "@/components/loading-indicator-styles";

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
  openGraph: {
    title: "NyambikaAI - AI-Powered Fashion Platform",
    description:
      "Experience the future of fashion with AI-powered virtual try-ons and personalized recommendations.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NyambikaAI - AI-Powered Fashion Platform",
    description:
      "Experience the future of fashion with AI-powered virtual try-ons and personalized recommendations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="light" // Default class to prevent flash of unstyled content
      data-navigation-loading={
        typeof window !== "undefined" ? window.__NEXT_NAVIGATION_LOADING : false
      }
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize early loading state
              window.__NEXT_NAVIGATION_LOADING = false;
              
              // Intercept link clicks
              document.addEventListener('click', function(event) {
                const target = event.target.closest('a');
                if (target && target.href && target.href.startsWith(window.location.origin)) {
                  // Only handle internal navigation
                  if (event.ctrlKey || event.metaKey) return; // Don't intercept cmd/ctrl+click
                  
                  // Show loading immediately
                  document.documentElement.style.setProperty('--navigation-loading', '1');
                  window.__NEXT_NAVIGATION_LOADING = true;
                }
              }, true);
              
              // Handle back/forward navigation
              window.addEventListener('popstate', function() {
                document.documentElement.style.setProperty('--navigation-loading', '1');
                window.__NEXT_NAVIGATION_LOADING = true;
              });
            `,
          }}
        />
        <LoadingIndicatorStyles />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
