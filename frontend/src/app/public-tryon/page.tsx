"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Eye,
  ArrowLeft,
  Grid3X3,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  TrendingUp,
  Clock,
  RefreshCw,
  User,
  ShoppingBag,
  Loader2,
  Search,
  Share2,
  Download,
  MessageCircle,
  Bookmark,
  X,
  Trash2,
  Send,
  Sparkles,
  Zap,
  Star,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, API_ENDPOINTS, handleApiError } from "@/config/api";

// API call using apiClient for authentication
const fetchTryOnSessionsWithAuth = async (params: URLSearchParams) => {
  try {
    // Build query string including all params
    const queryString = params.toString();
    const response = await apiClient.get(`/api/try-on/sessions?${queryString}`);

    // Transform backend response to match expected format
    const sessions = response.data?.sessions || [];

    // Enrich sessions with additional data (in real app, this might come from separate queries)
    const enrichedSessions = sessions.map((session: any) => ({
      id: session.id,
      productId: session.productId,
      productName: session.productName || "Product",
      productImage: session.productImage || "/images/placeholder-product.jpg",
      customerImage: session.customerImageUrl,
      resultImage: session.tryOnImageUrl || session.customerImageUrl,
      status: session.status,
      createdAt: session.createdAt,
      userId: session.userId,
      userName: "",
      userAvatar: "https://picsum.photos/seed/avatar/100/100.jpg",
      likes: Math.floor(Math.random() * 50),
      views: Math.floor(Math.random() * 200),
    }));

    return {
      success: true,
      data: enrichedSessions,
      pagination: {
        page: 1,
        limit: 20,
        total: enrichedSessions.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  } catch (error) {
    console.error("Error fetching try-on sessions:", error);
    throw error;
  }
};

interface TryOnSession {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  customerImage: string;
  resultImage: string;
  status: "completed" | "processing" | "failed";
  createdAt: string;
  userId: string;
  userName: string;
  userAvatar: string;
  likes: number;
  views: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface TryOnRoomResponse {
  success: boolean;
  data: TryOnSession[];
  pagination: PaginationData;
  filters: {
    productId?: string;
    productName?: string;
    productImageUrl?: string;
    searchQuery?: string;
    sortBy: string;
    sortOrder: string;
  };
}

export default function PublicTryOn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = searchParams.get("product-id");
  const productName = searchParams.get("product-name")
    ? decodeURIComponent(searchParams.get("product-name")!)
    : null;
  const productImageUrl = searchParams.get("product-image-url")
    ? decodeURIComponent(searchParams.get("product-image-url")!)
    : null;

  const [sessions, setSessions] = useState<TryOnSession[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TryOnSession | null>(
    null
  );
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [likedSessions, setLikedSessions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(
    new Set()
  );
  const [savedSessions, setSavedSessions] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSession, setShareSession] = useState<TryOnSession | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newSessionAlert, setNewSessionAlert] = useState<TryOnSession | null>(
    null
  );
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Group sessions by product (for bottom gallery)
  const productsWithSessions = Array.from(
    new Map(
      sessions.map((session) => [
        session.productId,
        {
          id: session.productId,
          name: session.productName,
          image: session.productImage,
          sessions: sessions.filter((s) => s.productId === session.productId),
        },
      ])
    ).values()
  );

  const fetchSessions = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sort: sortBy,
        order: sortOrder,
      });

      if (productId) {
        params.append("product-id", productId);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetchTryOnSessionsWithAuth(params);

      if (response.success) {
        // For page 1, replace sessions. For page > 1, append sessions
        if (page === 1) {
          setSessions(response.data);
        } else {
          setSessions((prev) => [...prev, ...response.data]);
        }
        setPagination(response.pagination);
        setLastUpdate(new Date()); // Update the last refresh time
      } else {
        setError("Failed to load try-on sessions");
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load try-on sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 when filters change
    fetchSessions(1);
  }, [productId, sortBy, sortOrder, searchQuery]);

  // Track view when session is selected
  useEffect(() => {
    if (selectedSession) {
      trackView(selectedSession.id);
    }
  }, [selectedSession?.id]);

  const handleLike = async (sessionId: string) => {
    try {
      const isLiked = likedSessions.has(sessionId);
      const endpoint = isLiked
        ? `/api/try-on-sessions/${sessionId}/like`
        : `/api/try-on-sessions/${sessionId}/like`;
      const method = isLiked ? "DELETE" : "POST";

      const response = await apiClient({
        method,
        url: endpoint,
      } as any);

      if (response.data?.success) {
        const newLikedSessions = new Set(likedSessions);
        if (isLiked) {
          newLikedSessions.delete(sessionId);
        } else {
          newLikedSessions.add(sessionId);
        }
        setLikedSessions(newLikedSessions);

        // Update local session data
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? { ...session, likes: response.data.likes }
              : session
          )
        );
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleSave = async (sessionId: string) => {
    try {
      const isSaved = savedSessions.has(sessionId);
      const endpoint = `/api/try-on-sessions/${sessionId}/save`;
      const method = isSaved ? "DELETE" : "POST";

      const response = await apiClient({
        method,
        url: endpoint,
      } as any);

      if (response.data?.success) {
        const newSavedSessions = new Set(savedSessions);
        if (isSaved) {
          newSavedSessions.delete(sessionId);
        } else {
          newSavedSessions.add(sessionId);
        }
        setSavedSessions(newSavedSessions);
      }
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  const handleBookmark = async (sessionId: string) => {
    const newBookmarkedSessions = new Set(bookmarkedSessions);
    if (bookmarkedSessions.has(sessionId)) {
      newBookmarkedSessions.delete(sessionId);
    } else {
      newBookmarkedSessions.add(sessionId);
    }
    setBookmarkedSessions(newBookmarkedSessions);
  };

  const trackView = async (sessionId: string) => {
    try {
      await apiClient.post(`/api/try-on-sessions/${sessionId}/view`);
    } catch (err) {
      console.error("Error tracking view:", err);
    }
  };

  const loadComments = async (sessionId: string) => {
    try {
      setLoadingComments(true);
      const response = await apiClient.get(
        `/api/try-on-sessions/${sessionId}/comments`
      );
      if (response.data?.success) {
        setComments(response.data.comments || []);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async (sessionId: string) => {
    if (!commentText.trim()) return;

    try {
      setPostingComment(true);
      const response = await apiClient.post(
        `/api/try-on-sessions/${sessionId}/comments`,
        { text: commentText }
      );

      if (response.data?.success) {
        setCommentText("");
        await loadComments(sessionId);
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (sessionId: string, commentId: string) => {
    try {
      const response = await apiClient.delete(
        `/api/try-on-sessions/${sessionId}/comments/${commentId}`
      );

      if (response.data?.success) {
        await loadComments(sessionId);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to hide this session?")) return;

    try {
      const response = await apiClient.delete(
        `/api/try-on-sessions/${sessionId}`
      );

      if (response.data?.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setSelectedSession(null);
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleShare = (session: TryOnSession) => {
    setShareSession(session);
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    if (shareSession) {
      const shareUrl = `${window.location.origin}/public-tryon?session=${shareSession.id}`;
      navigator.clipboard.writeText(shareUrl);
      // Show toast or notification
    }
  };

  const loadMore = () => {
    if (pagination?.hasNextPage) {
      fetchSessions(pagination.page + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-50 dark:from-slate-950/30 dark:via-slate-900/30 dark:to-black/20 -mt-12">
      {/* Enhanced Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-600 dark:from-blue-950 dark:via-blue-900 dark:to-gray-950 pt-12"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating orbs */}
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-20 right-10 w-40 h-40 bg-purple-300/10 rounded-full blur-2xl"
          />
          <motion.div
            animate={{
              x: [0, 60, 0],
              y: [0, -40, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/2 left-1/3 w-24 h-24 bg-indigo-300/8 rounded-full blur-lg"
          />

          {/* Geometric patterns */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <pattern
                  id="hero-pattern"
                  x="0"
                  y="0"
                  width="60"
                  height="60"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="30" cy="30" r="1.5" fill="white" opacity="0.3" />
                  <circle cx="10" cy="10" r="1" fill="white" opacity="0.2" />
                  <circle cx="50" cy="50" r="1" fill="white" opacity="0.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-pattern)" />
            </svg>
          </div>

          {/* Cute animated tryon elements */}
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-4 left-4 w-20 h-24 bg-gradient-to-br from-pink-200/20 via-rose-200/20 to-purple-200/20 shadow-xl backdrop-blur-sm border-2 border-white/10"
          />
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-200/20 via-indigo-200/20 to-purple-200/20 shadow-xl backdrop-blur-sm border-2 border-white/10"
            style={{
              clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            }}
          />
          <motion.div
            animate={{
              x: [0, -25, 0],
              y: [0, 25, 0],
              rotate: [0, 20, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-4 left-4 w-18 h-18 bg-gradient-to-br from-green-200/20 via-teal-200/20 to-cyan-200/20 shadow-xl backdrop-blur-sm border-2 border-white/10"
          />
          <motion.div
            animate={{
              x: [0, 35, 0],
              y: [0, -15, 0],
              rotate: [0, -10, 0],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/2 left-4 w-20 h-16 bg-gradient-to-br from-blue-300/20 via-indigo-300/20 to-purple-300/20 rounded-[50%] shadow-xl backdrop-blur-sm border-2 border-white/10"
          />
          <motion.div
            animate={{
              x: [0, -30, 0],
              y: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/2 right-4 w-24 h-24 bg-gradient-to-br from-violet-200/20 via-purple-200/20 to-pink-200/20 rounded-full shadow-xl backdrop-blur-sm border-2 border-white/10"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

        <div className="relative w-full py-16 sm:py-20 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            {/* Animated icon */}
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/15 backdrop-blur-xl rounded-2xl mb-8 border border-white/20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
            </motion.div>

            {/* Main heading with gradient text */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                AI Try-On
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-purple-300 bg-clip-text text-transparent text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">
                Gallery
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-xl sm:text-2xl lg:text-3xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
            >
              Discover breathtaking fashion transformations powered by
              cutting-edge AI. See how virtual try-on technology brings your
              wildest style dreams to life.
            </motion.p>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-8 mb-12"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl sm:text-4xl font-bold text-white mb-1"
                >
                  10K+
                </motion.div>
                <div className="text-blue-200 text-sm sm:text-base">
                  Try-Ons Created
                </div>
              </div>
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="text-3xl sm:text-4xl font-bold text-white mb-1"
                >
                  50K+
                </motion.div>
                <div className="text-blue-200 text-sm sm:text-base">
                  Happy Users
                </div>
              </div>
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="text-3xl sm:text-4xl font-bold text-white mb-1"
                >
                  4.9★
                </motion.div>
                <div className="text-blue-200 text-sm sm:text-base">
                  User Rating
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href={"/try-on"}>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-full font-bold text-base transition-all duration-300 border-2 border-white/20">
                    <Zap className="w-6 h-6 mr-3" />
                    Start Your Try-On
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="ml-2"
                    >
                      →
                    </motion.div>
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  className="border-2 border-white/40 text-white bg-transparent hover:text-white hover:bg-white/10 hover:border-white/60 px-8 py-3 rounded-full font-bold text-base backdrop-blur-sm"
                  onClick={() =>
                    document
                      .getElementById("gallery")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <Eye className="w-6 h-6 mr-3" />
                  Explore Gallery
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="ml-2"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                </Button>
              </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center"
              >
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1 h-3 bg-white/60 rounded-full mt-2"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-blue-800/20"
      >
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Mobile Header Layout */}
          <div className="flex flex-col gap-3">
            {/* Title Section - Stacked on mobile */}
            <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="rounded-full flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>

                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <motion.div
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </motion.div>
                  <div className="min-w-0">
                    <h1 className="font-bold bg-gradient-to-r text-base md:text-lg lg:text-xl from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                      Public Try-On Gallery
                    </h1>
                    <div className="hidden sm:flex items-center gap-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        Community Creations
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile action buttons - right side */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSessions()}
                  disabled={loading}
                  className="rounded-full h-7 w-7 p-0 sm:h-auto sm:w-auto sm:px-2 sm:py-1 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline ml-1">Reload</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="rounded-full h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-800/30"
              >
                {/* Mobile Search - shown when filter panel opens */}
                <div className="relative sm:hidden mb-3">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search try-ons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 rounded-full border border-blue-200/50 dark:border-blue-800/50 bg-white/80 dark:bg-slate-800/80 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-blue-200/50 dark:border-blue-800/50 bg-white/80 dark:bg-slate-800/80 text-xs flex-1 sm:flex-none backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="createdAt">Latest First</option>
                    <option value="likes">Most Liked</option>
                    <option value="views">Most Viewed</option>
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOrder = sortOrder === "desc" ? "asc" : "desc";
                      setSortOrder(newOrder);
                    }}
                    className="rounded-full text-xs px-3 py-2 h-auto sm:hidden w-full border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                  >
                    {sortOrder === "desc" ? (
                      <SortDesc className="h-3 w-3 mr-2 flex-shrink-0" />
                    ) : (
                      <SortAsc className="h-3 w-3 mr-2 flex-shrink-0" />
                    )}
                    Sort
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-0 xs:px-1 sm:px-4 py-4 xs:py-6 pt-2 xs:pt-3 sm:py-8 sm:pt-4">
        {/* Enhanced Loading State */}
        {loading && sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative">
              {/* Outer rotating ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-blue-200/30 dark:border-blue-800/30 rounded-full"
              />

              {/* Inner pulsing ring */}
              <motion.div
                animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                }}
                className="absolute inset-2 border-2 border-blue-500 dark:border-blue-400 rounded-full"
              />

              {/* Center dot */}
              <motion.div
                animate={{ scale: [1, 1.5, 1] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Discovering Amazing Try-Ons
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Loading the latest fashion transformations...
              </p>
            </motion.div>

            {/* Animated dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-1 mt-4"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                  className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Modern Product Gallery */}
        {sessions.length > 0 && (
          <div id="gallery" className="space-y-8 sm:space-y-12 lg:space-y-16">
            {productsWithSessions.map((product, productIndex) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: productIndex * 0.15, duration: 0.6 }}
                className="relative"
              >
                {/* Background decoration */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-2xl opacity-50" />

                <div className="relative bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl p-2 sm:p-4 md:p-10 border border-white/20 dark:border-slate-700/50">
                  {/* Product Header with enhanced design */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                    <div className="flex gap-4 xs:gap-6 flex-1 min-w-0">
                      {/* Enhanced product image */}
                      <div className="relative flex-shrink-0">
                        <motion.div
                          whileHover={{ scale: 1.05, rotate: 5 }}
                          className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-white/50 dark:ring-slate-600/50"
                        >
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                        {/* Floating badge */}
                        <motion.div
                          animate={{
                            y: [0, -5, 0],
                            rotate: [0, 5, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                        >
                          <Star className="w-4 h-4 text-white fill-current" />
                        </motion.div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <motion.h3
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: productIndex * 0.15 + 0.2 }}
                          className="text-base sm:text-lg lg:text-xl font-black bg-clip-text mb-2 "
                        >
                          {product.name}
                        </motion.h3>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: productIndex * 0.15 + 0.3 }}
                          className="flex flex-wrap items-center gap-4 mb-3"
                        >
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                              {product.sessions.length} try-on
                              {product.sessions.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 rounded-full">
                            <Star className="w-4 h-4 text-yellow-600 fill-current" />
                            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                              {Math.floor(Math.random() * 2) + 4}.
                              {Math.floor(Math.random() * 9) + 1}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: productIndex * 0.15 + 0.4 }}
                      className="flex flex-row gap-1 sm:gap-3 flex-shrink-0"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() => router.push(`/product/${product.id}`)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-full transition-all duration-300"
                        >
                          <ShoppingBag className="w-5 h-5" />
                          Order <span className="hidden sm:block">Now</span>
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() =>
                            router.push(`/try-on-widget/${product.id}`)
                          }
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-full transition-all duration-300"
                        >
                          <User className="w-5 h-5" />
                          Try On
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() => {
                            const params = new URLSearchParams(
                              searchParams || ""
                            );
                            params.set("product-id", product.id);
                            params.set(
                              "product-name",
                              encodeURIComponent(product.name)
                            );
                            params.set(
                              "product-image-url",
                              encodeURIComponent(product.image)
                            );
                            router.push(`/public-tryon?${params.toString()}`);
                          }}
                          variant="outline"
                          className="border-2 border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 backdrop-blur-sm px-4 py-2 rounded-full transition-all duration-300"
                        >
                          <Grid3X3 className="w-5 h-5" />
                          View All
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Modern Masonry Grid */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: productIndex * 0.15 + 0.5 }}
                    className="columns-2 sm:columns-3 lg:columns-5 xl:columns-6 gap-6 space-y-6"
                  >
                    {product.sessions.map((session, sessionIndex) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: productIndex * 0.15 + sessionIndex * 0.1,
                          duration: 0.5,
                        }}
                        whileHover={{
                          y: -8,
                          transition: { duration: 0.2 },
                        }}
                        className="break-inside-avoid bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/30 dark:border-slate-700/50 transition-all duration-500 cursor-pointer group"
                        onClick={() =>
                          router.push(`/session-details?id=${session.id}`)
                        }
                      >
                        {/* Enhanced Image Container */}
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <Image
                            src={session.resultImage}
                            alt={`${session.userName}'s try-on`}
                            fill
                            className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                          />

                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Enhanced floating action button */}
                          <motion.div
                            initial={{ scale: 0 }}
                            whileHover={{ scale: 1 }}
                            className="absolute top-4 right-4"
                          >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(session.id);
                              }}
                              className={`p-3 rounded-2xl backdrop-blur-xl transition-all duration-300 ${
                                likedSessions.has(session.id)
                                  ? "bg-red-500 text-white"
                                  : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                              }`}
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  likedSessions.has(session.id)
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                            </motion.button>
                          </motion.div>

                          {/* Enhanced overlay info */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileHover={{ opacity: 1, y: 0 }}
                            className="absolute bottom-0 left-0 right-0 p-4"
                          >
                            <div className="flex items-center justify-between text-white">
                              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm font-semibold">
                                  {session.views}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
                                <Heart className="w-4 h-4" />
                                <span className="text-sm font-semibold">
                                  {session.likes}
                                </span>
                              </div>
                            </div>
                          </motion.div>

                          {/* Hover glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Enhanced No Sessions State */}
        {sessions.length === 0 && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative text-center py-16 sm:py-20"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-3xl" />

            <div className="relative">
              {/* Animated illustration */}
              <div className="relative mb-8">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-24 h-24 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-pink-900/40 rounded-3xl flex items-center justify-center mx-auto"
                >
                  <Sparkles className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </motion.div>

                {/* Floating elements */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute top-0 right-8 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-60"
                />
                <motion.div
                  animate={{
                    y: [0, 8, 0],
                    x: [0, 5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute bottom-2 left-6 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-70"
                />
              </div>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-600 to-purple-600 dark:from-slate-100 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4"
              >
                Ready to Create Magic?
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed"
              >
                Be the first to explore our revolutionary AI try-on technology.
                Transform your fashion vision into reality with just a few
                clicks!
              </motion.p>

              {/* Feature highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap justify-center gap-4 mb-8"
              >
                {[
                  { icon: Zap, text: "Instant Results" },
                  { icon: Star, text: "AI-Powered" },
                  { icon: Heart, text: "Community Driven" },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full border border-white/30 dark:border-slate-700/30"
                  >
                    <feature.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/try-on">
                  <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full font-bold text-base transition-all duration-300 border-2 border-white/20">
                    <Zap className="w-6 h-6 mr-3" />
                    Start Your First Try-On
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="ml-2"
                    >
                      ✨
                    </motion.div>
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Load More */}
        {pagination?.hasNextPage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mt-12 sm:mt-16"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={loadMore}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full font-bold text-base transition-all duration-300 border-2 border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="mr-3"
                  >
                    <Loader2 className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="mr-3"
                  >
                    <Sparkles className="h-6 w-6" />
                  </motion.div>
                )}
                {loading ? "Loading More..." : "Discover More Creations"}
                {!loading && (
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-2"
                  >
                    →
                  </motion.div>
                )}
              </Button>
            </motion.div>

            {/* Progress indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-sm text-slate-500 dark:text-slate-400"
            >
              Showing {sessions.length} amazing try-ons
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 pt-20 sm:p-4 sm:pt-20"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Try-On Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSession(null)}
                  className="rounded-full h-9 w-9 p-0 flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Left: Images */}
                  <div className="space-y-4">
                    <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden relative">
                      <Image
                        src={selectedSession.resultImage}
                        alt={`${selectedSession.userName}'s try-on result`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        {selectedSession.productName}
                      </h3>
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <div className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
                          ✓ Completed
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(
                            selectedSession.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl backdrop-blur-sm">
                      <Image
                        src={selectedSession.userAvatar}
                        alt={selectedSession.userName}
                        width={48}
                        height={48}
                        className="rounded-full w-12 h-12 ring-2 ring-white dark:ring-slate-600"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${selectedSession.userId}`}
                          className="font-semibold text-base text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                        >
                          {selectedSession.userName}
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Community Member
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1 text-blue-500 mb-2">
                          <Heart className="h-5 w-5" />
                          <span className="font-bold text-lg">
                            {selectedSession.likes}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Likes
                        </p>
                      </div>
                      <div className="text-center p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1 text-blue-500 mb-2">
                          <Eye className="h-5 w-5" />
                          <span className="font-bold text-lg">
                            {selectedSession.views}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Views
                        </p>
                      </div>
                      <div className="text-center p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-1 text-blue-500 mb-2">
                          <MessageCircle className="h-5 w-5" />
                          <span className="font-bold text-lg">0</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Comments
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        onClick={() => handleLike(selectedSession.id)}
                        className={`flex-1 rounded-full text-sm py-3 ${
                          likedSessions.has(selectedSession.id)
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 mr-2 flex-shrink-0 ${
                            likedSessions.has(selectedSession.id)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                        <span className="hidden sm:inline">
                          {likedSessions.has(selectedSession.id)
                            ? "Liked"
                            : "Like"}
                        </span>
                      </Button>
                      <Button
                        onClick={() => handleSave(selectedSession.id)}
                        className={`flex-1 rounded-full text-sm py-3 ${
                          savedSessions.has(selectedSession.id)
                            ? "bg-purple-500 hover:bg-purple-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        <Bookmark
                          className={`h-4 w-4 mr-2 flex-shrink-0 ${
                            savedSessions.has(selectedSession.id)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                        <span className="hidden sm:inline">
                          {savedSessions.has(selectedSession.id)
                            ? "Saved"
                            : "Save"}
                        </span>
                      </Button>
                      <Button
                        onClick={() => {
                          loadComments(selectedSession.id);
                          setShowCommentsModal(true);
                        }}
                        className="flex-1 rounded-full text-sm py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Comments</span>
                      </Button>
                      <Button
                        onClick={() => handleShare(selectedSession)}
                        className="flex-1 rounded-full text-sm py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        <Share2 className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                    </div>

                    {/* Delete Button */}
                    {selectedSession.userId === user?.id && (
                      <Button
                        onClick={() => handleDeleteSession(selectedSession.id)}
                        className="w-full rounded-full text-sm py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                        Hide Session
                      </Button>
                    )}

                    {/* Try This Product CTA */}
                    {selectedSession.productId && (
                      <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                        <Link
                          href={`/try-on-widget/${selectedSession.productId}`}
                        >
                          <Button className="w-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm py-2 font-semibold transition-all duration-300">
                            <ShoppingBag className="h-4 w-4 mr-2 flex-shrink-0" />
                            Try This Product
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {showCommentsModal && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={() => setShowCommentsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Comments
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCommentsModal(false)}
                  className="rounded-full h-9 w-9 p-0 flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {loadingComments ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            User
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            {comment.text}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {comment.userId === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteComment(
                                selectedSession.id,
                                comment.id
                              )
                            }
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No comments yet. Be the first to comment!
                    </p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200/50 dark:border-slate-600/50 bg-white/80 dark:bg-slate-700/80 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                  />
                  <Button
                    onClick={() => handlePostComment(selectedSession.id)}
                    disabled={postingComment || !commentText.trim()}
                    className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-3 py-2"
                  >
                    {postingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && shareSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Share Try-On
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShareModal(false)}
                  className="rounded-full h-8 w-8 p-0 flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden relative">
                  <Image
                    src={shareSession.resultImage}
                    alt={`${shareSession.userName}'s try-on`}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Share this amazing try-on by {shareSession.userName}
                  </p>
                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      onClick={copyShareLink}
                      className="flex-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5"
                    >
                      <Download className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="hidden sm:inline">Copy Link</span>
                      <span className="sm:hidden">Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full text-xs py-1.5 border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 backdrop-blur-sm"
                      onClick={() => setShowShareModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
