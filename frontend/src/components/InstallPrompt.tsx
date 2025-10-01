"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log("🎉 Browser fired beforeinstallprompt event naturally!");

      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log("✅ PWA was installed");
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowPromptModal(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Called when user clicks the install button
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // No browser prompt available; show manual instructions
      setShowPromptModal(true);
      return;
    }

    try {
      // Show the browser's install prompt
      console.log("🚀 Calling browser's native prompt() method");
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("✅ User accepted the install prompt");
      } else {
        console.log("❌ User dismissed the install prompt");
      }

      // Clear the prompt since we can't reuse it
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("❌ Install prompt failed:", error);
      setShowPromptModal(true);
    }
  };

  // Don't show if not installable
  if (!isInstallable) {
    return null;
  }

  return (
    <>
      {/* Floating Install Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          aria-label="Install app"
          title="Install Nyambika as an app"
        >
          <Download className="h-4 w-4" />
          Install App
        </button>
      </div>

      {/* Manual Installation Instructions Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPromptModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Install Nyambika
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Get quick access and offline mode:
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Quick desktop access</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Works offline</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Faster loading</span>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <strong>To install:</strong>
            </div>

            <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">1.</span>
                <span>Look for the ⬇️ icon in your browser's address bar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">2.</span>
                <span>Click it and select "Install"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">3.</span>
                <span>Follow your browser's installation steps</span>
              </li>
            </ol>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Later
              </button>
              <button
                onClick={() => {
                  setShowPromptModal(false);
                  handleInstallClick();
                }}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InstallPrompt;
