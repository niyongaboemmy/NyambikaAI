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

export function InstallPrompt({ delay = 3000, showAfterDismissalDays = 7 }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [manualTrigger, setManualTrigger] = useState(false);

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

  // Listen for manual trigger from InstallAppButton
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleManualTrigger = () => {
      console.log('🎯 Manual install trigger activated');
      setManualTrigger(true);
      setShowPrompt(true);
      if (!deferredPrompt) {
        setShowInstructions(true);
      }
    };

    window.addEventListener('show-install-prompt', handleManualTrigger);

    return () => {
      window.removeEventListener('show-install-prompt', handleManualTrigger);
    };
  }, [deferredPrompt]);

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

  // Get platform-specific instructions - More compact and modern
  const getPlatformInstructions = () => {
    switch (platform) {
      case 'ios':
        return (
          <div className="space-y-2.5 sm:space-y-3">
            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              📱 iPhone/iPad Installation:
            </p>
            <ol className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[10px] font-bold">
                  1
                </span>
                <span className="flex-1">
                  Tap <Share2 className="inline h-3.5 w-3.5 mx-0.5" /> <strong>Share</strong> button
                </span>
              </li>
              <li className="flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white text-[10px] font-bold">
                  2
                </span>
                <span className="flex-1">
                  Tap <Plus className="inline h-3.5 w-3.5 mx-0.5" /> <strong>"Add to Home Screen"</strong>
                </span>
              </li>
              <li className="flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-600 text-white text-[10px] font-bold">
                  3
                </span>
                <span className="flex-1">Tap <strong>"Add"</strong> to confirm</span>
              </li>
            </ol>
          </div>
        );
      case 'android':
        return (
          <div className="space-y-2.5 sm:space-y-3">
            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              📱 Android Installation:
            </p>
            <ol className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[10px] font-bold">
                  1
                </span>
                <span className="flex-1">
                  Tap <MoreVertical className="inline h-3.5 w-3.5 mx-0.5" /> <strong>menu</strong> (⋮)
                </span>
              </li>
              <li className="flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white text-[10px] font-bold">
                  2
                </span>
                <span className="flex-1">
                  Select <strong>"Install app"</strong>
                </span>
              </li>
              <li className="flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-600 text-white text-[10px] font-bold">
                  3
                </span>
                <span className="flex-1">Confirm installation</span>
              </li>
            </ol>
          </div>
        );
      default:
        return (
          <div className="space-y-2.5 sm:space-y-3">
            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              💻 Desktop Installation:
            </p>
            <ol className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[10px] font-bold">
                  1
                </span>
                <span className="flex-1">
                  Find <Download className="inline h-3.5 w-3.5 mx-0.5" /> icon in address bar
                </span>
              </li>
              <li className="flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white text-[10px] font-bold">
                  2
                </span>
                <span className="flex-1">Click <strong>"Install"</strong></span>
              </li>
              <li className="flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-600 text-white text-[10px] font-bold">
                  3
                </span>
                <span className="flex-1">App added to desktop!</span>
              </li>
            </ol>
          </div>
        );
    }
  };

  // Don't show if not ready (unless manually triggered)
  if ((!showPrompt && !manualTrigger) || (isStandalone() && !manualTrigger)) {
    return null;
  }

  return (
    <>
      {/* Modern Compact Install Banner */}
      {!showInstructions && (
        <div className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-500">
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-blue-500/20 transition-all duration-300">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10" />
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 backdrop-blur-sm transition-all duration-200 z-10"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Compact Content */}
            <div className="relative p-3 sm:p-4">
              <div className="flex items-center gap-3">
                {/* Icon - smaller and more modern */}
                <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  {platform === 'ios' || platform === 'android' ? (
                    <Smartphone className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" />
                  ) : (
                    <Monitor className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" />
                  )}
                </div>

                {/* Text - more compact */}
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                    Install Nyambika
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                    Quick access • Offline mode
                  </p>
                </div>
              </div>

              {/* Actions - more compact layout */}
              <div className="flex gap-2 mt-3">
                {(isInstallable && deferredPrompt) || platform === 'desktop' ? (
                  <button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    {isInstalling ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="hidden sm:inline">Installing...</span>
                        <span className="sm:hidden">Wait...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Install</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowInstructions(true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>How to</span>
                  </button>
                )}
                
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium hover:bg-gray-200/80 dark:hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all active:scale-95"
                >
                  Later
                </button>
              </div>
            </div>

            {/* Loading progress bar */}
            {isInstalling && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-[shimmer_1.5s_ease-in-out_infinite]" 
                     style={{ width: '40%' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Installation Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowInstructions(false)}
          />
          
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
            {/* Compact Header with Gradient */}
            <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 sm:p-5 text-white overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    {platform === 'ios' || platform === 'android' ? (
                      <Smartphone className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <Monitor className="h-5 w-5 sm:h-6 sm:w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">Install Nyambika</h3>
                    <p className="text-xs sm:text-sm opacity-90">Get the full experience</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="p-2 rounded-full hover:bg-white/20 backdrop-blur-sm transition-all active:scale-90"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Compact Body */}
            <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto">
              {/* Benefits - More compact */}
              <div className="mb-4 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  Why install?
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                    <span>Home screen</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-purple-500" />
                    <span>Works offline</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-pink-500" />
                    <span>Faster loading</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                    <span>Native feel</span>
                  </div>
                </div>
              </div>

              {/* Platform Instructions - More compact */}
              {getPlatformInstructions()}

              {/* Browser Note - More compact */}
              {platform === 'ios' && (
                <div className="mt-3 p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
                  <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <span className="text-amber-500 text-sm">ℹ️</span>
                    <span><strong>Safari only:</strong> iOS installation requires Safari browser.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Compact Footer */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowInstructions(false)}
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all border border-gray-300 dark:border-gray-600 active:scale-95"
              >
                Close
              </button>
              {(isInstallable && deferredPrompt) && (
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                >
                  {isInstalling ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Wait...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Install Now</span>
                    </>
                  )}
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
