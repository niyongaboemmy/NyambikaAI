"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen pt-10">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-indigo-400/20 rounded-full blur-xl"
          animate={{
            scale: [1, 0.8, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-gray-700/30 shadow-2xl shadow-blue-500/10 dark:shadow-blue-400/5">
            <CardContent className="p-8 md:p-12">
              {/* 404 Animation */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
              >
                <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-4">
                  404
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-6xl mb-4"
                >
                  🤖
                </motion.div>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-4 mb-8"
              >
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Oops! Page Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-base">
                  The AI couldn't locate the page you're looking for. It might
                  have been moved, deleted, or the URL might be incorrect.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mt-4">
                  <strong>Tip:</strong> Check the URL for typos or use the
                  navigation menu to find what you're looking for.
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="w-full sm:w-auto bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>

                <Link href="/" className="w-full sm:w-auto">
                  <Button className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Or try these popular pages:
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link href="/companies">
                    <Button variant="ghost" size="sm" className="text-xs">
                      <ShoppingBag className="mr-1 h-3 w-3" />
                      Browse Stores
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Search className="mr-1 h-3 w-3" />
                      Search Products
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Profile
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
