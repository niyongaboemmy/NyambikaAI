"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Monitor, Share2, Plus, MoreVertical } from "lucide-react";

// Platform detection utilities
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
      navigator.platform
    ) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  );
};

const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
};

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
};

type Platform = 'ios' | 'android' | 'desktop';

interface InstallPromptProps {
  delay?: number;
  showAfterDismissalDays?: number;
}

export function InstallPrompt({ delay = 5000, showAfterDismissalDays = 7 }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [hasInteracted, setHasInteracted] = useState(false);

  // Check if user has dismissed the prompt recently
  const checkDismissalStatus = (): boolean => {
    if (typeof localStorage === 'undefined') return false;
    
    const dismissedDate = localStorage.getItem('pwa-prompt-dismissed');
    if (!dismissedDate) return false;

    const daysSinceDismissal = Math.floor(
      (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceDismissal < showAfterDismissalDays;
  };

  // Detect platform
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Don't show if already installed
    if (isStandalone()) {
      console.log('✅ App is already installed');
      return;
    }

    // Check dismissal status
    if (checkDismissalStatus()) {
      console.log('ℹ️ Install prompt was recently dismissed');
      return;
    }

    // Detect platform
    if (isIOS()) {
      setPlatform('ios');
      // iOS doesn't fire beforeinstallprompt, so we show manual instructions
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, delay);
      return () => clearTimeout(timer);
    } else if (isAndroid()) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, [delay, showAfterDismissalDays]);

  // Listen for beforeinstallprompt event (Chrome, Edge, Samsung Internet)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: any) => {
      console.log('🎉 beforeinstallprompt event fired');
      
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      
      // Save the event for later use
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Show the install prompt after delay
      setTimeout(() => {
        setShowPrompt(true);
      }, delay);
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA was installed successfully');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowPrompt(false);
      
      // Clear dismissal record
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pwa-prompt-dismissed');
      }

      // Track installation
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'pwa_installed', {
          event_category: 'PWA',
          event_label: platform
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Debug info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 PWA Install Prompt Debug:');
      console.log('  - HTTPS:', window.location.protocol === 'https:');
      console.log('  - Service Worker:', 'serviceWorker' in navigator);
      console.log('  - Manifest:', !!document.querySelector('link[rel="manifest"]'));
      console.log('  - Platform:', platform);
      console.log('  - Standalone:', isStandalone());
      
      // Check service worker registration
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          console.log(`  - SW Registered: ${registrations.length > 0 ? 'Yes' : 'No'}`);
        });
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [delay, platform]);

  // Handle install button click
  const handleInstall = async () => {
    if (!deferredPrompt) {
      // No native prompt available, show instructions
      setShowInstructions(true);
      return;
    }

    try {
      setIsInstalling(true);
      
      // Show the native install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
      
      // Track user choice
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'pwa_install_choice', {
          event_category: 'PWA',
          event_label: outcome
        });
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('❌ Install prompt error:', error);
      setShowInstructions(true);
    } finally {
      setIsInstalling(false);
      setHasInteracted(true);
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    setShowPrompt(false);
    setShowInstructions(false);
    
    // Save dismissal timestamp
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    }

    // Track dismissal
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'pwa_install_dismissed', {
        event_category: 'PWA',
        event_label: platform
      });
    }
  };

  // Get platform-specific instructions
  const getPlatformInstructions = () => {
    switch (platform) {
      case 'ios':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Install Nyambika on your iPhone or iPad:
            </p>
            <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
                  1
                </span>
                <span>
                  Tap the <Share2 className="inline h-4 w-4 mx-1" /> <strong>Share</strong> button below
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>"Add to Home Screen"</strong> <Plus className="inline h-4 w-4 mx-1" />
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
                  3
                </span>
                <span>Tap <strong>"Add"</strong> in the top right corner</span>
              </li>
            </ol>
          </div>
        );
      case 'android':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Install Nyambika on your Android device:
            </p>
            <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
                  1
                </span>
                <span>
                  Tap the <MoreVertical className="inline h-4 w-4 mx-1" /> menu (three dots) in the top right
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
                  2
                </span>
                <span>
                  Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
                  3
                </span>
                <span>Tap <strong>"Install"</strong> to confirm</span>
              </li>
            </ol>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Install Nyambika on your computer:
            </p>
            <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
                  1
                </span>
                <span>
                  Look for the install icon <Download className="inline h-4 w-4 mx-1" /> in your browser's address bar
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
                  2
                </span>
                <span>Click it and select <strong>"Install"</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
                  3
                </span>
                <span>The app will be added to your desktop</span>
              </li>
            </ol>
          </div>
        );
    }
  };

  // Don't show if not ready
  if (!showPrompt || isStandalone()) {
    return null;
  }

  return (
    <>
      {/* Install Prompt Banner */}
      {!showInstructions && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm animate-in slide-in-from-bottom duration-300">
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
            
            {/* Content */}
            <div className="relative p-5">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-4 pr-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  {platform === 'ios' || platform === 'android' ? (
                    <Smartphone className="h-6 w-6 text-white" />
                  ) : (
                    <Monitor className="h-6 w-6 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    Install Nyambika
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Get quick access, work offline, and enjoy a native app experience
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(isInstallable && deferredPrompt) || platform === 'desktop' ? (
                      <button
                        onClick={handleInstall}
                        disabled={isInstalling}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                      >
                        <Download className="h-4 w-4" />
                        {isInstalling ? 'Installing...' : 'Install Now'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowInstructions(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg"
                      >
                        <Download className="h-4 w-4" />
                        How to Install
                      </button>
                    )}
                    
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Not Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Installation Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInstructions(false)}
          />
          
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">Install Nyambika</h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm opacity-90">
                Follow these steps to install the app on your device
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Benefits */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Why install?
                </h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Access directly from your home screen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Works offline after first visit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Faster loading and better performance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Native app-like experience</span>
                  </li>
                </ul>
              </div>

              {/* Platform Instructions */}
              {getPlatformInstructions()}

              {/* Browser Compatibility Note */}
              {platform === 'ios' && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> Installation requires Safari browser on iOS devices.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors border border-gray-300 dark:border-gray-600"
              >
                Close
              </button>
              {(isInstallable && deferredPrompt) && (
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {isInstalling ? 'Installing...' : 'Install Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InstallPrompt;
