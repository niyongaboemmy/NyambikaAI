'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let timeout: NodeJS.Timeout;

    const handleStart = () => {
      // Clear any existing timeouts
      clearTimeout(timeout);
      // Show loading immediately
      setIsLoading(true);
      
      // React-safe DOM manipulation
      try {
        document.documentElement.classList.add('navigation-loading');
        document.documentElement.setAttribute('data-navigation-loading', 'true');
      } catch (e) {
        console.warn('Failed to set loading state:', e);
      }
      
      // Hide after 5s in case navigation fails
      timeout = setTimeout(() => {
        handleComplete();
      }, 5000);
    };

    const handleComplete = () => {
      clearTimeout(timeout);
      setIsLoading(false);
      
      // React-safe DOM cleanup
      try {
        document.documentElement.classList.remove('navigation-loading');
        document.documentElement.removeAttribute('data-navigation-loading');
      } catch (e) {
        console.warn('Failed to clear loading state:', e);
      }
    };

    // Listen to custom events from NavigationEvents
    const handleRouteChangeStart = () => handleStart();
    const handleRouteChangeComplete = () => handleComplete();
    const handleRouteChangeError = () => handleComplete();

    // Add event listeners with error handling
    try {
      window.addEventListener('routeChangeStart', handleRouteChangeStart);
      window.addEventListener('routeChangeComplete', handleRouteChangeComplete);
      window.addEventListener('routeChangeError', handleRouteChangeError);
    } catch (e) {
      console.warn('Failed to add navigation event listeners:', e);
    }

    // Clean up on unmount
    return () => {
      clearTimeout(timeout);
      try {
        window.removeEventListener('routeChangeStart', handleRouteChangeStart);
        window.removeEventListener('routeChangeComplete', handleRouteChangeComplete);
        window.removeEventListener('routeChangeError', handleRouteChangeError);
        // Ensure loading state is cleared on cleanup
        document.documentElement.classList.remove('navigation-loading');
        document.documentElement.removeAttribute('data-navigation-loading');
      } catch (e) {
        console.warn('Failed to clean up navigation listeners:', e);
      }
    };
  }, [pathname, searchParams]);

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-1 z-[100] overflow-hidden pointer-events-none"
      style={{
        opacity: isLoading ? 1 : 0,
        transition: 'opacity 200ms ease-in-out',
      }}
      aria-hidden="true"
    >
      <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-blue-500 to-purple-600">
        <div 
          className="h-full bg-white/30"
          style={{
            width: '100%',
            transform: isLoading ? 'translateX(0%)' : 'translateX(-100%)',
            transition: 'transform 10s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  );
}
