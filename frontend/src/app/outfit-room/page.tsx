"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Grid3x3,
  Heart,
  TrendingUp,
  Share2,
  Plus,
  Eye,
  Calendar,
  Sun,
  Cloud,
  Snowflake,
  Flower2,
  BarChart3,
  Palette,
  ShoppingBag,
  Star,
  Settings,
} from "lucide-react";
import { apiClient, API_ENDPOINTS, handleApiError } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface TryOnSession {
  id: string;
  userId: string;
  customerImageUrl: string;
  productId?: string;
  tryOnImageUrl?: string;
  fitRecommendation?: string;
  status: string;
  isFavorite?: boolean;
  notes?: string;
  rating?: number;
  createdAt: string;
}

interface OutfitCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  occasion?: string;
  season?: string;
  coverImageUrl?: string;
  isPublic: boolean;
  likes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface StyleAnalytics {
  totalTryOns: number;
  totalFavorites: number;
  totalOutfits: number;
  categoryBreakdown: Record<string, number>;
  monthlyActivity: Record<string, number>;
  recentActivity: TryOnSession[];
}

type ViewMode = "grid" | "collections" | "analytics" | "recommendations";

export default function OutfitRoom() {
  const { user } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  // Fetch try-on sessions
  const { data: tryOnSessions = [], isLoading: loadingSessions } = useQuery<
    TryOnSession[]
  >({
    queryKey: [API_ENDPOINTS.TRY_ON_SESSIONS],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.TRY_ON_SESSIONS);
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch outfit collections
  const { data: collections = [], isLoading: loadingCollections } = useQuery<
    OutfitCollection[]
  >({
    queryKey: [API_ENDPOINTS.OUTFIT_COLLECTIONS],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.OUTFIT_COLLECTIONS);
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch style analytics
  const { data: analytics, isLoading: loadingAnalytics } =
    useQuery<StyleAnalytics>({
      queryKey: [API_ENDPOINTS.STYLE_ANALYTICS],
      queryFn: async () => {
        const response = await apiClient.get(API_ENDPOINTS.STYLE_ANALYTICS);
        return response.data;
      },
      enabled: !!user,
    });

  // Fetch recommendations
  const { data: recommendations, isLoading: loadingRecommendations } =
    useQuery<any>({
      queryKey: [API_ENDPOINTS.OUTFIT_RECOMMENDATIONS],
      queryFn: async () => {
        const response = await apiClient.get(
          API_ENDPOINTS.OUTFIT_RECOMMENDATIONS
        );
        return response.data;
      },
      enabled: !!user,
    });

  const seasonIcons = {
    spring: <Flower2 className="h-4 w-4" />,
    summer: <Sun className="h-4 w-4" />,
    fall: <Cloud className="h-4 w-4" />,
    winter: <Snowflake className="h-4 w-4" />,
  };

  const favoriteTryOns = tryOnSessions.filter((session) => session.isFavorite);
  const completedTryOns = tryOnSessions.filter(
    (session) => session.status === "completed" && session.tryOnImageUrl
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to access your Outfit Room</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create collections, track your style, and get personalized recommendations
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-3 md:px-0">
        {/* Hero Header with AI Styling */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 dark:from-purple-600/20 dark:via-pink-600/20 dark:to-blue-600/20 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-purple-200/30 dark:border-purple-500/30 overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-75" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div className="absolute inset-0 bg-purple-500/30 rounded-full blur animate-ping" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
                  My Outfit Room
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                Your personalized AI-powered fashion wardrobe
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-purple-200/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Grid3x3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Try-Ons</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {completedTryOns.length}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-pink-200/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Favorites</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {favoriteTryOns.length}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Collections</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {collections.length}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-green-200/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Style Score</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics ? Math.min(100, analytics.totalTryOns * 5) : 0}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* View Mode Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { mode: "grid" as ViewMode, icon: <Grid3x3 className="h-4 w-4" />, label: "My Try-Ons" },
            { mode: "collections" as ViewMode, icon: <ShoppingBag className="h-4 w-4" />, label: "Collections" },
            { mode: "analytics" as ViewMode, icon: <BarChart3 className="h-4 w-4" />, label: "Analytics" },
            { mode: "recommendations" as ViewMode, icon: <Star className="h-4 w-4" />, label: "For You" },
          ].map(({ mode, icon, label }) => (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                viewMode === mode
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "bg-white/50 dark:bg-black/30 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content based on view mode */}
        <AnimatePresence mode="wait">
          {viewMode === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {loadingSessions ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : completedTryOns.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No try-ons yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start trying on products to build your wardrobe
                  </p>
                  <button
                    onClick={() => router.push("/try-on")}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Start Try-On
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {completedTryOns.map((session) => (
                    <motion.div
                      key={session.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg"
                    >
                      <img
                        src={session.tryOnImageUrl || "/placeholder-tryon.jpg"}
                        alt="Try-on result"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {session.isFavorite && (
                                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                              )}
                              {session.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-white text-sm">{session.rating}</span>
                                </div>
                              )}
                            </div>
                            <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
                              <Eye className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {viewMode === "collections" && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <button
                  onClick={() => {
                    /* TODO: Open create collection modal */
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Collection</span>
                </button>
              </div>

              {collections.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No collections yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create collections to organize your favorite outfits
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collections.map((collection) => (
                    <motion.div
                      key={collection.id}
                      whileHover={{ scale: 1.03, y: -5 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="aspect-[16/9] bg-gradient-to-br from-purple-400 to-pink-400 relative">
                        {collection.coverImageUrl && (
                          <img
                            src={collection.coverImageUrl}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1">{collection.name}</h3>
                        {collection.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {collection.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {collection.occasion && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {collection.occasion}
                            </span>
                          )}
                          {collection.season && (
                            <span className="flex items-center gap-1">
                              {seasonIcons[collection.season as keyof typeof seasonIcons]}
                              {collection.season}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {viewMode === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {loadingAnalytics ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Category Breakdown */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-600" />
                      Category Preferences
                    </h3>
                    <div className="space-y-3">
                      {analytics?.categoryBreakdown &&
                        Object.entries(analytics.categoryBreakdown)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([category, count]) => (
                            <div key={category}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {category}
                                </span>
                                <span className="text-sm text-gray-500">{count} try-ons</span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                  style={{
                                    width: `${(count / analytics.totalTryOns) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>

                  {/* Monthly Activity */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Activity Over Time
                    </h3>
                    <div className="flex items-end gap-2 h-32">
                      {analytics?.monthlyActivity &&
                        Object.entries(analytics.monthlyActivity)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .slice(-6)
                          .map(([month, count]) => {
                            const maxCount = Math.max(
                              ...Object.values(analytics.monthlyActivity)
                            );
                            return (
                              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                  className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg"
                                  style={{
                                    height: `${(count / maxCount) * 100}%`,
                                    minHeight: count > 0 ? "10%" : "0%",
                                  }}
                                />
                                <span className="text-xs text-gray-500">
                                  {month.slice(5)}
                                </span>
                              </div>
                            );
                          })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {viewMode === "recommendations" && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {loadingRecommendations ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div>
                  {recommendations?.insights && (
                    <div className="mb-6 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl p-6 border border-purple-200/30">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        AI Style Insights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            Top Categories:
                          </p>
                          {recommendations.insights.topCategories
                            .slice(0, 3)
                            .map(([category, count]: [string, number]) => (
                              <p key={category} className="text-gray-900 dark:text-white">
                                • {category} ({count} try-ons)
                              </p>
                            ))}
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            Favorite Colors:
                          </p>
                          {recommendations.insights.favoriteColors
                            .slice(0, 3)
                            .map(([color, count]: [string, number]) => (
                              <p key={color} className="text-gray-900 dark:text-white">
                                • {color} ({count} items)
                              </p>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-4">Recommended for You</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {recommendations?.recommendations?.map((product: any) => (
                      <motion.div
                        key={product.id}
                        whileHover={{ scale: 1.05, y: -5 }}
                        onClick={() => router.push(`/product/${product.id}`)}
                        className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg"
                      >
                        <img
                          src={product.imageUrl || "/placeholder.jpg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className="text-white font-medium text-sm mb-1">
                              {product.name}
                            </p>
                            <p className="text-white/80 text-xs">
                              {product.price} RWF
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
