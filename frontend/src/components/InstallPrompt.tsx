"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone, Monitor, Share } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice(): Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
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
          // Check if running as PWA (standalone mode)
          if (window.matchMedia?.("(display-mode: standalone)")?.matches) {
            setIsInstalled(true);
            return true;
          }

          // Check if running as PWA (iOS Safari)
          if ((window.navigator as any)?.standalone === true) {
            setIsInstalled(true);
            return true;
          }

          // Check localStorage for installation flag
          try {
            if (localStorage.getItem("nyambika-pwa-installed") === "true") {
              setIsInstalled(true);
              return true;
            }
          } catch {
            // localStorage not available, continue
          }

          return false;
        };

        // Detect device type
        const detectDevice = () => {
          const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent || ""
            );
          setDeviceType(isMobile ? "mobile" : "desktop");
        };

        // Simplified event handling - listen for browser's natural beforeinstallprompt
        const handleBeforeInstallPrompt = (e: any) => {
          console.log("🎉 Browser fired beforeinstallprompt event naturally!", e);

          // Prevent the mini-infobar from appearing on mobile
          e.preventDefault();

          // Store the original event object (it has the real prompt/userChoice methods)
          setDeferredPrompt(e);

          // Show our custom install prompt
          setShowPrompt(true);
        };

        const handleAppInstalled = () => {
          console.log("✅ App was installed successfully");
          setIsInstalled(true);
          setShowPrompt(false);
          try {
            localStorage.setItem("nyambika-pwa-installed", "true");
          } catch {
            // localStorage not available, ignore
          }
        };

        // Add event listeners
        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);
        console.log("✅ Listening for browser's natural beforeinstallprompt events");

        // For development/testing - show prompt after longer delay if no event fired
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            if (!isInstalled && !deferredPrompt) {
              console.log("🔄 Development mode: showing fallback install prompt");
              setShowPrompt(true);
            }
          }, 5000); // Longer delay for production
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
    console.log("🔄 Install button clicked");

    // Prevent double-clicks
    if (isInstalling) {
      console.log("⏳ Installation already in progress");
      return;
    }

    setIsInstalling(true);

    try {
      // Method 1: Use the browser's original deferred prompt event
      if (deferredPrompt) {
        console.log("🎉 Using browser's original deferred prompt");

        try {
          // Call the browser's original prompt() method
          console.log("🚀 Calling browser's native prompt() method");
          await deferredPrompt.prompt();

          console.log("⏳ Waiting for user's choice...");
          const { outcome } = await deferredPrompt.userChoice();

          if (outcome === "accepted") {
            console.log("✅ User accepted installation - app should be installing now");
            setIsInstalled(true);
            setShowPrompt(false);
            try {
              localStorage.setItem("nyambika-pwa-installed", "true");
            } catch {
              // localStorage not available, ignore
            }
          } else {
            console.log("❌ User declined installation");
          }

          setDeferredPrompt(null);
          return;
        } catch (error) {
          console.error("❌ Browser's prompt() method failed:", error);
          setDeferredPrompt(null);
        }
      }

      // Method 2: Fallback for desktop - show address bar instructions
      if (deviceType === "desktop") {
        console.log("🖥️ Desktop fallback: showing address bar instructions");
        showAddressBarInstructions();
        return;
      }

      // Method 3: Show general installation instructions
      console.log("📋 Showing general installation instructions");
      showInstallationInstructions();

    } catch (error) {
      console.error("❌ Installation process failed:", error);
      showInstallationInstructions();
    } finally {
      setIsInstalling(false);
    }
  };

  const showAddressBarInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = /chrome/.test(userAgent);
    const isEdge = /edg/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);

    if (isChrome || isEdge) {
      alert("🖥️ Chrome/Edge Installation:\n\n" +
            "1. Look for the Install icon (⬇️) in the address bar\n" +
            "2. Click it to see the installation dialog\n" +
            "3. Click 'Install' to add Nyambika to your desktop\n\n" +
            "If you don't see the icon, try:\n" +
            "• Menu (⋮) → Install Nyambika\n" +
            "• Or refresh the page and interact with it first");
    } else if (isFirefox) {
      alert("🖥️ Firefox Installation:\n\n" +
            "1. Click the menu button (≡) in the top right\n" +
            "2. Select 'Install This Site as an App'\n" +
            "3. Click 'Install' to confirm\n\n" +
            "The app will be added to your desktop and menu.");
    } else {
      alert("🖥️ Desktop Installation:\n\n" +
            "Use your browser's installation feature:\n" +
            "• Chrome/Edge: Look for ⬇️ icon in address bar\n" +
            "• Firefox: Menu → Install This Site as an App\n" +
            "• Other browsers: Check browser menu for install option");
    }

    setShowPrompt(false);
  };

  const showInstallationInstructions = () => {
    console.log("📋 Showing installation instructions");

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);
    const isEdge = /edg/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);

    if (isIOS) {
      const instructions = "1. Tap the Share button (□) at bottom of Safari\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' to confirm";
      alert(`📱 iOS Installation:\n\n${instructions}\n\nNote: iOS requires manual installation.`);
    } else if (isAndroid && (isChrome || isEdge)) {
      const instructions = "1. Tap the menu button (⋮) in the top right\n2. Select 'Install app' or 'Add to Home screen'\n3. Tap 'Install' to confirm";
      alert(`📱 Android Installation:\n\n${instructions}`);
    } else if (!deviceType.includes("mobile") && (isChrome || isEdge)) {
      const instructions = "1. Click the Install icon (⬇️) in the address bar\n2. Or use: Menu → Install Nyambika\n3. Click 'Install' to confirm";
      alert(`🖥️ Desktop Installation:\n\n${instructions}`);
    } else if (!deviceType.includes("mobile") && isFirefox) {
      const instructions = "1. Click the menu button (≡) in the top right\n2. Select 'Install This Site as an App'\n3. Click 'Install' to confirm";
      alert(`🖥️ Firefox Installation:\n\n${instructions}`);
    } else {
      const instructions = deviceType === "mobile" ?
        "Use your browser's menu to add this app to your home screen" :
        "Use your browser's menu to install this app";
      alert(`📱 Installation:\n\n${instructions}`);
    }

    setShowPrompt(false);
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
              Install Now
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

export default InstallPrompt;
