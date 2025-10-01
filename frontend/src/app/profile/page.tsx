"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  User,
  Settings,
  Heart,
  ShoppingBag,
  Edit3,
  Loader2,
  Sparkles,
  TrendingUp,
  MapPin,
  Phone,
  Activity,
  Zap,
  Target,
  Award,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Mail,
  Lock,
  Check,
  EyeIcon,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { Card, CardContent } from "@/components/custom-ui/card";
import { FormInput } from "@/components/custom-ui/form-input";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError, API_ENDPOINTS } from "@/config/api";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useChangePassword } from "@/contexts/ChangePasswordContext";
import { Skeleton } from "@/components/custom-ui/skeleton";
import { useRouter } from "next/navigation";
import UserWallet from "@/components/UserWallet";
import { useCompany } from "@/contexts/CompanyContext";
import { Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Animated AI Brain SVG Component
const AnimatedAIBrain = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="animate-pulse">
      <path
        d="M12 2C8.5 2 6 4.5 6 8c0 1.5 0.5 3 1.5 4L12 22l4.5-10c1-1 1.5-2.5 1.5-4 0-3.5-2.5-6-6-6z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
        className="animate-[pulse_3s_ease-in-out_infinite]"
      />
      <circle
        cx="12"
        cy="8"
        r="2"
        fill="currentColor"
        className="animate-[bounce_2s_ease-in-out_infinite]"
      />
      <path
        d="M9 8h6M10 6h4M10 10h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="animate-[fadeInOut_4s_ease-in-out_infinite]"
      />
    </g>
  </svg>
);

// Animated Neural Network SVG
const AnimatedNeuralNetwork = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <circle
        cx="6"
        cy="6"
        r="2"
        fill="currentColor"
        className="animate-[pulse_2s_ease-in-out_infinite]"
      />
      <circle
        cx="18"
        cy="6"
        r="2"
        fill="currentColor"
        className="animate-[pulse_2s_ease-in-out_infinite_0.5s]"
      />
      <circle
        cx="6"
        cy="18"
        r="2"
        fill="currentColor"
        className="animate-[pulse_2s_ease-in-out_infinite_1s]"
      />
      <circle
        cx="18"
        cy="18"
        r="2"
        fill="currentColor"
        className="animate-[pulse_2s_ease-in-out_infinite_1.5s]"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="currentColor"
        className="animate-[bounce_3s_ease-in-out_infinite]"
      />
      <path
        d="M6 6L12 12M18 6L12 12M6 18L12 12M18 18L12 12"
        stroke="currentColor"
        strokeWidth="1"
        className="animate-[fadeInOut_3s_ease-in-out_infinite]"
      />
    </g>
  </svg>
);

function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, actualTheme, setTheme } = useTheme();
  const { company, setModalOpen } = useCompany();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { open } = useLoginPrompt();
  const { openChangePassword } = useChangePassword();
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useLanguage();
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
        location: user.location || "",
      });
    }
  }, [user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: typeof userInfo) => {
      try {
        const response = await apiClient.put(API_ENDPOINTS.PROFILE, {
          fullName: profileData.name,
          fullNameRw: profileData.fullNameRw,
          phone: profileData.phone,
          location: profileData.location,
          email: profileData.email,
        });
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: (updatedUser) => {
      toast({
        title: t("profile.toast.updateSuccess.title"),
        description: t("profile.toast.updateSuccess.desc"),
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ME] });
    },
    onError: (error: any) => {
      toast({
        title: t("profile.toast.updateFail.title"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch user's favorites
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: [API_ENDPOINTS.FAVORITES],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.FAVORITES);
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
    queryKey: [API_ENDPOINTS.ORDERS],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(API_ENDPOINTS.ORDERS);
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

        const response = await apiClient.get(API_ENDPOINTS.TRY_ON_SESSIONS, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.data || [];
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.warn("Try-on sessions request timed out");
          return [];
        }
        // Check if the error is due to request cancellation (common during logout)
        if (error.code === "ERR_CANCELED" || error.message === "canceled") {
          console.warn("Try-on sessions request was canceled");
          return [];
        }
        console.error(
          "Failed to fetch try-on sessions:",
          handleApiError(error)
        );
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

  // Sign out handler
  const handleLogout = () => {
    logout();
    // Navigate to home after logout
    router.push("/");
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
        {/* Subtle Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-gray-100/50 dark:bg-gray-800/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 sm:w-48 h-24 sm:h-48 bg-gray-200/30 dark:bg-gray-700/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10">
          {/* Profile Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="p-3 sm:p-3 rounded-full bg-blue-600 shadow-lg">
                  <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {t("profile.title")}
                </h1>
                <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">
                  {t("profile.subtitle")}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {t("profile.active")}
                </span>
              </div>
            </div>
          </div>

          {/* Flex Layout for Better Space Management */}
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 px-2 sm:px-0">
            {/* Main Content - Flexible */}
            <div className="flex-1 space-y-3 sm:space-y-4">
              {/* Stats Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-2 sm:p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                        <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-rose-600 dark:text-rose-400" />
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {favorites.length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("profile.stats.favorites")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-2 sm:p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {orders.length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("profile.stats.orders")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-2 sm:p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {tryOnSessions.length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("profile.stats.tryOns")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-2 sm:p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <Target className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      92%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("profile.stats.matchScore")}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {/* Compact Profile Section with Flex Layout */}
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                {/* Profile Info Card */}
                <Card className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                          <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          {userInfo.name || t("profile.user.fallback")}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 truncate">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{userInfo.email}</span>
                        </p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">
                            {userInfo.location || t("profile.location.notSet")}
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
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        } transition-all duration-200 border border-gray-200 dark:border-gray-700 px-3 py-2 sm:px-4 flex-shrink-0 w-full sm:w-auto`}
                        disabled={updateProfileMutation.isPending}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {updateProfileMutation.isPending ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                          <span className="text-sm">
                            {isEditing
                              ? t("profile.btn.save")
                              : t("profile.btn.edit")}
                          </span>
                        </div>
                      </Button>
                    </div>

                    {isEditing && (
                      <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 gap-3">
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
                            placeholder="Email"
                            type="email"
                            value={userInfo.email}
                            onChange={(e) =>
                              setUserInfo({
                                ...userInfo,
                                email: e.target.value,
                              })
                            }
                            icon={Mail}
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

                        {/* Mobile Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:hidden">
                          <Button
                            onClick={handleSaveProfile}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                            disabled={updateProfileMutation.isPending}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {updateProfileMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              <span>{t("profile.btn.saveChanges")}</span>
                            </div>
                          </Button>
                          <Button
                            onClick={() => setIsEditing(false)}
                            variant="outline"
                            className="flex-1"
                          >
                            {t("profile.btn.cancel")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Wallet */}
              <UserWallet />

              {/* Recent Activity */}
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t("profile.recentActivity")}
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
                                {t("orders.order")} #{order.id}
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
                        {t("profile.noRecentOrders")}
                      </p>
                      <Button
                        onClick={() => router.push("/")}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        {t("profile.startShopping")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 xl:w-96 space-y-3 sm:space-y-4">
              {/* Quick Actions */}
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                      {t("profile.quickActions")}
                    </h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Button
                      onClick={() => router.push("/try-on")}
                      size="sm"
                      className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white text-sm py-3 rounded-lg transition-all duration-200"
                    >
                      <Sparkles className="mr-3 h-4 w-4" />
                      {t("profile.action.tryOn")}
                    </Button>
                    <Button
                      onClick={() => router.push("/try-on-history")}
                      size="sm"
                      className="w-full justify-between bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 text-sm py-3 rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center">
                        <EyeIcon className="mr-3 h-4 w-4" />
                        Try-On History ({tryOnSessions.length})
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => router.push("/favorites")}
                      size="sm"
                      className="w-full justify-between bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 text-sm py-3 rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center">
                        <Heart className="mr-3 h-4 w-4" />
                        {t("profile.action.favorites")}
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => router.push("/orders")}
                      size="sm"
                      className="w-full justify-between bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 text-sm py-3 rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center">
                        <ShoppingBag className="mr-3 h-4 w-4" />
                        {t("profile.action.orders")}
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    {user?.role === "producer" && (
                      <Button
                        onClick={() => setModalOpen(true)}
                        size="sm"
                        className="w-full justify-start bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white text-sm py-3 rounded-lg transition-all duration-200 mt-2"
                      >
                        <Building2 className="mr-3 h-4 w-4" />
                        Update Company
                      </Button>
                    )}
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
                  <div className="flex items-center justify-between mt-2 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setTheme(actualTheme === "light" ? "dark" : "light")
                      }
                      className="w-full flex justify-start items-center gap-2 p-2 pr-3 bg-blue-50 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-lg transition-all"
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
                  {/* Change Password */}
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={openChangePassword}
                      className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white text-sm py-3 rounded-lg transition-all duration-200"
                    >
                      <Lock className="mr-3 h-4 w-4" />
                      Open Change Password
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full flex justify-between items-center mt-2 p-2 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30">
                        <LogOut className="h-3 w-3 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm text-red-600 dark:text-red-400">
                        Sign Out
                      </span>
                    </div>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default Profile;
