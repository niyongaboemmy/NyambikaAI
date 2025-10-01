"use client";

import React, { useEffect, useState } from "react";
import { Download, Smartphone, Monitor } from "lucide-react";

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

interface InstallAppButtonProps {
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

/**
 * Persistent Install App Button
 * 
 * This component provides a always-visible button to trigger PWA installation.
 * It can be placed in navigation bars, headers, or anywhere in the app.
 * 
 * Usage:
 * - Default: <InstallAppButton />
 * - Compact: <InstallAppButton variant="compact" />
 * - Icon only: <InstallAppButton variant="icon-only" />
 * - Custom styles: <InstallAppButton className="your-classes" />
 */
export function InstallAppButton({ variant = 'default', className = '' }: InstallAppButtonProps) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    if (isIOS()) {
      setPlatform('ios');
    } else if (isAndroid()) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleClick = async () => {
    // Trigger the main InstallPrompt component by dispatching a custom event
    const event = new CustomEvent('show-install-prompt');
    window.dispatchEvent(event);

    // If we have the native prompt, trigger it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install prompt error:', error);
      }
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Get appropriate icon
  const Icon = platform === 'ios' || platform === 'android' ? Smartphone : Monitor;

  // Variant styles
  const baseStyles = "inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";
  
  const variantStyles = {
    'default': "px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg",
    'compact': "px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-sm hover:shadow-md",
    'icon-only': "p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg rounded-full"
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <button
      onClick={handleClick}
      className={combinedClassName}
      aria-label="Install Nyambika as an app"
      title="Install Nyambika as an app"
    >
      {variant === 'icon-only' ? (
        <Download className="h-5 w-5" />
      ) : (
        <>
          <Icon className="h-4 w-4" />
          <span>{variant === 'compact' ? 'Install' : 'Install App'}</span>
        </>
      )}
    </button>
  );
}

export default InstallAppButton;
