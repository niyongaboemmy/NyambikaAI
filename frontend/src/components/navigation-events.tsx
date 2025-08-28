'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Dispatch route change start event
    window.dispatchEvent(new Event('routeChangeStart'));
    
    // Dispatch route change complete with a small delay
    // to ensure the page has started rendering
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('routeChangeComplete'));
    }, 0);
    
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
