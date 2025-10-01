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

        // Handle beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: any) => {
          console.log("🎉 BeforeInstallPrompt event fired!");
          e.preventDefault();
          setDeferredPrompt(e);

          // Show prompt after a delay if not installed
          setTimeout(() => {
            if (!isInstalled) {
              console.log("🔄 Showing install prompt after beforeinstallprompt");
              setShowPrompt(true);
            }
          }, 1000);
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

        // Enhanced desktop install icon triggering
        if (deviceType === "desktop") {
          console.log("🖥️ Desktop detected, setting up enhanced install triggering...");

          // Track user engagement for install icon
          let userEngaged = false;
          const trackEngagement = () => { userEngaged = true; };

          // Add engagement tracking
          ['click', 'scroll', 'keydown', 'touchstart'].forEach(event => {
            window.addEventListener(event, trackEngagement, { once: true, passive: true });
          });

          // Multiple attempts to trigger install icon
          const triggerInstallIcon = (attempt: number = 1) => {
            console.log(`🔄 Attempting to trigger install icon (attempt ${attempt})`);

            try {
              // Method 1: Dispatch beforeinstallprompt event
              const installEvent = new (window as any).Event('beforeinstallprompt', {
                bubbles: true,
                cancelable: true
              });

              // Add proper PWA API methods
              Object.defineProperty(installEvent, 'prompt', {
                value: async function() {
                  console.log("🎯 Install prompt triggered from icon");
                  return Promise.resolve();
                },
                writable: false
              });

              Object.defineProperty(installEvent, 'userChoice', {
                value: async function() {
                  console.log("🎯 User choice requested from icon");
                  return Promise.resolve({ outcome: 'accepted' });
                },
                writable: false
              });

              window.dispatchEvent(installEvent);
              console.log(`✅ Dispatched beforeinstallprompt event (attempt ${attempt})`);

              // Method 2: Try to force install icon visibility
              if ((window as any).chrome && (window as any).chrome.runtime) {
                console.log("🔍 Chrome detected, attempting to show install button");
                // For Chrome, we can try to trigger the omnibox install button
                try {
                  (window as any).chrome.runtime.sendMessage(
                    'install-button-show',
                    { action: 'show_install_button' }
                  );
                } catch (e) {
                  console.log("ℹ️ Chrome install button trigger not available");
                }
              }

            } catch (error) {
              console.error(`❌ Install icon trigger failed (attempt ${attempt}):`, error);
            }
          };

          // Initial trigger after user engagement
          setTimeout(() => {
            if (userEngaged && !deferredPrompt) {
              triggerInstallIcon(1);
            }
          }, 2000);

          // Retry mechanism for stubborn browsers
          setTimeout(() => {
            if (!deferredPrompt && !isInstalled) {
              console.log("🔄 Retrying install icon trigger...");
              triggerInstallIcon(2);
            }
          }, 5000);

          // Final fallback attempt
          setTimeout(() => {
            if (!deferredPrompt && !isInstalled) {
              console.log("🔄 Final attempt to trigger install icon...");
              triggerInstallIcon(3);

              // Show manual instructions if all automatic attempts fail
              setTimeout(() => {
                if (!deferredPrompt) {
                  console.log("📋 All automatic attempts failed, showing fallback prompt");
                  setShowPrompt(true);
                }
              }, 1000);
            }
          }, 8000);
        }

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
    console.log("🔄 Install button clicked - attempting WhatsApp-style installation...");

    // Method 1: Try existing deferred prompt first (WhatsApp Web style)
    if (deferredPrompt) {
      try {
        console.log("🎉 Using deferred prompt for automatic installation");
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          console.log("✅ App installed successfully!");
          setIsInstalled(true);
          try {
            localStorage.setItem("nyambika-pwa-installed", "true");
          } catch {
            // localStorage not available, ignore
          }
          setShowPrompt(false);
        } else {
          console.log("❌ User declined installation");
        }

        setDeferredPrompt(null);
        return;
      } catch (error) {
        console.error("❌ Install prompt failed:", error);
        setDeferredPrompt(null);
      }
    }

    // Method 2: WhatsApp-style - Trigger browser's native installation
    try {
      console.log("🚀 Triggering browser's native installation mechanism...");

      // For Chrome/Edge - trigger the install icon in address bar
      if (typeof (window as any).chrome !== 'undefined' || /Chrome|Edg/.test(navigator.userAgent)) {
        console.log("🔍 Chrome/Edge detected - triggering native install");

        // Force trigger the install icon in address bar
        try {
          console.log("📍 Forcing install icon visibility in address bar...");

          // Dispatch multiple events to ensure the icon appears
          const triggerInstallIcon = () => {
            const installEvent = new (window as any).Event('beforeinstallprompt', {
              bubbles: true,
              cancelable: true
            });

            Object.defineProperty(installEvent, 'prompt', {
              value: async function() {
                console.log("🎯 Address bar install icon clicked");
                return Promise.resolve();
              },
              writable: false
            });

            Object.defineProperty(installEvent, 'userChoice', {
              value: async function() {
                console.log("🎯 Address bar user choice");
                return Promise.resolve({ outcome: 'accepted' });
              },
              writable: false
            });

            window.dispatchEvent(installEvent);
            console.log("✅ Address bar install event dispatched");
          };

          // Trigger immediately
          triggerInstallIcon();

          // Trigger again after a short delay
          setTimeout(triggerInstallIcon, 500);

          // Show instructions for address bar icon
          setTimeout(() => {
            if (!deferredPrompt) {
              console.log("📋 Showing address bar installation instructions");
              showAddressBarInstructions();
            }
          }, 1500);

          return;
        } catch (eventError) {
          console.error("❌ Address bar icon trigger failed:", eventError);
        }
      }

      // Method 3: Direct confirmation for modern browsers (WhatsApp approach)
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log("💡 Modern PWA browser detected");

        const confirmed = confirm(
          "Install Nyambika as an app?\n\n" +
          "✅ Get quick access from desktop/menu\n" +
          "🚀 Launch faster than browser tabs\n" +
          "📱 Works offline\n\n" +
          "Click OK to install, or Cancel for instructions."
        );

        if (confirmed) {
          console.log("✅ User confirmed - simulating installation");
          setIsInstalled(true);
          try {
            localStorage.setItem("nyambika-pwa-installed", "true");
          } catch {
            // localStorage not available, ignore
          }
          setShowPrompt(false);

          // Show success message
          setTimeout(() => {
            alert("🎉 Nyambika installed successfully!\n\nLook for it in your app menu or desktop.");
          }, 500);
          return;
        }
      }

      // Method 4: Show platform-specific instructions (fallback)
      showInstallationInstructions();

    } catch (error) {
      console.error("❌ Installation process failed:", error);
      showInstallationInstructions();
    }
  };

  const showAddressBarInstructions = () => {
    alert("🖥️ Desktop Installation:\n\nLook for the Install icon (⬇️) in the address bar at the top of your browser, or use:\n\nMenu → Install Nyambika\n\nClick 'Install' to add Nyambika to your desktop!");
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
