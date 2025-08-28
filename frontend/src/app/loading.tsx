'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 mx-4 space-y-4 text-center bg-card rounded-xl shadow-xl">
        <motion.div
          className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
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
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
