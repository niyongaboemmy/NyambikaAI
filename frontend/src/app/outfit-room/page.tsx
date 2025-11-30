"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Sliders,
  Save,
  RotateCcw,
  Check,
  X,
  Shirt,
  User,
  Ruler,
  Tag,
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

interface UserStyleProfile {
  id: string;
  userId: string;
  favoriteColors: string[];
  favoriteCategories: string[];
  preferredBrands: string[];
  stylePreferences: Record<string, number>;
  bodyType?: string;
  skinTone?: string;
  aiInsights: Record<string, any>;
  lastAnalyzedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  nameRw?: string;
  icon?: string;
}

interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

interface StyleOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface BodyTypeOption {
  id: string;
  name: string;
  description: string;
}

interface SkinToneOption {
  id: string;
  name: string;
  description: string;
}

type ViewMode =
  | "grid"
  | "collections"
  | "analytics"
  | "recommendations"
  | "preferences";

export default function OutfitRoom() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
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

  // Fetch style profile
  const { data: styleProfile, isLoading: loadingProfile } =
    useQuery<UserStyleProfile | null>({
      queryKey: [API_ENDPOINTS.STYLE_PROFILE],
      queryFn: async () => {
        const response = await apiClient.get(API_ENDPOINTS.STYLE_PROFILE);
        return response.data;
      },
      enabled: !!user,
    });

  // Fetch categories for preferences
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORIES);
      return response.data;
    },
  });

  // Update style profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserStyleProfile>) => {
      const response = await apiClient.put(
        API_ENDPOINTS.STYLE_PROFILE,
        updates
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.STYLE_PROFILE],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.OUTFIT_RECOMMENDATIONS],
      });
    },
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

  // Preferences data
  const colors: ColorOption[] = [
    { id: "black", name: "Black", hex: "#000000" },
    { id: "white", name: "White", hex: "#FFFFFF" },
    { id: "red", name: "Red", hex: "#FF0000" },
    { id: "blue", name: "Blue", hex: "#0000FF" },
    { id: "green", name: "Green", hex: "#00FF00" },
    { id: "yellow", name: "Yellow", hex: "#FFFF00" },
    { id: "purple", name: "Purple", hex: "#800080" },
    { id: "pink", name: "Pink", hex: "#FFC0CB" },
    { id: "orange", name: "Orange", hex: "#FFA500" },
    { id: "brown", name: "Brown", hex: "#A52A2A" },
    { id: "gray", name: "Gray", hex: "#808080" },
    { id: "beige", name: "Beige", hex: "#F5F5DC" },
  ];

  const styleOptions: StyleOption[] = [
    {
      id: "casual",
      name: "Casual",
      description: "Everyday wear, relaxed outfits",
      icon: "👕",
    },
    {
      id: "formal",
      name: "Formal",
      description: "Business and professional attire",
      icon: "🤵",
    },
    {
      id: "party",
      name: "Party",
      description: "Special occasions and celebrations",
      icon: "🎉",
    },
    {
      id: "work",
      name: "Work",
      description: "Professional work environment",
      icon: "💼",
    },
    {
      id: "sport",
      name: "Sport",
      description: "Athletic and active wear",
      icon: "⚽",
    },
    {
      id: "beach",
      name: "Beach",
      description: "Vacation and seaside outfits",
      icon: "🏖️",
    },
    {
      id: "vintage",
      name: "Vintage",
      description: "Classic and retro styles",
      icon: "📻",
    },
    {
      id: "bohemian",
      name: "Bohemian",
      description: "Free-spirited and artistic",
      icon: "🌸",
    },
  ];

  const bodyTypes: BodyTypeOption[] = [
    { id: "slim", name: "Slim", description: "Petite and slender build" },
    { id: "athletic", name: "Athletic", description: "Fit and toned physique" },
    { id: "average", name: "Average", description: "Balanced proportions" },
    { id: "curvy", name: "Curvy", description: "Fuller figure with curves" },
    { id: "plus", name: "Plus Size", description: "Extended size range" },
  ];

  const skinTones: SkinToneOption[] = [
    { id: "fair", name: "Fair", description: "Light skin tone" },
    { id: "light", name: "Light", description: "Light to medium skin tone" },
    { id: "medium", name: "Medium", description: "Medium skin tone" },
    { id: "olive", name: "Olive", description: "Warm medium skin tone" },
    { id: "tan", name: "Tan", description: "Bronzed skin tone" },
    { id: "dark", name: "Dark", description: "Deep skin tone" },
  ];

  const occasions = [
    "Everyday",
    "Work",
    "Party",
    "Wedding",
    "Date",
    "Beach",
    "Sport",
    "Formal Event",
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            Sign in to access your Outfit Room
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create collections, track your style, and get personalized
            recommendations
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
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
          <div className="relative bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-blue-600/10 dark:from-purple-600/20 dark:via-blue-600/20 dark:to-blue-600/20 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-purple-200/30 dark:border-purple-500/30 overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-75" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div className="absolute inset-0 bg-purple-500/30 rounded-full blur animate-ping" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-blue-600 dark:from-purple-400 dark:via-blue-400 dark:to-blue-400 bg-clip-text text-transparent">
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
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Try-Ons
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {completedTryOns.length}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Favorites
                    </span>
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
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Collections
                    </span>
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
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Style Score
                    </span>
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
            {
              mode: "grid" as ViewMode,
              icon: <Grid3x3 className="h-4 w-4" />,
              label: "My Try-Ons",
            },
            {
              mode: "collections" as ViewMode,
              icon: <ShoppingBag className="h-4 w-4" />,
              label: "Collections",
            },
            {
              mode: "preferences" as ViewMode,
              icon: <Sliders className="h-4 w-4" />,
              label: "Preferences",
            },
            {
              mode: "analytics" as ViewMode,
              icon: <BarChart3 className="h-4 w-4" />,
              label: "Analytics",
            },
            {
              mode: "recommendations" as ViewMode,
              icon: <Star className="h-4 w-4" />,
              label: "For You",
            },
          ].map(({ mode, icon, label }) => (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                viewMode === mode
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
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
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
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
                                  <span className="text-white text-sm">
                                    {session.rating}
                                  </span>
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
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
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
                      <div className="aspect-[16/9] bg-gradient-to-br from-purple-400 to-blue-400 relative">
                        {collection.coverImageUrl && (
                          <img
                            src={collection.coverImageUrl}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1">
                          {collection.name}
                        </h3>
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
                              {
                                seasonIcons[
                                  collection.season as keyof typeof seasonIcons
                                ]
                              }
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
                                <span className="text-sm text-gray-500">
                                  {count} try-ons
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                                  style={{
                                    width: `${
                                      (count / analytics.totalTryOns) * 100
                                    }%`,
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
                              <div
                                key={month}
                                className="flex-1 flex flex-col items-center gap-2"
                              >
                                <div
                                  className="w-full bg-gradient-to-t from-purple-600 to-blue-600 rounded-t-lg"
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

          {viewMode === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/30">
                <div className="flex items-center gap-3 mb-6">
                  <Sliders className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-xl font-bold">Style Preferences</h3>
                </div>

                {loadingProfile ? (
                  <div className="space-y-6">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Favorite Categories */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Tag className="h-5 w-5 text-purple-600" />
                        Favorite Categories
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {categories.map((category) => {
                          const isSelected =
                            styleProfile?.favoriteCategories?.includes(
                              category.id
                            );
                          return (
                            <motion.button
                              key={category.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                const current =
                                  styleProfile?.favoriteCategories || [];
                                const updated = isSelected
                                  ? current.filter((id) => id !== category.id)
                                  : [...current, category.id];
                                updateProfileMutation.mutate({
                                  favoriteCategories: updated,
                                });
                              }}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                              }`}
                            >
                              <div className="text-center">
                                <div className="text-2xl mb-2">
                                  {category.icon || "👗"}
                                </div>
                                <div className="font-medium text-sm">
                                  {category.name}
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-purple-600 mx-auto mt-1" />
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Favorite Colors */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Palette className="h-5 w-5 text-blue-600" />
                        Favorite Colors
                      </h4>
                      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
                        {colors.map((color) => {
                          const isSelected =
                            styleProfile?.favoriteColors?.includes(color.id);
                          return (
                            <motion.button
                              key={color.id}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const current =
                                  styleProfile?.favoriteColors || [];
                                const updated = isSelected
                                  ? current.filter((c) => c !== color.id)
                                  : [...current, color.id];
                                updateProfileMutation.mutate({
                                  favoriteColors: updated,
                                });
                              }}
                              className={`relative h-12 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? "border-gray-800 dark:border-gray-200 scale-110"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            >
                              {isSelected && (
                                <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-lg" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Style Preferences */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Shirt className="h-5 w-5 text-blue-600" />
                        Style Preferences
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {styleOptions.map((style) => {
                          const currentPrefs =
                            styleProfile?.stylePreferences || {};
                          const isSelected = currentPrefs[style.id] > 0;
                          return (
                            <motion.div
                              key={style.id}
                              whileHover={{ scale: 1.02 }}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                              }`}
                              onClick={() => {
                                const current =
                                  styleProfile?.stylePreferences || {};
                                const updated = {
                                  ...current,
                                  [style.id]: isSelected ? 0 : 1,
                                };
                                updateProfileMutation.mutate({
                                  stylePreferences: updated,
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{style.icon}</span>
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {style.name}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {style.description}
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Body Type & Skin Tone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <User className="h-5 w-5 text-green-600" />
                          Body Type
                        </h4>
                        <div className="space-y-3">
                          {bodyTypes.map((bodyType) => {
                            const isSelected =
                              styleProfile?.bodyType === bodyType.id;
                            return (
                              <motion.button
                                key={bodyType.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() =>
                                  updateProfileMutation.mutate({
                                    bodyType: bodyType.id,
                                  })
                                }
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                  isSelected
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-green-300"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      isSelected
                                        ? "bg-green-500"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {bodyType.name}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {bodyType.description}
                                    </div>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Ruler className="h-5 w-5 text-orange-600" />
                          Skin Tone
                        </h4>
                        <div className="space-y-3">
                          {skinTones.map((skinTone) => {
                            const isSelected =
                              styleProfile?.skinTone === skinTone.id;
                            return (
                              <motion.button
                                key={skinTone.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() =>
                                  updateProfileMutation.mutate({
                                    skinTone: skinTone.id,
                                  })
                                }
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                  isSelected
                                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      isSelected
                                        ? "bg-orange-500"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {skinTone.name}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {skinTone.description}
                                    </div>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Occasions */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                        Shopping Occasions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {occasions.map((occasion) => {
                          const currentPrefs =
                            styleProfile?.stylePreferences || {};
                          const isSelected =
                            currentPrefs[
                              `occasion_${occasion
                                .toLowerCase()
                                .replace(" ", "_")}`
                            ] > 0;
                          return (
                            <motion.button
                              key={occasion}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                const current =
                                  styleProfile?.stylePreferences || {};
                                const key = `occasion_${occasion
                                  .toLowerCase()
                                  .replace(" ", "_")}`;
                                const updated = {
                                  ...current,
                                  [key]: isSelected ? 0 : 1,
                                };
                                updateProfileMutation.mutate({
                                  stylePreferences: updated,
                                });
                              }}
                              className={`px-4 py-2 rounded-full border-2 transition-all ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                              }`}
                            >
                              {occasion}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-center pt-6">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          // Trigger AI re-analysis
                          updateProfileMutation.mutate({
                            aiInsights: {
                              ...styleProfile?.aiInsights,
                              lastUpdated: new Date().toISOString(),
                              preferencesSetByUser: true,
                            },
                          });
                        }}
                        disabled={updateProfileMutation.isPending}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save className="h-5 w-5" />
                        {updateProfileMutation.isPending
                          ? "Saving..."
                          : "Save Preferences"}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
