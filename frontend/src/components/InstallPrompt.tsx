"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone, Monitor, Share } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop">("desktop");
  const { actualTheme } = useTheme();

  useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window === "undefined") return;

    // Add delay to ensure DOM is ready and prevent MutationObserver errors
    const initTimeout = setTimeout(() => {
      try {
        // Check if app is already installed
        const checkInstalled = () => {
          if (window.matchMedia?.("(display-mode: standalone)")?.matches) {
            setIsInstalled(true);
            return;
          }

          // Check if running as PWA (iOS Safari)
          if ((window.navigator as any)?.standalone === true) {
            setIsInstalled(true);
            return;
          }
        };

        // Detect device type
        const detectDevice = () => {
          const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent || ""
            );
          setDeviceType(isMobile ? "mobile" : "desktop");
        };

        // Handle beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
          e.preventDefault();
          setDeferredPrompt(e as BeforeInstallPromptEvent);

          // Show prompt after a delay if not installed
          setTimeout(() => {
            try {
              if (
                !isInstalled &&
                !sessionStorage?.getItem?.("installPromptDismissed")
              ) {
                setShowPrompt(true);
              }
            } catch {
              // SessionStorage not available, show prompt anyway
              if (!isInstalled) setShowPrompt(true);
            }
          }, 3000);
        };

        // Handle app installed event
        const handleAppInstalled = () => {
          setIsInstalled(true);
          setShowPrompt(false);
          setDeferredPrompt(null);
        };

        checkInstalled();
        detectDevice();

        // Add event listeners
        window.addEventListener?.(
          "beforeinstallprompt",
          handleBeforeInstallPrompt
        );
        window.addEventListener?.("appinstalled", handleAppInstalled);

        // For development - show prompt for testing
        if (process.env.NODE_ENV === "development") {
          setTimeout(() => {
            try {
              if (
                !isInstalled &&
                !sessionStorage?.getItem?.("installPromptDismissed")
              ) {
                setShowPrompt(true);
              }
            } catch {
              if (!isInstalled) setShowPrompt(true);
            }
          }, 3000);
        }

        return () => {
          window.removeEventListener?.(
            "beforeinstallprompt",
            handleBeforeInstallPrompt
          );
          window.removeEventListener?.("appinstalled", handleAppInstalled);
        };
      } catch (error) {
        console.warn("Error initializing install prompt:", error);
      }
    }, 200);

    return () => {
      clearTimeout(initTimeout);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For development/testing - simulate install
      if (process.env.NODE_ENV === "development") {
        alert(
          "🎉 App would be installed in production! This is a development preview."
        );
        setShowPrompt(false);
        return;
      }

      // Fallback for browsers that don't support beforeinstallprompt
      setShowPrompt(false);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Install prompt failed:", error);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    try {
      sessionStorage?.setItem?.("installPromptDismissed", "true");
    } catch {
      // SessionStorage not available, ignore
    }
  };

  // Don't show if already installed, dismissed, or not in browser
  if (typeof window === "undefined" || isInstalled || !showPrompt) {
    return null;
  }

  // Check session storage safely
  try {
    if (sessionStorage?.getItem?.("installPromptDismissed")) {
      return null;
    }
  } catch {
    // SessionStorage not available, continue
  }

  const getInstructions = () => {
    if (deviceType === "mobile") {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        return {
          title: "Add Nyambika to Home Screen",
          steps: [
            "Tap the Share button",
            "Scroll down and tap 'Add to Home Screen'",
            "Tap 'Add' to confirm",
          ],
          icon: <Share className="h-5 w-5" />,
        };
      } else {
        return {
          title: "Install Nyambika App",
          steps: [
            "Tap 'Install' below",
            "Confirm installation",
            "Access from your home screen",
          ],
          icon: <Smartphone className="h-5 w-5" />,
        };
      }
    } else {
      return {
        title: "Install Nyambika Desktop App",
        steps: [
          "Click 'Install' below",
          "Confirm installation",
          "Access from your desktop",
        ],
        icon: <Monitor className="h-5 w-5" />,
      };
    }
  };

  const instructions = getInstructions();

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-80">
      <div
        className={`
        relative overflow-hidden rounded-xl border backdrop-blur-lg
        ${
          actualTheme === "dark"
            ? "bg-gray-900/90 border-gray-700/50"
            : "bg-white/90 border-gray-200/50"
        }
        shadow-lg transform transition-all duration-300 scale-100
      `}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full blur-2xl animate-pulse delay-1000" />
        </div>

        <div className="relative p-4">
          {/* Compact header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`
                  p-1.5 rounded-lg
                  ${
                    actualTheme === "dark" ? "bg-blue-500/20" : "bg-blue-500/10"
                  }
                `}
              >
                {instructions.icon}
              </div>
              <div>
                <h3
                  className={`
                    font-medium text-sm
                    ${actualTheme === "dark" ? "text-white" : "text-gray-900"}
                  `}
                >
                  Install Nyambika
                </h3>
                <p
                  className={`
                    text-xs
                    ${
                      actualTheme === "dark" ? "text-gray-400" : "text-gray-600"
                    }
                  `}
                >
                  Quick access & offline mode
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className={`
                  p-1 rounded-full transition-colors
                  ${
                    actualTheme === "dark"
                      ? "hover:bg-gray-700/50 text-gray-400 hover:text-gray-300"
                      : "hover:bg-gray-100/50 text-gray-500 hover:text-gray-700"
                  }
                `}
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Compact action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full
                  font-medium text-xs transition-all duration-200
                  bg-gradient-to-r from-blue-500 to-purple-600 text-white
                  hover:from-blue-600 hover:to-purple-700
                  shadow-md hover:shadow-lg
                `}
            >
              <Download className="h-3 w-3" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className={`
                  px-3 py-2 rounded-full font-medium text-xs transition-colors
                  ${
                    actualTheme === "dark"
                      ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                      : "bg-gray-100/50 text-gray-700 hover:bg-gray-200/50"
                  }
                `}
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
