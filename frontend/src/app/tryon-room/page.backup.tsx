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
    <div 
      onMouseMove={(e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black"
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -100, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -100, 0],
            y: [0, 100, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, 50, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Room Spotlight Effect */}
      <motion.div
        animate={{
          left: mousePosition.x - 150,
          top: mousePosition.y - 150,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed w-96 h-96 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Header - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="sticky top-0 z-40 bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-transparent backdrop-blur-xl border-b border-purple-500/20"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>

              <div className="hidden sm:block">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                    {productId ? "✨ Fashion Showcase" : "🎨 Try-On Gallery"}
                  </h1>
                  <p className="text-xs text-purple-300/70 mt-1">
                    {productId ? "Product Showcase" : "Explore Community Try-Ons"}
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchSessions()}
                disabled={loading}
                className="px-3 sm:px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 text-xs font-medium transition-all"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 inline ${loading ? "animate-spin" : ""}`} />
                Reload
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs hidden sm:flex items-center gap-1.5"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline">Filters</span>
              </motion.button>

              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search galleries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <div className="flex flex-wrap gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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

      {/* Main Gallery Content */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Product Showcase - Enhanced */}
        {productId && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/50 via-purple-800/30 to-pink-900/50 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/60 transition-all duration-500 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex flex-col lg:flex-row gap-8 p-8 lg:p-12">
                {/* Product Image */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-full lg:w-72 h-96 lg:h-full rounded-2xl overflow-hidden shadow-2xl flex-shrink-0"
                >
                  <Image
                    src={
                      productImageUrl ||
                      sessions[0]?.productImage ||
                      "/images/placeholder-product.jpg"
                    }
                    alt="Product"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute bottom-4 left-4 right-4"
                  >
                    <p className="text-white font-bold text-lg">
                      {productName || sessions[0]?.productName || "Product"}
                    </p>
                  </motion.div>
                </motion.div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-4">
                      {productName || sessions[0]?.productName || "Product"}
                    </h2>
                    <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                      Discover how our community styles this amazing product. See real try-ons from diverse people and get inspired!
                    </p>
                  </motion.div>

                  {/* Stats Grid */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-3 gap-3 sm:gap-4 mb-6"
                  >
                    {[
                      { icon: User, label: "Try-Ons", value: sessions.length, color: "purple" },
                      { icon: Heart, label: "Likes", value: sessions.reduce((sum, s) => sum + s.likes, 0), color: "pink" },
                      { icon: Eye, label: "Views", value: sessions.reduce((sum, s) => sum + s.views, 0), color: "blue" },
                    ].map((stat) => (
                      <motion.div
                        key={stat.label}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className={`p-4 rounded-xl bg-gradient-to-br from-${stat.color}-900/40 to-${stat.color}-800/20 border border-${stat.color}-500/30 hover:border-${stat.color}-400/60 backdrop-blur-sm transition-all`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
                          <p className="font-bold text-white text-lg">{stat.value}</p>
                        </div>
                        <p className={`text-xs text-${stat.color}-300/70`}>{stat.label}</p>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* CTA */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href={`/product/${productId}`}>
                      <motion.button
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg shadow-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="h-5 w-5" />
                        Try This Product
                      </motion.button>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Gallery Grid - Enhanced */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, staggerChildren: 0.05 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                {productId ? "Try-Ons" : "Community Gallery"}
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sessions.map((session, idx) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 30, rotateX: -10 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.6 }}
                  whileHover={{ y: -10 }}
                  onMouseEnter={() => setHoveredCard(session.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setSelectedSession(session)}
                  className="cursor-pointer h-full"
                >
                  <div className="relative h-full rounded-2xl overflow-hidden group bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 hover:border-purple-500/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20"
                  >
                    {/* Image Container */}
                    <div className="aspect-[3/4] relative overflow-hidden bg-black">
                      <Image
                        src={session.resultImage}
                        alt={`${session.userName}'s try-on`}
                        fill
                        className="object-cover group-hover:scale-125 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Hover Content */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="absolute inset-0 flex flex-col justify-end p-4 backdrop-blur-sm"
                      >
                        <p className="text-white font-bold text-sm mb-2">{session.productName}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSession(session);
                          }}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                          View Details
                        </button>
                      </motion.div>

                      {/* Quick Actions */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        className="absolute top-3 right-3 flex gap-2"
                      >
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(session.id);
                          }}
                          className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                            likedSessions.has(session.id)
                              ? "bg-red-500/90 text-white"
                              : "bg-white/20 text-white/80 hover:bg-white/40"
                          }`}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              likedSessions.has(session.id) ? "fill-current" : ""
                            }`}
                          />
                        </motion.button>
                      </motion.div>

                      {/* Badge */}
                      <div className="absolute bottom-3 left-3 right-3 bg-white/10 backdrop-blur-sm rounded-lg p-2">
                        <div className="flex items-center justify-between text-xs text-white/80">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-pink-400" />
                            {session.likes}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-blue-400" />
                            {session.views}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={session.userAvatar}
                            alt={session.userName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Link
                          href={`/profile/${session.userId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold text-white/90 hover:text-purple-400 transition-colors truncate"
                        >
                          {session.userName}
                        </Link>
                      </div>
                      <p className="text-xs text-white/50">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {sessions.length === 0 && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <div className="text-6xl">✨</div>
            </motion.div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
              {productId ? "No Try-Ons Yet" : "Gallery is Empty"}
            </h3>
            <p className="text-white/60 text-sm sm:text-base mb-8 max-w-md mx-auto">
              {productId
                ? "Be the first to create amazing try-ons!"
                : "Explore products and start creating try-ons!"}
            </p>
            <Link href={productId ? "/try-on" : "/products"}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all"
              >
                {productId ? "Start Try-On" : "Browse Products"}
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Bottom Product Gallery */}
        {!productId && sessions.length > 0 && uniqueProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-20 pt-16 border-t border-white/10"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 flex items-center gap-2">
                <span>🛍️</span> Popular Products
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              <p className="text-white/60 text-sm mt-3">
                Tap any product to see all try-ons
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {uniqueProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ scale: 1.08, rotate: 2 }}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams || "");
                    params.set("productId", product.id);
                    router.push(`/tryon-room?${params.toString()}`);
                  }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-black border border-white/10 hover:border-purple-500/50 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-130 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Product Info */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="absolute inset-0 flex flex-col justify-end p-3"
                    >
                      <p className="text-white font-bold text-xs line-clamp-2 mb-2">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-1 text-white/80 text-xs bg-white/10 rounded-lg px-2 py-1 w-fit">
                        <Grid3X3 className="h-3 w-3" />
                        {product.count}
                      </div>
                    </motion.div>

                    {/* Count Badge */}
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center shadow-lg"
                    >
                      {product.count}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Load More Button */}
        {pagination?.hasNextPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 text-white font-bold transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin inline" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Session Detail Modal - Enhanced */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSession(null)}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-purple-500/30 shadow-2xl"
            >
              <div className="flex flex-col lg:flex-row h-full">
                {/* Image */}
                <div className="relative w-full lg:w-2/5 h-80 lg:h-auto min-h-[400px] bg-black"
                >
                  <Image
                    src={selectedSession.resultImage}
                    alt="Try-on"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between overflow-y-auto">
                  <div>
                    <h2 className="text-2xl font-black text-white mb-2">
                      {selectedSession.productName}
                    </h2>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold">
                        ✓ Complete
                      </div>
                      <span className="text-white/50 text-xs">
                        {new Date(selectedSession.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* User Card */}
                    <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={selectedSession.userAvatar}
                            alt={selectedSession.userName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/profile/${selectedSession.userId}`}
                            className="font-bold text-white hover:text-purple-400 transition-colors"
                          >
                            {selectedSession.userName}
                          </Link>
                          <p className="text-xs text-white/50">Community Member</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { icon: Heart, label: "Likes", value: selectedSession.likes, color: "pink" },
                        { icon: Eye, label: "Views", value: selectedSession.views, color: "blue" },
                        { icon: MessageCircle, label: "Comments", value: 0, color: "purple" },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className={`p-3 rounded-lg bg-${stat.color}-900/20 border border-${stat.color}-500/30 text-center`}
                        >
                          <div className={`flex items-center justify-center gap-1 mb-1 text-${stat.color}-400`}>
                            <stat.icon className="h-4 w-4" />
                            <span className="font-bold">{stat.value}</span>
                          </div>
                          <p className="text-xs text-white/50">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLike(selectedSession.id)}
                        className={`py-3 rounded-lg font-bold text-sm transition-all ${
                          likedSessions.has(selectedSession.id)
                            ? "bg-red-500/30 text-red-300 border border-red-500/50"
                            : "bg-white/10 text-white/80 border border-white/20 hover:bg-white/20"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 mr-1 inline ${
                            likedSessions.has(selectedSession.id) ? "fill-current" : ""
                          }`}
                        />
                        {likedSessions.has(selectedSession.id) ? "Liked" : "Like"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleShare(selectedSession)}
                        className="py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 font-bold text-sm border border-white/20 transition-all"
                      >
                        <Share2 className="h-4 w-4 mr-1 inline" />
                        Share
                      </motion.button>
                    </div>
                    <Link href={`/product/${selectedSession.productId}`}>
                      <button className="w-full py-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 transition-all">
                        <ShoppingBag className="h-4 w-4 mr-2 inline" />
                        Try This Product
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal - Enhanced */}
      <AnimatePresence>
        {showShareModal && shareSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl max-w-md w-full p-6 border border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">Share Try-On</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden relative bg-black">
                  <Image
                    src={shareSession.resultImage}
                    alt="Try-on"
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="text-center">
                  <p className="text-white/70 text-sm mb-4">
                    Share this amazing try-on by <span className="font-bold text-white">{shareSession.userName}</span>
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={copyShareLink}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    <Share2 className="h-4 w-4 mr-2 inline" />
                    Copy Share Link
                  </motion.button>
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
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="px-6 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-2xl flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                ✨
              </motion.div>
              New try-on by {newSessionAlert.userName}!
              <button
                onClick={() => setNewSessionAlert(null)}
                className="ml-2 p-1 hover:bg-white/20 rounded-full transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
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
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-6 shadow-lg border border-purple-200 dark:border-purple-800/50 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="relative w-full md:w-48 h-64 md:h-48 rounded-2xl overflow-hidden shadow-md">
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
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-semibold text-sm">
                      {productName ||
                        sessions[0]?.productName ||
                        "Product Showcase"}
                    </p>
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    {productName ||
                      sessions[0]?.productName ||
                      "Product Showcase"}
                  </h2>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                    See how this amazing product looks on different people.
                    Community try-ons showcase the perfect fit and style for
                    various body types and preferences.
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
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
                        <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
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
                  </div>

                  {/* CTA Button */}
                  <Link href={`/product/${productId}`}>
                    <Button className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all">
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
                className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg border border-purple-100 dark:border-purple-800 relative group cursor-pointer"
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

                  {/* Product Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-xs font-medium truncate">
                      {session.productName}
                    </p>
                  </div>
                </div>

                {/* Session Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Image
                      src={session.userAvatar}
                      alt={session.userName}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <Link
                      href={`/profile/${session.userId}`}
                      className="text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {session.userName}
                    </Link>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {session.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {session.views}
                      </div>
                    </div>
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
                <Button className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                  Start Your First Try-On
                </Button>
              </Link>
            ) : (
              <Link href="/products">
                <Button className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
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
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
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
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-md hover:shadow-xl transition-all duration-300">
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
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      {product.count}
                    </div>

                    {/* Interactive Button */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="bg-white dark:bg-slate-900 rounded-full p-3 shadow-xl">
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
                        <div className="flex items-center justify-center gap-1 text-pink-500 mb-1">
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
                          <Button className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
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
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
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
