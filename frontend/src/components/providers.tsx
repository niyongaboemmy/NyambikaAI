"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/custom-ui/toaster";
import { TooltipProvider } from "@/components/custom-ui/tooltip";
import { AuthProvider } from "../contexts/AuthContext";
import { LoginPromptProvider } from "@/contexts/LoginPromptContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { CartProvider } from "@/contexts/CartContext";
import RoleBasedNavigation from "@/components/RoleBasedNavigation";
import AnimatedAIBackground from "@/components/layout/AnimatedAIBackground";
import Footer from "@/components/Footer";
import AddProductFAB from "@/components/AddProductFAB";
import CompanyModal from "@/components/CompanyModal";
import { usePathname } from "next/navigation";
import { queryClient } from "@/lib/queryClient";
import LoginModal from "@/components/LoginModal";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NavigationProgress } from "@/components/navigation-progress";
import { NavigationEvents } from "@/components/navigation-events";
import { GlobalAuthLoader } from "@/components/custom-ui/GlobalAuthLoader";
import { RouteProtection } from "@/components/RouteProtection";
import { ProducerSubscriptionGuard } from "@/components/ProducerSubscriptionGuard";
import { DOMSafetyWrapper } from "@/components/dom-safety-wrapper";
import { useEffect, useState } from "react";

// ClientOnly component to wrap client-side only components
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}

// Create a client-side only wrapper for AuthProvider
function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <AuthProvider>{children}</AuthProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine container class outside of JSX to avoid conditional hook calls
  const containerClass = pathname?.includes("/store/")
    ? "min-h-screen"
    : "min-h-screen container mx-auto px-3 sm:px-0";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="nyambika-ui-theme">
        <LanguageProvider>
          <TooltipProvider>
            <LoginPromptProvider>
              <AuthProviderWrapper>
                <CompanyProvider>
                  <CartProvider>
                    <ClientOnly>
                      <DOMSafetyWrapper />
                      <RoleBasedNavigation />
                      <NavigationEvents />
                      <NavigationProgress />
                    </ClientOnly>
                    <AnimatedAIBackground>
                      <RouteProtection>
                        <ProducerSubscriptionGuard>
                          <div className={containerClass}>{children}</div>
                          <Footer />
                          <AddProductFAB />
                        </ProducerSubscriptionGuard>
                      </RouteProtection>
                    </AnimatedAIBackground>
                    <ClientOnly>
                      <CompanyModal />
                      <LoginModal />
                      <GlobalAuthLoader />
                    </ClientOnly>
                    <Toaster />
                  </CartProvider>
                </CompanyProvider>
              </AuthProviderWrapper>
            </LoginPromptProvider>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
