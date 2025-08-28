'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function PageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [prevSearch, setPrevSearch] = useState(searchParams.toString());

  useEffect(() => {
    // Only show loading if the pathname or search params have changed
    if (pathname !== prevPathname || searchParams.toString() !== prevSearch) {
      setIsLoading(true);
      setPrevPathname(pathname);
      setPrevSearch(searchParams.toString());
      
      // Set a minimum loading time for better UX
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, prevPathname, prevSearch]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 h-1 z-[100] overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-blue-500 to-purple-600">
            <motion.div
              className="h-full bg-white/30"
              initial={{ width: '0%' }}
              animate={{
                width: ['0%', '70%', '100%'],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
