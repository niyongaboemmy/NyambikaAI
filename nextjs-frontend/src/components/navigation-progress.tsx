'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleStart = () => {
      // Clear any existing timeouts
      clearTimeout(timeout);
      // Show loading immediately
      setIsLoading(true);
      document.documentElement.setAttribute('data-navigation-loading', 'true');
      
      // Hide after 5s in case navigation fails
      timeout = setTimeout(() => {
        handleComplete();
      }, 5000);
    };

    const handleComplete = () => {
      clearTimeout(timeout);
      setIsLoading(false);
      document.documentElement.removeAttribute('data-navigation-loading');
    };

    // Listen to custom events from NavigationEvents
    const handleRouteChangeStart = () => handleStart();
    const handleRouteChangeComplete = () => handleComplete();
    const handleRouteChangeError = () => handleComplete();

    // Add event listeners
    window.addEventListener('routeChangeStart', handleRouteChangeStart);
    window.addEventListener('routeChangeComplete', handleRouteChangeComplete);
    window.addEventListener('routeChangeError', handleRouteChangeError);

    // Clean up on unmount
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('routeChangeStart', handleRouteChangeStart);
      window.removeEventListener('routeChangeComplete', handleRouteChangeComplete);
      window.removeEventListener('routeChangeError', handleRouteChangeError);
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
