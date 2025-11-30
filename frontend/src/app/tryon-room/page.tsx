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
      productImage: "/images/placeholder-product.jpg",
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSession, setShareSession] = useState<TryOnSession | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newSessionAlert, setNewSessionAlert] = useState<TryOnSession | null>(
    null
  );
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Get unique products from sessions (for bottom gallery)
  const uniqueProducts = Array.from(
    new Map(
      sessions.map((session) => [
        session.productId,
        {
          id: session.productId,
          name: session.productName,
          image: session.productImage,
          count: sessions.filter((s) => s.productId === session.productId)
            .length,
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

  const handleLike = async (sessionId: string) => {
    const newLikedSessions = new Set(likedSessions);
    if (likedSessions.has(sessionId)) {
      newLikedSessions.delete(sessionId);
    } else {
      newLikedSessions.add(sessionId);
    }
    setLikedSessions(newLikedSessions);

    // Update local session data
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              likes: session.likes + (likedSessions.has(sessionId) ? -1 : 1),
            }
          : session
      )
    );
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
    <div className="min-h-screen bg-gradient-to-b bg-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 mt-10 rounded-t-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-purple-200 dark:border-purple-800 rounded-t-2xl"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="flex items-center gap-3">
                <motion.div
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {productId
                      ? "Product Try-On Showcase"
                      : "AI Try-On Gallery"}
                  </h1>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {productId ? "Product Showcase" : "All Community Try-Ons"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Reload Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSessions()}
                disabled={loading}
                className="rounded-full text-xs px-2 py-1 h-7"
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`}
                />
                Reload
              </Button>

              {/* Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Mobile Search Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-full h-7 w-7 p-0 md:hidden"
              >
                <Search className="h-3 w-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-full text-xs px-2 py-1 h-7"
              >
                <Filter className="h-3 w-3 mr-1" />
                Filters
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOrder = sortOrder === "desc" ? "asc" : "desc";
                  setSortOrder(newOrder);
                }}
                className="rounded-full text-xs px-2 py-1 h-7"
              >
                {sortOrder === "desc" ? (
                  <SortDesc className="h-3 w-3 mr-1" />
                ) : (
                  <SortAsc className="h-3 w-3 mr-1" />
                )}
                Sort
              </Button>
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800"
              >
                {/* Mobile Search */}
                <div className="relative md:hidden mb-4">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="createdAt">Latest First</option>
                    <option value="likes">Most Liked</option>
                    <option value="views">Most Viewed</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Product Showcase Header - Only show when product is selected */}
        {productId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-3xl p-6 border border-purple-200 dark:border-purple-800/50 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="relative w-full md:w-24 h-24 md:h-24 rounded-2xl overflow-hidden">
                  <Image
                    src={
                      productImageUrl ||
                      sessions[0]?.productImage ||
                      "/images/placeholder-product.jpg"
                    }
                    alt="Product"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    {productName ||
                      sessions[0]?.productName ||
                      "Product Showcase"}
                  </h2>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    See how this amazing product looks on different people.
                    Community try-ons showcase the perfect fit and style for
                    various body types and preferences.
                  </p>

                  {/* Stats */}
                  {/* <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="flex flex-col gap-1 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {sessions.length}
                        </p>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Try-Ons
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {sessions.reduce((sum, s) => sum + s.likes, 0)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Likes
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {sessions.reduce((sum, s) => sum + s.views, 0)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Views
                      </p>
                    </div>
                  </div> */}

                  {/* CTA Button */}
                  <Link href={`/try-on-widget/${productId}`}>
                    <Button className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Try This Product
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sessions Grid */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-purple-100 dark:border-purple-800 relative group cursor-pointer"
                onClick={() => setSelectedSession(session)}
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
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(session.id);
                      }}
                      className={`p-1.5 rounded-full backdrop-blur-sm transition-colors ${
                        likedSessions.has(session.id)
                          ? "bg-red-500/90 text-white"
                          : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Heart
                        className={`h-3 w-3 ${
                          likedSessions.has(session.id) ? "fill-current" : ""
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(session.id);
                      }}
                      className={`p-1.5 rounded-full backdrop-blur-sm transition-colors ${
                        bookmarkedSessions.has(session.id)
                          ? "bg-purple-500/90 text-white"
                          : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Bookmark
                        className={`h-3 w-3 ${
                          bookmarkedSessions.has(session.id)
                            ? "fill-current"
                            : ""
                        }`}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(session);
                      }}
                      className="p-1.5 rounded-full backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 transition-colors hover:bg-blue-500/90 hover:text-white"
                    >
                      <Share2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Session Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    {/* <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {session.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {session.views}
                      </div>
                    </div> */}
                    <span>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Sessions State */}
        {sessions.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {productId ? "No Try-On Sessions Yet" : "No Sessions in Gallery"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {productId
                ? "Be the first to try on this amazing product!"
                : "Start exploring products to see try-on sessions in the gallery."}
            </p>
            {productId ? (
              <Link href="/try-on">
                <Button className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                  Start Your First Try-On
                </Button>
              </Link>
            ) : (
              <Link href="/products">
                <Button className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                  Browse Products
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Bottom Product Gallery - Only show when no product filter */}
        {!productId && sessions.length > 0 && uniqueProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-red-600 bg-clip-text text-transparent mb-2">
                Popular Products
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Explore {uniqueProducts.length} product
                {uniqueProducts.length !== 1 ? "s" : ""} tried by our community
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {uniqueProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => {
                    // Navigate to product-filtered view
                    const params = new URLSearchParams(searchParams || "");
                    params.set("productId", product.id);
                    router.push(`/tryon-room?${params.toString()}`);
                  }}
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 transition-all duration-300">
                    {/* Product Image */}
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Product Info - Hidden by default, shown on hover */}
                    <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white font-semibold text-xs line-clamp-2 mb-1">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-1 text-white/80 text-xs">
                        <User className="h-3 w-3" />
                        <span>
                          {product.count} Try-On{product.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {product.count}
                    </div>

                    {/* Interactive Button */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="bg-white dark:bg-slate-900 rounded-full p-3">
                        <Grid3X3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Load More */}
        {pagination?.hasNextPage && (
          <div className="text-center mt-8">
            <Button
              onClick={loadMore}
              variant="outline"
              className="rounded-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Try-On Details
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSession(null)}
                    className="rounded-full h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left: Images */}
                  <div className="space-y-4">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden relative">
                      <Image
                        src={selectedSession.resultImage}
                        alt={`${selectedSession.userName}'s try-on result`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {selectedSession.productName}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
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
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <Image
                        src={selectedSession.userAvatar}
                        alt={selectedSession.userName}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <Link
                          href={`/profile/${selectedSession.userId}`}
                          className="font-medium text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {selectedSession.userName}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Community Member
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                          <Heart className="h-4 w-4" />
                          <span className="font-semibold">
                            {selectedSession.likes}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Likes
                        </p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                          <Eye className="h-4 w-4" />
                          <span className="font-semibold">
                            {selectedSession.views}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Views
                        </p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                          <MessageCircle className="h-4 w-4" />
                          <span className="font-semibold">0</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Comments
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleLike(selectedSession.id)}
                        className={`flex-1 rounded-full ${
                          likedSessions.has(selectedSession.id)
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 mr-2 ${
                            likedSessions.has(selectedSession.id)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                        {likedSessions.has(selectedSession.id)
                          ? "Liked"
                          : "Like"}
                      </Button>
                      <Button
                        onClick={() => handleBookmark(selectedSession.id)}
                        className={`flex-1 rounded-full ${
                          bookmarkedSessions.has(selectedSession.id)
                            ? "bg-purple-500 hover:bg-purple-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        <Bookmark
                          className={`h-4 w-4 mr-2 ${
                            bookmarkedSessions.has(selectedSession.id)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                        {bookmarkedSessions.has(selectedSession.id)
                          ? "Saved"
                          : "Save"}
                      </Button>
                      <Button
                        onClick={() => handleShare(selectedSession)}
                        className="flex-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>

                    {/* Try This Product CTA */}
                    {selectedSession.productId && (
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Link href={`/product/${selectedSession.productId}`}>
                          <Button className="w-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                            <ShoppingBag className="h-4 w-4 mr-2" />
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

      {/* New Session Alert */}
      <AnimatePresence>
        {newSessionAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <div className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              <span className="font-medium text-xs">
                New try-on by {newSessionAlert.userName}!
              </span>
            </div>
            <button
              onClick={() => setNewSessionAlert(null)}
              className="ml-1 text-white/80 hover:text-white"
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Share Try-On
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShareModal(false)}
                  className="rounded-full h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden relative">
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
                  <div className="flex gap-3">
                    <Button
                      onClick={copyShareLink}
                      className="flex-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full"
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
