"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Eye,
  ArrowLeft,
  MessageCircle,
  Bookmark,
  Trash2,
  Send,
  Share2,
  User,
  Calendar,
  X,
  Loader2,
  Star,
  ShoppingBag,
  MoreHorizontal,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, API_BASE_URL } from "@/config/api";

// Utility to convert relative image URLs to absolute URLs
const getAbsoluteImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
};

interface SessionDetails {
  id: string;
  userId: string;
  customerImageUrl: string;
  tryOnImageUrl: string;
  productId: string;
  productName: string;
  productImage: string;
  productCategoryId: string;
  fitRecommendation: string;
  likes: number;
  views: number;
  createdAt: string;
  userFullName?: string;
  fullNameRw?: string;
  userName?: string;
  username?: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  userName?: string;
  userImage?: string;
  userFullName?: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
  categoryId: string;
}

export default function SessionDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = searchParams.get("id");

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [likedSessions, setLikedSessions] = useState<Set<string>>(new Set());
  const [savedSessions, setSavedSessions] = useState<Set<string>>(new Set());
  const fetchedSessionRef = useRef<string | null>(null);
  const commentsLoadedRef = useRef<string | null>(null);
  const viewTrackedRef = useRef<string | null>(null);

  // Reset refs when sessionId changes
  useEffect(() => {
    fetchedSessionRef.current = null;
    commentsLoadedRef.current = null;
    viewTrackedRef.current = null;
  }, [sessionId]);

  // Fetch session details
  useEffect(() => {
    if (!sessionId) {
      router.push("/tryon-room");
      return;
    }

    // Prevent duplicate API calls for the same session
    if (fetchedSessionRef.current === sessionId) {
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        fetchedSessionRef.current = sessionId;

        const response = await apiClient.get(
          `/api/try-on-sessions/${sessionId}`
        );
        const sessionData = response.data.session;
        // Convert relative image URLs to absolute URLs, but keep empty if no URL
        const customerImageUrl = sessionData.customerImageUrl
          ? getAbsoluteImageUrl(sessionData.customerImageUrl)
          : "";
        const tryOnImageUrl = sessionData.tryOnImageUrl
          ? getAbsoluteImageUrl(sessionData.tryOnImageUrl)
          : "";

        sessionData.customerImageUrl = customerImageUrl;
        sessionData.tryOnImageUrl = tryOnImageUrl;
        setSession(sessionData);

        // Initialize like/save state from session data
        if (sessionData.isLiked) {
          setLikedSessions(new Set([sessionId]));
        }
        if (sessionData.isSaved) {
          setSavedSessions(new Set([sessionId]));
        }

        // Load comments
        await loadComments(sessionId);

        // Load related products
        if (response.data.session.productCategoryId) {
          await loadRelatedProducts(response.data.session.productCategoryId);
        }

        // Track view
        await trackView(sessionId);
      } catch (error) {
        console.error("Error fetching session details:", error);
        // Reset ref on error so user can retry
        fetchedSessionRef.current = null;
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId]); // Only depend on sessionId

  const loadComments = async (id: string) => {
    // Prevent duplicate comment loading
    if (commentsLoadedRef.current === id) return;

    try {
      setLoadingComments(true);
      commentsLoadedRef.current = id;
      const response = await apiClient.get(
        `/api/try-on-sessions/${id}/comments`
      );
      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Error loading comments:", error);
      commentsLoadedRef.current = null; // Reset on error
    } finally {
      setLoadingComments(false);
    }
  };

  const loadRelatedProducts = async (categoryId: string) => {
    try {
      // Fetch products from same category
      const response = await apiClient.get(
        `/api/products?categoryId=${categoryId}&limit=4`
      );
      setRelatedProducts(response.data.products || []);
    } catch (error) {
      console.error("Error loading related products:", error);
    }
  };

  const trackView = async (id: string) => {
    // Only track view once per session per page load
    if (viewTrackedRef.current === id) return;

    try {
      await apiClient.post(`/api/try-on-sessions/${id}/view`);
      viewTrackedRef.current = id;
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleLike = async () => {
    if (!sessionId || !session) return;

    const isLiked = likedSessions.has(sessionId);
    const method = isLiked ? "DELETE" : "POST";

    try {
      const response = await apiClient({
        method,
        url: `/api/try-on-sessions/${sessionId}/like`,
      });

      if (response.data?.success) {
        const newLikedSet = new Set(likedSessions);
        if (isLiked) {
          newLikedSet.delete(sessionId);
          setSession({
            ...session,
            likes: Math.max(0, session.likes - 1),
          });
        } else {
          newLikedSet.add(sessionId);
          setSession({
            ...session,
            likes: session.likes + 1,
          });
        }
        setLikedSessions(newLikedSet);
      }
    } catch (error: any) {
      console.error("Error liking session:", error);
      // If already liked/saved, update UI state to reflect current server state
      if (error.response?.data?.error?.includes("already liked")) {
        setLikedSessions(new Set([sessionId]));
      }
    }
  };

  const handleSave = async () => {
    if (!sessionId) return;

    const isSaved = savedSessions.has(sessionId);
    const method = isSaved ? "DELETE" : "POST";

    try {
      const response = await apiClient({
        method,
        url: `/api/try-on-sessions/${sessionId}/save`,
      });

      if (response.data?.success) {
        const newSavedSet = new Set(savedSessions);
        if (isSaved) {
          newSavedSet.delete(sessionId);
        } else {
          newSavedSet.add(sessionId);
        }
        setSavedSessions(newSavedSet);
      }
    } catch (error: any) {
      console.error("Error saving session:", error);
      // If already saved, update UI state to reflect current server state
      if (error.response?.data?.error?.includes("already saved")) {
        setSavedSessions(new Set([sessionId]));
      }
    }
  };

  const handlePostComment = async () => {
    if (!sessionId || !commentText.trim() || !user) return;

    try {
      setPostingComment(true);
      await apiClient.post(`/api/try-on-sessions/${sessionId}/comments`, {
        text: commentText,
      });
      setCommentText("");
      await loadComments(sessionId);
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!sessionId) return;

    try {
      await apiClient.delete(
        `/api/try-on-sessions/${sessionId}/comments/${commentId}`
      );
      await loadComments(sessionId);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionId) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this try-on session? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await apiClient.delete(`/api/try-on-sessions/${sessionId}`);
      // Temporarily remove toast to avoid MutationObserver issues
      alert("Session deleted successfully!");
      router.push("/tryon-room");
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete the session. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-slate-600 dark:text-slate-300">
            Loading session details...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Session not found
          </p>
          <Button onClick={() => router.push("/tryon-room")}>
            Back to Try-On Room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 pt-10">
      <div className="pb-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : !session ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-8 text-center">
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Session not found
            </p>
            <Button onClick={() => router.push("/tryon-room")}>
              Back to Try-On Room
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Post Card - Facebook Style */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              {/* Post Header */}
              <div className="p-2 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="h-8 w-8 p-0 flex-shrink-0"
                    title="Go Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    {user?.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={user.username || "User"}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs sm:text-base text-slate-900 dark:text-white truncate">
                      {session.userFullName ||
                        user?.fullNameRw ||
                        user?.username ||
                        "User"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() =>
                      router.push(`/tryon-widget?product=${session.productId}`)
                    }
                    variant="default"
                    size="sm"
                    className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Try On</span>
                  </Button>
                  {session.userId === user?.id && (
                    <Button
                      onClick={handleDeleteSession}
                      variant="destructive"
                      size="sm"
                      className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-full"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col lg:flex-row items-start gap-2 w-full">
                {/* Post Content */}
                <div className="space-y-3 sm:space-y-4 p-2 sm:p-4 w-full">
                  {/* Session Images */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    <div className="rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 relative">
                      {session.customerImageUrl ? (
                        <Image
                          src={session.customerImageUrl}
                          alt="Before"
                          width={300}
                          height={400}
                          className="w-full h-auto object-cover"
                          priority
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center">
                          <User className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                        <p className="text-white text-xs sm:text-sm font-semibold">
                          Before
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 relative">
                      {session.tryOnImageUrl ? (
                        <Image
                          src={session.tryOnImageUrl}
                          alt="After"
                          width={300}
                          height={400}
                          className="w-full h-auto object-cover"
                          priority
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center">
                          <User className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                        <p className="text-white text-xs sm:text-sm font-semibold">
                          After
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fit Recommendation */}
                  {session.fitRecommendation && (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2 sm:p-3 text-xs sm:text-sm">
                      <p className="text-slate-700 dark:text-slate-200 line-clamp-3">
                        {session.fitRecommendation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="w-full">
                  {/* Stats Row */}
                  <div className="px-2 sm:px-4 py-2 border-y border-slate-200 dark:border-slate-700 flex justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 overflow-x-auto">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="flex gap-0.5">
                        <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500 flex items-center justify-center">
                          <Heart className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white fill-white" />
                        </div>
                      </div>
                      <span>{session.likes}</span>
                    </div>
                    <div className="flex gap-2 sm:gap-4 text-right">
                      <span className="whitespace-nowrap">
                        {comments.length} Comments
                      </span>
                      <span className="whitespace-nowrap">
                        {session.views} Views
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="px-2 sm:px-4 py-2 flex gap-0.5 sm:gap-1 overflow-x-auto">
                    <Button
                      onClick={handleLike}
                      variant="ghost"
                      className={`flex-1 gap-1 sm:gap-2 rounded-lg py-1.5 sm:py-2 text-xs sm:text-sm ${
                        likedSessions.has(sessionId || "")
                          ? "text-red-500"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          likedSessions.has(sessionId || "")
                            ? "fill-current"
                            : ""
                        }`}
                      />
                      <span className="hidden sm:inline">Like</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 gap-1 sm:gap-2 rounded-lg py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300"
                    >
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Comment</span>
                    </Button>
                    <Button
                      onClick={handleSave}
                      variant="ghost"
                      className={`flex-1 gap-1 sm:gap-2 rounded-lg py-1.5 sm:py-2 text-xs sm:text-sm ${
                        savedSessions.has(sessionId || "")
                          ? "text-blue-500"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Bookmark
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          savedSessions.has(sessionId || "")
                            ? "fill-current"
                            : ""
                        }`}
                      />
                      <span className="hidden sm:inline">Save</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 gap-1 sm:gap-2 rounded-lg py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300"
                    >
                      <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  </div>

                  {/* Comments Section */}
                  <div className="border-t border-slate-200 dark:border-slate-700 p-2 sm:p-4 space-y-2 sm:space-y-4">
                    {/* Comment Input - Facebook Style */}
                    {user && (
                      <div className="flex gap-2 sm:gap-3">
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                          {user?.profileImage ? (
                            <Image
                              src={user.profileImage}
                              alt={user.username || "Me"}
                              width={32}
                              height={32}
                              className="rounded-full object-cover w-full h-full"
                            />
                          ) : (
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 flex gap-1 sm:gap-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handlePostComment();
                              }
                            }}
                            placeholder="Write a comment..."
                            className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-700 rounded-full border-0 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                          />
                          <Button
                            onClick={handlePostComment}
                            disabled={!commentText.trim() || postingComment}
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-600 h-6 w-6 sm:h-8 sm:w-8 p-0"
                          >
                            {postingComment ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Comments List */}
                    {loadingComments ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      </div>
                    ) : comments.filter((c: any) => !c.isDeleted).length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {comments
                          .filter((c: any) => !c.isDeleted)
                          .map((comment: any) => (
                            <motion.div
                              key={comment.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-1.5 sm:gap-2"
                            >
                              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                              </div>
                              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1.5 sm:p-2">
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                      {comment.userFullName || "User"}
                                    </p>
                                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-0.5 break-words">
                                      {comment.text}
                                    </p>
                                  </div>
                                  {(comment.userId === user?.id ||
                                    session.userId === user?.id) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
                                      className="h-4 w-4 p-0 flex-shrink-0"
                                      title={
                                        comment.userId === user?.id
                                          ? "Delete your comment"
                                          : "Delete this comment"
                                      }
                                    >
                                      <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {new Date(
                                    comment.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center py-3 sm:py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              {/* Moved to header titlebar */}
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  More Products to Try
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {relatedProducts.slice(0, 4).map((product) => (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -2 }}
                      className="bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <Link href={`/try-on?product=${product.id}`}>
                        <div className="relative h-32 bg-slate-200 dark:bg-slate-700">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-slate-400" />
                            </div>
                          )}
                          <div className="absolute top-1 right-1 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                            ${product.price}
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {product.name}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
