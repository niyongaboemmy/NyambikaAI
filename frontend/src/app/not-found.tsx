"use client";

import React from "react";
import { Button } from "@/components/custom-ui/button";
import { Card, CardContent } from "@/components/custom-ui/card";
import { Home, ArrowLeft, Search, ShoppingBag, Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-10">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-xl bg-muted-foreground/20"
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
          className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full blur-xl bg-muted-foreground/20"
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
          <Card className="backdrop-blur-xl bg-card/90 border border-border/50">
            <CardContent className="p-8 md:p-12">
              {/* 404 Animation */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
              >
                <div className="text-8xl md:text-9xl font-bold mb-4 text-foreground">
                  404
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="mb-4 flex justify-center"
                >
                  <Compass className="h-16 w-16 text-foreground" />
                </motion.div>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-4 mb-8"
              >
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {t("notFound.title")}
                </h1>
                <p className="text-muted-foreground text-base">
                  {t("notFound.desc")}
                </p>
                <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3 mt-4">
                  <strong>{t("notFound.tip")}</strong>
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
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("notFound.goBack")}
                </Button>

                <Link href="/" className="w-full sm:w-auto">
                  <Button className="w-full text-primary-foreground transition-all duration-300 bg-gold-600 hover:bg-gold-700">
                    <Home className="mr-2 h-4 w-4" />
                    {t("notFound.backHome")}
                  </Button>
                </Link>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-8 pt-6 border-t border-border"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  {t("notFound.quickLinksLabel")}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link href="/companies">
                    <Button variant="ghost" size="sm" className="text-xs">
                      <ShoppingBag className="mr-1 h-3 w-3" />
                      {t("notFound.browseStores")}
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Search className="mr-1 h-3 w-3" />
                      {t("notFound.searchProducts")}
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="text-xs">
                      {t("notFound.profile")}
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
