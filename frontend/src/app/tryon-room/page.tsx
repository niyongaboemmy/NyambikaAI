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
      userName: "User",
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

export default function TryOnRoom() {
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

  // Redirect unauthenticated users to public tryon page
  useEffect(() => {
    if (!user) {
      router.push("/public-tryon");
    }
  }, [user, router]);

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
      const shareUrl = `${window.location.origin}/tryon-room?session=${shareSession.id}`;
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
    <div className="min-h-screen bg-gradient-to-b bg-white dark:from-gray-900 dark:via-gray-950 dark:to-black mt-10 rounded-t-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-blue-800/30 rounded-t-2xl"
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
                  className="rounded-full flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>

                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <motion.div
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-500 flex items-center justify-center flex-shrink-0"
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
                    <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent truncate">
                      {productId ? "AI Try-On" : "AI Try-On Gallery"}
                    </h1>
                    <div className="hidden sm:flex items-center gap-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {productId ? "Product Showcase" : "Community Try-Ons"}
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
                  className="rounded-full dark:bg-gray-800 dark:hover:bg-gray-700/50 h-7 w-7 p-0 sm:h-auto sm:w-auto sm:px-2 sm:py-1"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Reload</span>
                </Button>

                {productId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/tryon-room")}
                    className="rounded-full h-7 w-7 p-0 sm:h-auto sm:w-auto sm:px-2 sm:py-1"
                  >
                    <div>
                      <Eye className="h-3 w-3" />
                    </div>
                    <span className="hidden sm:inline">View All</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="rounded-full h-7 w-7 p-0"
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
                className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800"
              >
                {/* Mobile Search - shown when filter panel opens */}
                <div className="relative sm:hidden mb-3">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-xs flex-1 sm:flex-none"
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
                    className="rounded-full text-xs px-3 py-2 h-auto sm:hidden w-full"
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
        {/* Product-Grouped Sessions */}
        {sessions.length > 0 && (
          <div className="space-y-4 xs:space-y-6 sm:space-y-8 lg:space-y-12">
            {productsWithSessions.map((product, productIndex) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: productIndex * 0.1 }}
                className="bg-white dark:bg-slate-900/50 rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-6 border border-slate-100 dark:border-slate-800/50"
              >
                {/* Product Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3 xs:mb-4 sm:mb-6">
                  <div className="flex gap-2 xs:gap-3 sm:gap-4 lg:gap-6 flex-1 min-w-0 w-full">
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg xs:rounded-xl lg:rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-0.5 xs:mb-1 leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {product.sessions.length} community try-on
                        {product.sessions.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Compact Action Buttons - Stack on mobile, row on larger screens */}
                  <div className="flex flex-row gap-1 flex-shrink-0 w-full sm:w-max">
                    <Button
                      onClick={() => router.push(`/product/${product.id}`)}
                      size="sm"
                      className="flex-1 sm:flex-none xs:h-8 px-2 sm:px-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs"
                    >
                      <ShoppingBag className="h-3 w-3 flex-shrink-0" />
                      <span className="sm:inline">Order</span>
                    </Button>

                    <Button
                      onClick={() =>
                        router.push(`/try-on-widget/${product.id}`)
                      }
                      size="sm"
                      className="flex-1 sm:flex-none xs:h-8 px-2 sm:px-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs"
                    >
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="sm:inline">Try On</span>
                    </Button>

                    <Button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams || "");
                        params.set("product-id", product.id);
                        params.set(
                          "product-name",
                          encodeURIComponent(product.name)
                        );
                        params.set(
                          "product-image-url",
                          encodeURIComponent(product.image)
                        );
                        router.push(`/tryon-room?${params.toString()}`);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none xs:h-8 px-2 sm:px-3 rounded-full text-xs border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Grid3X3 className="h-3 w-3 flex-shrink-0" />
                      <span className="sm:inline">Gallery</span>
                    </Button>
                  </div>
                </div>

                {/* Product Sessions Grid */}
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 xs:gap-3 sm:gap-4">
                  {product.sessions.map((session, sessionIndex) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: productIndex * 0.1 + sessionIndex * 0.05,
                      }}
                      className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden border border-blue-100 dark:border-gray-800/60 relative group cursor-pointer"
                      onClick={() =>
                        router.push(`/session-details?id=${session.id}`)
                      }
                    >
                      {/* Session Image */}
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <Image
                          src={session.resultImage}
                          alt={`${session.userName}'s try-on`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Quick Actions */}
                        <div className="absolute top-1 xs:top-1.5 sm:top-2 right-1 xs:right-1.5 sm:right-2 flex gap-0.5 xs:gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(session.id);
                            }}
                            className={`p-1 xs:p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-colors ${
                              likedSessions.has(session.id)
                                ? "bg-red-500/90 text-white"
                                : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <Heart
                              className={`h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 ${
                                likedSessions.has(session.id)
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Session Info */}
                      <div className="p-1.5 xs:p-2 sm:p-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Sessions State */}
        {sessions.length === 0 && !loading && !error && (
          <div className="text-center py-8 sm:py-12">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {productId ? "No Try-On Sessions Yet" : "No Sessions in Gallery"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
              {productId
                ? "Be the first to try on this amazing product!"
                : "Start exploring products to see try-on sessions in the gallery."}
            </p>
            {productId ? (
              <Link href="/try-on">
                <Button className="rounded-full bg-gradient-to-r from-blue-500 to-blue-500 text-sm w-full sm:w-auto">
                  Start Your First Try-On
                </Button>
              </Link>
            ) : (
              <Link href="/products">
                <Button className="rounded-full bg-gradient-to-r from-blue-500 to-blue-500 text-sm w-full sm:w-auto">
                  Browse Products
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Load More */}
        {pagination?.hasNextPage && (
          <div className="text-center mt-6 sm:mt-8">
            <Button
              onClick={loadMore}
              variant="outline"
              className="rounded-full text-sm w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
              ) : null}
              Load More
            </Button>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 pt-20 sm:p-4 sm:pt-20"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 p-3 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Try-On Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSession(null)}
                  className="rounded-full h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-3 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {selectedSession.productName}
                      </h3>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                        <div className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                          ✓ Completed
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(
                            selectedSession.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <Image
                        src={selectedSession.userAvatar}
                        alt={selectedSession.userName}
                        width={40}
                        height={40}
                        className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${selectedSession.userId}`}
                          className="font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                        >
                          {selectedSession.userName}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Community Member
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-xl">
                        <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-semibold text-xs sm:text-sm">
                            {selectedSession.likes}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Likes
                        </p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-xl">
                        <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-semibold text-xs sm:text-sm">
                            {selectedSession.views}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Views
                        </p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-xl">
                        <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                          <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-semibold text-xs sm:text-sm">
                            0
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Comments
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 sm:gap-3 flex-wrap">
                      <Button
                        onClick={() => handleLike(selectedSession.id)}
                        className={`flex-1 rounded-full text-xs sm:text-sm ${
                          likedSessions.has(selectedSession.id)
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        <Heart
                          className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0 ${
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
                        className={`flex-1 rounded-full text-xs sm:text-sm ${
                          savedSessions.has(selectedSession.id)
                            ? "bg-purple-500 hover:bg-purple-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        <Bookmark
                          className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0 ${
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
                        className="flex-1 rounded-full text-xs sm:text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="hidden sm:inline">Comments</span>
                      </Button>
                      <Button
                        onClick={() => handleShare(selectedSession)}
                        className="flex-1 rounded-full text-xs sm:text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                    </div>

                    {/* Delete Button */}
                    {selectedSession.userId === user?.id && (
                      <Button
                        onClick={() => handleDeleteSession(selectedSession.id)}
                        className="w-full rounded-full text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        Hide Session
                      </Button>
                    )}

                    {/* Try This Product CTA */}
                    {selectedSession.productId && (
                      <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Link
                          href={`/try-on-widget/${selectedSession.productId}`}
                        >
                          <Button className="w-full rounded-full bg-gradient-to-r from-blue-500 to-blue-500 text-white text-sm">
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
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={() => setShowCommentsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 p-3 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Comments
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCommentsModal(false)}
                  className="rounded-full h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
                {loadingComments ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            User
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
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
              <div className="border-t border-slate-200 dark:border-slate-700 p-3 sm:p-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <AnimatePresence>
        {newSessionAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[60] bg-gradient-to-r from-blue-500 to-blue-500 text-white px-3 sm:px-4 py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm max-w-xs sm:max-w-sm mx-3"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse flex-shrink-0" />
            <div className="flex items-center gap-1 min-w-0">
              <RefreshCw className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium truncate">
                New try-on by {newSessionAlert.userName}!
              </span>
            </div>
            <button
              onClick={() => setNewSessionAlert(null)}
              className="ml-1 text-white/80 hover:text-white flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
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
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Share Try-On
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShareModal(false)}
                  className="rounded-full h-8 w-8 p-0 flex-shrink-0"
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
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">
                    Share this amazing try-on by {shareSession.userName}
                  </p>
                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      onClick={copyShareLink}
                      className="flex-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="hidden sm:inline">Copy Link</span>
                      <span className="sm:hidden">Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full text-xs sm:text-sm"
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
