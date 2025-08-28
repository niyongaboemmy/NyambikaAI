"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { TrendingUp, Star, Sparkles, Package, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient, handleApiError } from "@/config/api";

// Hook to fetch companies data
const useCompanies = () => {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/api/companies");
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  });
};

// Define types
interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  logoUrl?: string;
}

interface CompanyMetrics {
  performanceScore: number;
  totalProducts: number;
  monthlyViews: number;
  rating: string;
  growth: number;
  isTopPerformer: boolean;
  isTrending: boolean;
  badge: string;
}

interface CompanyWithMetrics extends Company {
  metrics: CompanyMetrics;
}

// Mock performance data - in real app, this would come from analytics API
const generateCompanyMetrics = (company: Company): CompanyMetrics => {
  const baseScore = Math.floor(Math.random() * 30) + 70; // 70-100 range
  return {
    performanceScore: baseScore,
    totalProducts: Math.floor(Math.random() * 50) + 10,
    monthlyViews: Math.floor(Math.random() * 10000) + 1000,
    rating: (4.0 + Math.random() * 1.0).toFixed(1),
    growth: Math.floor(Math.random() * 40) + 5, // 5-45% growth
    isTopPerformer: baseScore >= 85,
    isTrending: Math.random() > 0.7,
    badge:
      baseScore >= 95
        ? "Elite"
        : baseScore >= 85
        ? "Premium"
        : baseScore >= 75
        ? "Rising Star"
        : "Growing",
  };
};

export default function Companies() {
  const { data: companies = [], isLoading } = useCompanies();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "performance" | "trending">(
    "performance"
  );

  const companiesWithMetrics = useMemo(() => {
    return companies.map(
      (company: Company): CompanyWithMetrics => ({
        ...company,
        metrics: generateCompanyMetrics(company),
      })
    );
  }, [companies]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let result = companiesWithMetrics;

    if (term) {
      result = result.filter((c: CompanyWithMetrics) => {
        return [c.name, c.email, c.phone, c.location]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      });
    }

    // Sort by selected criteria
    result.sort((a: CompanyWithMetrics, b: CompanyWithMetrics) => {
      switch (sortBy) {
        case "performance":
          return b.metrics.performanceScore - a.metrics.performanceScore;
        case "trending":
          return (
            (b.metrics.isTrending ? 1 : 0) - (a.metrics.isTrending ? 1 : 0)
          );
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [companiesWithMetrics, q, sortBy]);

  if (isLoading) {
    return (
      <div className="pt-12">
        <div className="relative overflow-hidden">
          {/* AI-Motivated Animated Background */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute bottom-10 right-10 w-56 h-56 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-bounce"
              style={{ animationDuration: "3s" }}
            />
          </div>

          <main className="relative z-10 pt-10 sm:pt-12">
            {/* Hero Header Skeleton */}
            <div className="text-center mb-8">
              <Skeleton className="h-8 w-48 mx-auto mb-3 rounded-xl" />
              <Skeleton className="h-4 w-64 mx-auto mb-6 rounded-lg" />

              {/* Stats Skeleton */}
              <div className="flex justify-center items-center gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-8 rounded" />
                    <Skeleton className="h-3 w-12 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Search Skeleton */}
            <div className="max-w-md mx-auto mb-6 px-4">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>

            {/* Sort Controls Skeleton */}
            <div className="flex justify-center gap-2 mb-8">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-16 rounded-lg" />
              ))}
            </div>

            {/* Companies Grid Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4">
              {[...Array(12)].map((_, index) => (
                <motion.div
                  key={index}
                  className="bg-white/90 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Company Logo Skeleton */}
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-blue-100 dark:from-gray-700 dark:to-gray-600 animate-pulse flex items-center justify-center">
                      <Sparkles
                        className="h-6 w-6 text-blue-400 animate-spin"
                        style={{ animationDuration: "2s" }}
                      />
                    </div>
                  </div>

                  {/* Company Info Skeleton */}
                  <div className="text-center space-y-2">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-3 w-3/4 mx-auto rounded" />

                    {/* Metrics Skeleton */}
                    <div className="flex justify-center gap-2 mt-3">
                      <Skeleton className="h-3 w-8 rounded" />
                      <Skeleton className="h-3 w-12 rounded" />
                    </div>

                    {/* Button Skeleton */}
                    <Skeleton className="h-8 w-full rounded-xl mt-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-10">
      <div className="w-full relative overflow-hidden">
        {/* Enhanced Animated Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Floating AI Orbs with Enhanced Animations */}
          <motion.div
            className="absolute top-20 left-16 w-32 h-32 bg-gradient-to-r from-blue-400/15 via-cyan-400/10 to-teal-400/15 rounded-full blur-2xl"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400/12 via-pink-400/8 to-rose-400/12 rounded-full blur-xl"
            animate={{
              y: [0, 15, 0],
              x: [0, -15, 0],
              rotate: [0, 180, 360],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-r from-emerald-400/10 via-green-400/8 to-lime-400/10 rounded-full blur-xl"
            animate={{
              y: [0, -25, 0],
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-r from-indigo-400/12 via-blue-400/8 to-cyan-400/12 rounded-full blur-2xl"
            animate={{
              y: [0, 20, 0],
              x: [0, 20, 0],
              rotate: [0, -90, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Animated Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${
                i % 3 === 0
                  ? "bg-blue-400/20"
                  : i % 3 === 1
                  ? "bg-purple-400/20"
                  : "bg-pink-400/20"
              } blur-sm`}
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.sin(i) * 50, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}

          {/* Animated Grid Pattern */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.05)_1px,transparent_0)] [background-size:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.08)_1px,transparent_0)]"
            animate={{
              backgroundPosition: ["0px 0px", "24px 24px", "0px 0px"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        <main className="relative z-10 pt-4 pb-8">
          {/* Minimal Header */}
          <motion.div
            className="text-center mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-1">
              ✨ AI Fashion Brands
            </h1>

            <motion.p
              className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-3 max-w-lg mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              🇷🇼 Rwanda's innovative fashion entrepreneurs
            </motion.p>

            {/* Minimal Stats */}
            <motion.div
              className="flex justify-center items-center gap-2 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-1 px-2 py-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {filtered.length}
                </span>
              </div>

              <div className="flex items-center gap-1 px-2 py-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full">
                <Star className="w-2.5 h-2.5 text-green-600 fill-current" />
                <span className="font-medium text-green-700 dark:text-green-300">
                  {
                    filtered.filter(
                      (c: CompanyWithMetrics) => c.metrics.isTopPerformer
                    ).length
                  }
                </span>
              </div>

              <div className="flex items-center gap-1 px-2 py-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full">
                <TrendingUp className="w-2.5 h-2.5 text-purple-600" />
                <span className="font-medium text-purple-700 dark:text-purple-300">
                  {
                    filtered.filter(
                      (c: CompanyWithMetrics) => c.metrics.isTrending
                    ).length
                  }
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Compact Search and Sort */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Refactored Search Input */}
            <div className="w-full sm:w-auto max-w-sm">
              <div className="relative group">
                {/* Search Icon */}
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>

                {/* Input Field */}
                <Input
                  type="text"
                  placeholder="Search brands..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white/95 dark:bg-gray-800/95 border border-gray-200/60 dark:border-gray-700/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all duration-200 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow-md"
                />

                {/* Clear Button */}
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-150"
                    aria-label="Clear search"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}

                {/* Focus Glow Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />
              </div>
            </div>

            {/* Compact Sort Controls */}
            <div className="flex gap-1 p-0.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              {[
                { key: "name", label: "Name", icon: "🏷️" },
                { key: "performance", label: "Score", icon: "🤖" },
                { key: "trending", label: "Hot", icon: "🔥" },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sortBy === key
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60"
                  }`}
                >
                  <span className="mr-1">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Compact Companies Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {filtered.map((company: CompanyWithMetrics, index: number) => (
              <motion.div
                key={company.id}
                className="group relative bg-white/95 dark:bg-gray-900/80 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer overflow-hidden"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.05,
                  duration: 0.3,
                }}
                whileHover={{
                  y: -4,
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                onClick={() => router.push(`/store/${company.id}`)}
              >
                {/* Subtle Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-pink-500/3 rounded-2xl opacity-0 transition-opacity duration-300" />

                {/* Trending Badge */}
                {company.metrics.isTrending && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                      🔥
                    </div>
                  </div>
                )}

                {/* Compact Logo */}
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/50 dark:via-purple-900/50 dark:to-pink-900/50 flex items-center justify-center overflow-hidden border border-white/50 dark:border-gray-700/50 group-hover:scale-105 transition-transform duration-200">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={company.name}
                          className="min-w-full min-h-full object-cover"
                        />
                      ) : (
                        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {company.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Compact Performance Ring */}
                    <div className="absolute -top-0.5 -right-0.5">
                      <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 transform -rotate-90">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            className="text-gray-200 dark:text-gray-700"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 10}`}
                            strokeDashoffset={`${
                              2 *
                              Math.PI *
                              10 *
                              (1 - company.metrics.performanceScore / 100)
                            }`}
                            className={`transition-all duration-500 ${
                              company.metrics.performanceScore >= 90
                                ? "text-green-500"
                                : company.metrics.performanceScore >= 75
                                ? "text-blue-500"
                                : "text-yellow-500"
                            }`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-gray-700 dark:text-gray-300">
                            {company.metrics.performanceScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Info */}
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {company.name}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    📍 {company.location || "Rwanda"}
                  </p>

                  {/* Compact Metrics */}
                  <div className="flex justify-center items-center gap-2 text-xs pb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="font-medium text-yellow-700 dark:text-yellow-300">
                        {company.metrics.rating}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-blue-500" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        {company.metrics.totalProducts}
                      </span>
                    </div>
                  </div>

                  {/* Compact Button */}
                  <button className="w-full py-2 px-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md">
                    View Store
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {filtered.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No brands found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
