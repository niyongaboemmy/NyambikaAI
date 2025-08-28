"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  User,
  Settings,
  Heart,
  ShoppingBag,
  Star,
  Edit3,
  Camera,
  Loader2,
  Sparkles,
  TrendingUp,
  Shield,
  Bell,
  CreditCard,
  MapPin,
  Phone,
  Calendar,
  Activity,
  Zap,
  Brain,
  Target,
  Award,
  ChevronRight,
  LogOut,
  HelpCircle,
  Globe,
  Moon,
  Sun,
} from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/ui/form-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError } from "@/config/api";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { theme, actualTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { open } = useLoginPrompt();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    fullNameRw: "",
    email: "",
    phone: "",
    location: "",
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setUserInfo({
        name: user.name || "",
        fullNameRw: "",
        email: user.email || "",
        phone: user.phone || "",
        location: "",
      });
    }
  }, [user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: typeof userInfo) => {
      try {
        const response = await apiClient.put("/api/auth/profile", {
          fullName: profileData.name,
          fullNameRw: profileData.fullNameRw,
          phone: profileData.phone,
          location: profileData.location,
        });
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch user's favorites
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/api/favorites");
        return response.data;
      } catch (error) {
        console.error("Failed to fetch favorites:", handleApiError(error));
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  // Fetch user's orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get("/api/orders");
        return data;
      } catch (error) {
        console.error("Failed to fetch orders:", handleApiError(error));
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  // Fetch user's try-on sessions
  const { data: tryOnSessions = [], isLoading: tryOnLoading } = useQuery({
    queryKey: ["try-on-sessions"],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await apiClient.get("/api/try-on-sessions", {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response.data || [];
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn("Try-on sessions request timed out");
          return [];
        }
        // Check if the error is due to request cancellation (common during logout)
        if (error.code === 'ERR_CANCELED' || error.message === 'canceled') {
          console.warn("Try-on sessions request was canceled");
          return [];
        }
        console.error("Failed to fetch try-on sessions:", handleApiError(error));
        return [];
      }
    },
    enabled: isAuthenticated,
    retry: 1, // Reduce retries to avoid long wait times
    retryDelay: 2000, // Fixed 2 second delay
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(userInfo);
  };

  // Prompt login if not authenticated (avoid side effects during render)
  useEffect(() => {
    if (!isAuthenticated) {
      open();
    }
  }, [isAuthenticated, open]);

  // Page-level loading state for profile content
  const isPageLoading =
    !user || favoritesLoading || ordersLoading || tryOnLoading;

  // Early return for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  if (isPageLoading) {
    return (
      <>
        <main className="relative pt-11 sm:pt-12 pb-6 sm:pb-8">
          {/* Header skeleton */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* Main column */}
            <div className="flex-1 space-y-3 sm:space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/70 dark:bg-gray-900/60 rounded-xl border border-gray-200/60 dark:border-gray-800 p-3"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-10" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Profile card */}
              <div className="bg-white/70 dark:bg-gray-900/60 rounded-xl border border-gray-200/60 dark:border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-md" />
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div className="bg-white/70 dark:bg-gray-900/60 rounded-xl border border-gray-200/60 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Skeleton className="h-4 w-14 ml-auto" />
                        <Skeleton className="h-4 w-16 ml-auto rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 space-y-3">
              {/* Quick actions */}
              <div className="bg-white/70 dark:bg-gray-900/60 rounded-xl border border-gray-200/60 dark:border-gray-800 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-white/70 dark:bg-gray-900/60 rounded-xl border border-gray-200/60 dark:border-gray-800 p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>

              {/* Settings */}
              <div className="bg-white/70 dark:bg-gray-900/60 rounded-xl border border-gray-200/60 dark:border-gray-800 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Skeleton className="h-8 w-40 rounded-md" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3 w-4 rounded" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <ProtectedRoute>
      <main className="relative pt-11 sm:pt-12 pb-6 sm:pb-8">
        {/* Holographic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10">
          {/* AI Profile Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="p-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-ping opacity-20"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Profile Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your fashion journey with AI insights
                </p>
              </div>
            </div>
          </div>

          {/* Flex Layout for Better Space Management */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              {/* Main Content - Flexible */}
              <div className="flex-1 space-y-3 sm:space-y-4">
                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3">
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-2 sm:p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <div className="p-1 sm:p-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30">
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-black dark:text-white">
                        {favorites.length}
                      </p>
                      <p className="text-xs sm:text-xs text-gray-600 dark:text-gray-400">
                        Favorites
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-2 sm:p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-black dark:text-white">
                        {orders.length}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Orders
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-2 sm:p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30">
                          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-black dark:text-white">
                        {tryOnSessions.length}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Try-Ons
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-2 sm:p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-black dark:text-white">
                        95%
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Match Score
                      </p>
                    </CardContent>
                  </Card>
                </div>
                {/* Compact Profile Section with Flex Layout */}
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                  {/* Profile Info Card */}
                  <Card className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div>
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-700/10 to-slate-900/10 dark:from-slate-200 dark:to-slate-400 rounded-full flex items-center justify-center text-white dark:text-slate-900 text-lg sm:text-xl font-bold">
                            {userInfo.name.charAt(0).toUpperCase() || "U"}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-base sm:text-lg font-bold text-black dark:text-white">
                            {userInfo.name || "User"}
                          </h2>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {userInfo.email}
                          </p>
                          <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {userInfo.location || "Location not set"}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            isEditing ? handleSaveProfile() : setIsEditing(true)
                          }
                          size="sm"
                          className={`${
                            isEditing
                              ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          } border border-gray-200 dark:border-0 transition-all duration-200`}
                          disabled={updateProfileMutation.isPending}
                        >
                          <div>
                            {updateProfileMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit3 className="h-4 w-4" />
                            )}
                          </div>
                          <span>Edit</span>
                        </Button>
                      </div>

                      {isEditing && (
                        <div className="grid grid-cols-1 gap-2 sm:gap-3 animate-in slide-in-from-top-2 duration-300">
                          <FormInput
                            placeholder="Full Name"
                            value={userInfo.name}
                            onChange={(e) =>
                              setUserInfo({ ...userInfo, name: e.target.value })
                            }
                            icon={User}
                            className="text-sm w-full"
                          />
                          <FormInput
                            placeholder="Phone"
                            value={userInfo.phone}
                            onChange={(e) =>
                              setUserInfo({
                                ...userInfo,
                                phone: e.target.value,
                              })
                            }
                            icon={Phone}
                            className="text-sm w-full"
                          />
                          <FormInput
                            placeholder="Location"
                            value={userInfo.location}
                            onChange={(e) =>
                              setUserInfo({
                                ...userInfo,
                                location: e.target.value,
                              })
                            }
                            icon={MapPin}
                            className="text-sm w-full"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                        <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Recent Activity
                      </h3>
                    </div>
                    {orders.length > 0 ? (
                      <div className="space-y-1 sm:space-y-2">
                        {orders.slice(0, 2).map((order: any) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <ShoppingBag className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  Order #{order.id}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {new Date(
                                    order.createdAt || Date.now()
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-black dark:text-white">
                                RF {order.total}
                              </p>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                {order.status || "Processing"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          No recent orders
                        </p>
                        <Button
                          onClick={() => router.push("/")}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          Start Shopping
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:w-80 space-y-2 sm:space-y-3">
                {/* Quick Actions */}
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="relative p-2 sm:p-3">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="p-1 sm:p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        Quick Actions
                      </h3>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Button
                        onClick={() => router.push("/try-on")}
                        size="sm"
                        className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-sm text-sm py-2"
                      >
                        <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Try-On
                      </Button>
                      <Button
                        onClick={() => router.push("/favorites")}
                        size="sm"
                        className="w-full justify-start bg-gray-100 hover:bg-gray-200 text-black dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white text-sm py-2"
                      >
                        <Heart className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Favorites
                        <ChevronRight className="ml-auto h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => router.push("/orders")}
                        size="sm"
                        className="w-full justify-start bg-gray-100 hover:bg-gray-200 text-black dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white text-sm py-2"
                      >
                        <ShoppingBag className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Orders
                        <ChevronRight className="ml-auto h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Insights */}
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="relative p-2 sm:p-3">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="p-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30">
                        <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        Insights
                      </h3>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            Style Match
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          95% casual-chic
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            Trending
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Summer styles
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Settings */}
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-2 sm:p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Settings
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setTheme(actualTheme === "light" ? "dark" : "light")
                        }
                        className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                      >
                        <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                          {actualTheme === "light" ? (
                            <Moon className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                          ) : (
                            <Sun className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                          )}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {actualTheme === "light" ? "Dark Mode" : "Light Mode"}
                        </span>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30">
                          <LogOut className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-sm text-red-600 dark:text-red-400">
                          Sign Out
                        </span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
  );
}

export default Profile;
