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
  Wand2,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, API_ENDPOINTS, handleApiError } from "@/config/api";
import { Product } from "@/shared/schema";

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
    null,
  );
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [likedSessions, setLikedSessions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(
    new Set(),
  );
  const [savedSessions, setSavedSessions] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSession, setShareSession] = useState<TryOnSession | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

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
      ]),
    ).values(),
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

  // Fetch product details when productId is present
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setProduct(null);
        return;
      }

      try {
        setLoadingProduct(true);
        const response = await apiClient.get<Product>(
          `/api/products/${productId}`,
        );
        setProduct(response.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Update browser title and meta tags based on product or general gallery
  useEffect(() => {
    if (productId && product) {
      // When specific product is loaded
      document.title = `${product.name} - Try-On Gallery | Nyambika`;
      updateMetaTags(
        `${product.name} - Try-On Gallery | Nyambika`,
        `Explore amazing virtual try-ons with ${product.name}. See how this fashion item looks on different people using AI technology.`,
        product.imageUrl,
      );
    } else if (!productId) {
      // When viewing general gallery
      document.title =
        "AI Try-On Gallery - Discover Amazing Fashion | Nyambika";
      updateMetaTags(
        "AI Try-On Gallery - Discover Amazing Fashion | Nyambika",
        "Explore our collection of AI-powered virtual try-on results. See fashion transformations and discover your perfect style with cutting-edge technology.",
        "/products-grid.png",
      );
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = "Nyambika - AI Fashion Try-On";
    };
  }, [productId, product]);

  // Helper function to update meta tags
  const updateMetaTags = (
    title: string,
    description: string,
    imageUrl: string,
  ) => {
    if (typeof document === "undefined") return;

    // Update existing meta tags or create new ones
    const updateOrCreateMeta = (property: string, content: string) => {
      let meta = document.querySelector(
        `meta[property="${property}"]`,
      ) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Open Graph tags
    updateOrCreateMeta("og:title", title);
    updateOrCreateMeta("og:description", description);
    updateOrCreateMeta(
      "og:image",
      imageUrl.startsWith("http")
        ? imageUrl
        : `${window.location.origin}${imageUrl}`,
    );
    updateOrCreateMeta("og:url", window.location.href);

    // Twitter Card tags
    updateOrCreateMeta("twitter:title", title);
    updateOrCreateMeta("twitter:description", description);
    updateOrCreateMeta(
      "twitter:image",
      imageUrl.startsWith("http")
        ? imageUrl
        : `${window.location.origin}${imageUrl}`,
    );
    updateOrCreateMeta("twitter:card", "summary_large_image");
  };

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
              : session,
          ),
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
        `/api/try-on-sessions/${sessionId}/comments`,
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
        { text: commentText },
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
        `/api/try-on-sessions/${sessionId}/comments/${commentId}`,
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
        `/api/try-on-sessions/${sessionId}`,
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
    <div className="min-h-screen -mt-12 bg-slate-50 dark:bg-slate-950/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 bg-gradient-to-b from-gold-600 to-gold-700 dark:from-gold-900 dark:to-gold-950">
        <div className="absolute -top-10 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl bg-gold-300" />

        <div className="relative w-full py-12 sm:py-16">
          <div className="text-center max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 rounded-2xl mb-6 border border-white/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold text-white mb-4 leading-tight">
              AI Try-On Gallery
            </h1>

            <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl mx-auto leading-relaxed">
              See real fashion transformations from AI-powered virtual try-on.
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-10">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  10K+
                </div>
                <div className="text-white/70 text-sm">Try-Ons Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  50K+
                </div>
                <div className="text-white/70 text-sm">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center justify-center gap-1">
                  4.9
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div className="text-white/70 text-sm">User Rating</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href={"/try-on"}>
                <Button className="bg-white text-slate-900 hover:bg-slate-50 px-6 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Your Try-On
                </Button>
              </Link>

              <Button
                variant="outline"
                className="border-2 border-white/40 text-white bg-transparent hover:bg-white/10 hover:border-white/60 px-6 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105"
                onClick={() =>
                  document
                    .getElementById("gallery")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <Eye className="w-5 h-5 mr-2" />
                Explore Gallery
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Product Header Section - Show when product is specified */}
      {productId && (product || loadingProduct) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative bg-card/90 backdrop-blur-xl border-b border-border"
        >
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {loadingProduct ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Loading product...
                </span>
              </div>
            ) : product ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden border border-border bg-muted">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="112px"
                    quality={70}
                    priority
                    placeholder="empty"
                    className="object-cover"
                  />
                </div>

                <div className="space-y-3 text-center sm:text-left">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-1 text-foreground">
                      {product.name}
                    </h2>
                    <span className="text-base font-bold text-foreground">
                      RF {parseFloat(String(product.price)).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/product/${product.id}`)}
                      className="rounded-full"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      View Product
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/try-on-widget/${product.id}`)}
                      className="bg-gold-600 hover:bg-gold-700 text-white rounded-full"
                    >
                      <Wand2 className="w-4 h-4" />
                      Try On
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/20"
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
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gold-500"
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
                    <h1 className="font-bold text-base md:text-lg lg:text-xl truncate text-foreground">
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
                className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/30"
              >
                {/* Mobile Search - shown when filter panel opens */}
                <div className="relative sm:hidden mb-3">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search try-ons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/50 backdrop-blur-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 text-xs flex-1 sm:flex-none backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
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
                    className="rounded-full text-xs px-3 py-2 h-auto sm:hidden w-full border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-gold-900/20"
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
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
            <div className="mt-4 text-center">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Discovering Amazing Try-Ons
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Loading the latest fashion transformations...
              </p>
            </div>
          </div>
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
                <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-50 bg-slate-500/5" />

                <div className="relative bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-4 sm:p-6 md:p-8 border border-white/20 dark:border-slate-700/50">
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
                          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-slate-500/20" />
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
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center bg-gold-400"
                        >
                          <Star className="w-4 h-4 text-white fill-current" />
                        </motion.div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <motion.h3
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: productIndex * 0.15 + 0.2 }}
                          className="text-base sm:text-lg lg:text-xl font-black mb-2 text-foreground"
                        >
                          {product.name}
                        </motion.h3>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: productIndex * 0.15 + 0.3 }}
                          className="flex flex-wrap items-center gap-4 mb-3"
                        >
                          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/30 rounded-full">
                            <Eye className="w-4 h-4 text-slate-900 dark:text-white" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-300">
                              {product.sessions.length} try-on
                              {product.sessions.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/30 rounded-full">
                            <Star className="w-4 h-4 text-slate-900 fill-current" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-300">
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
                          className="text-white px-4 py-2 rounded-full transition-all duration-300 bg-gold-600 hover:bg-gold-600"
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
                          className="text-white px-4 py-2 rounded-full transition-all duration-300 bg-gold-500 hover:bg-gold-600"
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
                              searchParams || "",
                            );
                            params.set("product-id", product.id);
                            params.set(
                              "product-name",
                              encodeURIComponent(product.name),
                            );
                            params.set(
                              "product-image-url",
                              encodeURIComponent(product.image),
                            );
                            router.push(`/public-tryon?${params.toString()}`);
                          }}
                          variant="outline"
                          className="border-2 border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white hover:bg-slate-50/80 dark:hover:bg-gold-900/30 backdrop-blur-sm px-4 py-2 rounded-full transition-all duration-300"
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
                          router.push(`/session-details/${session.id}`)
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
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/70" />

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
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-slate-500/20" />
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
            <div className="absolute inset-0 rounded-3xl blur-3xl bg-slate-500/5" />

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
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto bg-gold-100 dark:bg-slate-900/40"
                >
                  <Sparkles className="w-12 h-12 text-slate-900 dark:text-white" />
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
                  className="absolute top-0 right-8 w-6 h-6 rounded-full opacity-60 bg-gold-400"
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
                  className="absolute bottom-2 left-6 w-4 h-4 rounded-full opacity-70 bg-gold-400"
                />
              </div>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-xl font-bold from-slate-900 dark:from-slate-100 mb-4 text-foreground"
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
                    <feature.icon className="w-4 h-4 text-slate-900 dark:text-white" />
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
                  <Button className="text-white px-6 py-3 rounded-full font-bold text-base transition-all duration-300 border-2 border-white/20 bg-gold-500 hover:bg-gold-600">
                    <Zap className="w-6 h-6 mr-3" />
                    Start Your First Try-On
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="ml-2"
                    ></motion.div>
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
                className="text-white px-8 py-3 rounded-full font-bold text-base transition-all duration-300 border-2 border-white/20 disabled:opacity-50 disabled:cursor-not-allowed bg-gold-500 hover:bg-gold-600"
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
                    <ArrowRight className="h-4 w-4" />
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
                      <h3 className="text-base sm:text-lg font-bold mb-3 text-foreground">
                        {selectedSession.productName}
                      </h3>
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-900 dark:text-slate-300 text-sm font-medium">
                          <Check className="h-3.5 w-3.5" />
                          Completed
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(
                            selectedSession.createdAt,
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
                          className="font-semibold text-base text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:hover:text-slate-700 transition-colors truncate"
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
                        <div className="flex items-center justify-center gap-1 text-slate-800 mb-2">
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
                        <div className="flex items-center justify-center gap-1 text-slate-800 mb-2">
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
                        <div className="flex items-center justify-center gap-1 text-slate-800 mb-2">
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
                            ? "bg-gold-500 hover:bg-gold-600 text-white"
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
                          <Button className="w-full rounded-full text-white text-sm py-2 font-semibold transition-all duration-300 bg-gold-500 hover:bg-gold-600">
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
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-800" />
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
                                comment.id,
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
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200/50 dark:border-slate-600/50 bg-white/80 dark:bg-slate-700/80 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 backdrop-blur-sm"
                  />
                  <Button
                    onClick={() => handlePostComment(selectedSession.id)}
                    disabled={postingComment || !commentText.trim()}
                    className="rounded-lg bg-gold-500 hover:bg-gold-600 text-white px-3 py-2"
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
                      className="flex-1 rounded-full bg-gold-500 hover:bg-gold-600 text-white text-xs py-1.5"
                    >
                      <Download className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="hidden sm:inline">Copy Link</span>
                      <span className="sm:hidden">Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full text-xs py-1.5 border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-gold-900/20 backdrop-blur-sm"
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
